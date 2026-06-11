use actix_web::{http::StatusCode, post, web, App, HttpResponse, HttpServer, Responder};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::Client as KmsClient;
use chrono::Utc;
use ring::digest::{digest, SHA256};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::Arc;
use tracing::{error, info, instrument};
use tracing_subscriber::{EnvFilter, FmtSubscriber};

// Xibalba Solutions: PHI Provenance & HSM Signing Service (v2.0)
// This service ensures Protected Health Information (PHI) is hashed and signed
// at the point of origin using hardware-backed keys (AWS KMS).

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PhiPayload {
    pub id: String,
    pub patient_id: String,
    pub data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl PhiPayload {
    pub fn normalize(&mut self) {
        Self::sort_json_value(&mut self.data);
    }

    fn sort_json_value(value: &mut serde_json::Value) {
        match value {
            serde_json::Value::Object(map) => {
                let mut sorted_map: BTreeMap<String, serde_json::Value> = BTreeMap::new();
                let temp_map: serde_json::Map<String, serde_json::Value> = std::mem::take(map);
                for (k, mut v) in temp_map.into_iter() {
                    Self::sort_json_value(&mut v);
                    sorted_map.insert(k, v);
                }
                *map = sorted_map.into_iter().collect();
            }
            serde_json::Value::Array(arr) => {
                for item in arr.iter_mut() {
                    Self::sort_json_value(item);
                }
            }
            _ => {}
        }
    }

    pub fn hash(&self) -> Vec<u8> {
        let mut normalized_payload = self.clone();
        normalized_payload.normalize();
        let serialized =
            serde_json::to_string(&normalized_payload).expect("Failed to serialize PhiPayload");
        digest(&SHA256, serialized.as_bytes()).as_ref().to_vec()
    }
}

// --- HSM Signing Service (AWS KMS) ---

pub struct SigningService {
    kms_client: KmsClient,
    key_id: String,
}

impl SigningService {
    pub async fn new() -> Self {
        let config = aws_config::load_from_env().await;
        let kms_client = KmsClient::new(&config);
        let key_id =
            std::env::var("PHI_KMS_KEY_ID").unwrap_or_else(|_| "alias/xibalba-phi-hsm".to_string());

        info!("HSM Signing Service initialized with Key: {}", key_id);
        SigningService { kms_client, key_id }
    }

    #[instrument(skip(self, hashed_data))]
    pub async fn sign_hash(&self, hashed_data: &[u8]) -> Result<Vec<u8>, String> {
        info!("Routing PHI hash to AWS KMS HSM for signing...");

        let resp = self
            .kms_client
            .sign()
            .key_id(&self.key_id)
            .message(Blob::new(hashed_data))
            .message_type(MessageType::Digest)
            .signing_algorithm(SigningAlgorithmSpec::EcdsaSha256)
            .send()
            .await
            .map_err(|e| format!("KMS Signing Error: {:?}", e))?;

        Ok(resp
            .signature()
            .expect("Signature missing")
            .as_ref()
            .to_vec())
    }

    pub async fn get_public_key(&self) -> Result<Vec<u8>, String> {
        let resp = self
            .kms_client
            .get_public_key()
            .key_id(&self.key_id)
            .send()
            .await
            .map_err(|e| format!("KMS GetPublicKey Error: {:?}", e))?;

        Ok(resp
            .public_key()
            .expect("Public key missing")
            .as_ref()
            .to_vec())
    }
}

// --- API Endpoints ---

#[derive(Debug, Serialize, Deserialize)]
pub struct SignRequest {
    pub phi_data: PhiPayload,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignResponse {
    pub id: String,
    pub patient_id: String,
    pub signed_phi_hash: String,
    pub signature: String,
    pub public_key: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[post("/sign")]
#[instrument(skip(req, service), fields(phi_id = req.phi_data.id.as_str()))]
async fn sign_phi(
    req: web::Json<SignRequest>,
    service: web::Data<Arc<SigningService>>,
) -> impl Responder {
    let mut phi_payload = req.phi_data.clone();
    phi_payload.timestamp = Utc::now();

    let hashed_phi = phi_payload.hash();

    match service.sign_hash(&hashed_phi).await {
        Ok(sig_bytes) => {
            let pubkey = service.get_public_key().await.unwrap_or_default();
            HttpResponse::Ok().json(SignResponse {
                id: phi_payload.id.clone(),
                patient_id: phi_payload.patient_id.clone(),
                signed_phi_hash: hex::encode(&hashed_phi),
                signature: hex::encode(sig_bytes),
                public_key: hex::encode(pubkey),
                timestamp: phi_payload.timestamp,
            })
        }
        Err(e) => {
            error!("PHI HSM Signing failed: {}", e);
            HttpResponse::InternalServerError().body(e)
        }
    }
}

// --- EMR Gateway: FHIR-Compliant Interceptor ---

#[post("/emr/sign")]
#[instrument(skip(req, service))]
async fn sign_emr_resource(
    req: web::Json<serde_json::Value>,
    service: web::Data<Arc<SigningService>>,
) -> impl Responder {
    info!("EMR Gateway: Received FHIR resource for signing.");

    // 1. Identify FHIR Resource Type
    let resource_type = req
        .get("resourceType")
        .and_then(|v| v.as_str())
        .unwrap_or("UnknownResource");

    let resource_id = req
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("undefined");

    // 2. Canonicalize and Hash (Institutional Standard)
    let mut data = req.into_inner();
    // Recursively sort keys for deterministic hashing (reusing helper from PhiPayload)
    PhiPayload::sort_json_value(&mut data);

    let serialized = serde_json::to_string(&data).expect("Serialization failed");
    let hashed = digest(&SHA256, serialized.as_bytes()).as_ref().to_vec();
    let hash_hex = hex::encode(&hashed);

    // 3. Hardware-Backed Signing
    match service.sign_hash(&hashed).await {
        Ok(sig_bytes) => {
            info!(
                "EMR Resource {}/{} successfully signed.",
                resource_type, resource_id
            );
            HttpResponse::Ok().json(serde_json::json!({
                "resourceType": resource_type,
                "id": resource_id,
                "status": "XIBALBA_PROVENANCE_VERIFIED",
                "hsm_hash": hash_hex,
                "hsm_signature": hex::encode(sig_bytes),
                "signing_service": "Xibalba PHI Provenance Gateway v2.0",
                "timestamp": Utc::now().to_rfc3339()
            }))
        }
        Err(e) => {
            error!("EMR Gateway Signing Failed: {}", e);
            HttpResponse::InternalServerError().body(e)
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    info!("PHI Provenance HSM Service (Rust): Starting...");

    let signing_service = Arc::new(SigningService::new().await);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(signing_service.clone()))
            .service(sign_phi)
            .service(sign_emr_resource)
    })
    .bind(("0.0.0.0", 8081))?
    .run()
    .await
}
