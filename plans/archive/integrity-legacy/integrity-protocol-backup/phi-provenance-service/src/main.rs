use actix_web::{http::StatusCode, post, web, App, HttpResponse, HttpServer, Responder};
use chrono::Utc;
use ring::digest::{digest, SHA256};
use ring::error::Unspecified;
use ring::rand::SystemRandom;
use ring::signature::{Ed25519KeyPair, KeyPair, Signature};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::Arc;
use tracing::{error, info, instrument};
use tracing_subscriber::{EnvFilter, FmtSubscriber};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PhiPayload {
    pub id: String,
    pub patient_id: String,
    pub data: serde_json::Value, // Raw PHI data, can be any JSON structure
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl PhiPayload {
    // Implement PHI normalization logic here
    pub fn normalize(&mut self) {
        // Recursively sort JSON keys for deterministic hashing
        Self::sort_json_value(&mut self.data);
    }

    // Helper function to recursively sort JSON values
    fn sort_json_value(value: &mut serde_json::Value) {
        match value {
            serde_json::Value::Object(map) => {
                let mut sorted_map: BTreeMap<String, serde_json::Value> = BTreeMap::new();
                // Extract values, sort, and re-insert
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

    // Implement PHI hashing logic using SHA-256
    pub fn hash(&self) -> Vec<u8> {
        // Serialize the normalized payload to a canonical JSON string for hashing
        let mut normalized_payload = self.clone(); // Clone to normalize without affecting original
        normalized_payload.normalize(); // Ensure the cloned payload is normalized
        let serialized =
            serde_json::to_string(&normalized_payload).expect("Failed to serialize PhiPayload");
        digest(&SHA256, serialized.as_bytes()).as_ref().to_vec()
    }
}

// --- Cryptographic Signing Module ---

pub struct SigningService {
    // In a real scenario, this would interact with a KMS
    key_pair: Ed25519KeyPair,
}

impl SigningService {
    pub fn new() -> Self {
        // For development, generate a new key pair. In production, load from KMS.
        let rng = SystemRandom::new();
        let pkcs8_bytes = Ed25519KeyPair::generate_pkcs8(&rng)
            .expect("Failed to generate Ed25519 PKCS8 key pair");
        let key_pair = Ed25519KeyPair::from_pkcs8(pkcs8_bytes.as_ref())
            .expect("Failed to parse Ed25519 PKCS8 key pair");
        SigningService { key_pair }
    }

    #[instrument(skip(self, hashed_data), fields(phi_id = tracing::field::Empty))]
    pub fn sign_hash(&self, hashed_data: &[u8]) -> Signature {
        // In a production scenario, this would interact with a Hardware Security Module (HSM)
        info!("Signing hash...");
        self.key_pair.sign(hashed_data)
    }

    pub fn get_public_key_bytes(&self) -> Vec<u8> {
        self.key_pair.public_key().as_ref().to_vec()
    }
}

// --- Signature Verification Module ---

pub struct VerificationService;

impl VerificationService {
    #[instrument(skip(public_key_bytes, hashed_data, signature_bytes), fields(phi_id = tracing::field::Empty))]
    pub fn verify_signature(
        public_key_bytes: &[u8],
        hashed_data: &[u8],
        signature_bytes: &[u8],
    ) -> Result<(), Unspecified> {
        info!("Verifying signature...");
        let public_key = ring::signature::UnparsedPublicKey::new(
            &ring::signature::ED25519,
            public_key_bytes,
        );
        public_key.verify(hashed_data, signature_bytes)
    }
}

// --- API Models ---

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

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyRequest {
    pub phi_data: PhiPayload,
    pub signature: String,
    pub public_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyResponse {
    pub id: String,
    pub patient_id: String,
    pub is_valid: bool,
    pub message: String,
}

// --- API Endpoints ---

#[post("/sign")]
#[instrument(skip(req, service), fields(phi_id = req.phi_data.id.as_str()))]
async fn sign_phi(req: web::Json<SignRequest>, service: web::Data<Arc<SigningService>>) -> impl Responder {
    info!("Received /sign request.");
    let mut phi_payload = req.phi_data.clone();
    phi_payload.timestamp = Utc::now(); // Ensure timestamp is set at signing time

    let hashed_phi = phi_payload.hash();
    let signature = service.sign_hash(&hashed_phi);

    HttpResponse::Ok().json(SignResponse {
        id: phi_payload.id.clone(),
        patient_id: phi_payload.patient_id.clone(),
        signed_phi_hash: hex::encode(&hashed_phi),
        signature: hex::encode(signature.as_ref()),
        public_key: hex::encode(service.get_public_key_bytes()),
        timestamp: phi_payload.timestamp,
    })
}

#[post("/verify")]
#[instrument(skip(req), fields(phi_id = req.phi_data.id.as_str()))]
async fn verify_phi(req: web::Json<VerifyRequest>) -> impl Responder {
    info!("Received /verify request.");
    let phi_id = req.phi_data.id.clone();
    let patient_id = req.phi_data.patient_id.clone();

    let mut phi_payload = req.phi_data.clone();
    phi_payload.normalize(); // Ensure the received payload is normalized before hashing
    let hashed_phi = phi_payload.hash(); // Hash the normalized payload

    let public_key_bytes = match hex::decode(&req.public_key) {
        Ok(bytes) => bytes,
        Err(e) => {
            error!("Invalid public key format: {:?}", e);
            return HttpResponse::BadRequest().json(VerifyResponse {
                id: phi_id,
                patient_id,
                is_valid: false,
                message: "Invalid public key format".to_string(),
            });
        }
    };

    let signature_bytes = match hex::decode(&req.signature) {
        Ok(bytes) => bytes,
        Err(e) => {
            error!("Invalid signature format: {:?}", e);
            return HttpResponse::BadRequest().json(VerifyResponse {
                id: phi_id,
                patient_id,
                is_valid: false,
                message: "Invalid signature format".to_string(),
            });
        }
    };

    let is_valid = match VerificationService::verify_signature(
        &public_key_bytes,
        &hashed_phi,
        &signature_bytes,
    ) {
        Ok(_) => {
            info!("Signature verified successfully.");
            true
        }
        Err(e) => {
            error!("Signature verification failed: {:?}", e);
            false
        }
    };

    HttpResponse::Ok().json(VerifyResponse {
        id: phi_payload.id,
        patient_id: phi_payload.patient_id,
        is_valid,
        message: if is_valid { "Signature verified successfully".to_string() } else { "Signature verification failed".to_string() },
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing subscriber
    FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    info!("PHI Provenance Microservice: Initializing...");

    // Initialize signing service and share it across workers
    let signing_service = Arc::new(SigningService::new());

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(signing_service.clone()))
            .service(sign_phi)
            .service(verify_phi)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test as actix_test;
    use chrono::{TimeZone, Utc};

    #[test]
    fn test_phi_payload_normalization_and_hashing() {
        let mut phi1 = PhiPayload {
            id: "test1".to_string(),
            patient_id: "PAT001".to_string(),
            data: serde_json::json!({ "name": "John Doe", "age": 30, "city": "New York" }),
            timestamp: Utc.with_ymd_and_hms(2023, 1, 1, 12, 0, 0).unwrap(),
        };
        phi1.normalize();
        let hash1 = phi1.hash();

        let mut phi2 = PhiPayload {
            id: "test1".to_string(),
            patient_id: "PAT001".to_string(),
            // Same data, but keys are in a different order
            data: serde_json::json!({ "age": 30, "city": "New York", "name": "John Doe" }),
            timestamp: Utc.with_ymd_and_hms(2023, 1, 1, 12, 0, 0).unwrap(),
        };
        phi2.normalize();
        let hash2 = phi2.hash();

        // Hashes should be identical after normalization
        assert_eq!(hash1, hash2, "Normalized hashes should be identical for same data");

        let mut phi3 = PhiPayload {
            id: "test2".to_string(),
            patient_id: "PAT002".to_string(),
            data: serde_json::json!({ "name": "Jane Doe" }),
            timestamp: Utc.with_ymd_and_hms(2023, 1, 2, 12, 0, 0).unwrap(),
        };
        phi3.normalize();
        let hash3 = phi3.hash();

        // Hashes should be different for different data
        assert_ne!(hash1, hash3, "Hashes should be different for different data");
    }

    #[test]
    fn test_signing_and_verification_happy_path() {
        let signing_service = SigningService::new();
        let public_key_bytes = signing_service.get_public_key_bytes();

        let raw_phi = serde_json::json!({ "status": "healthy" });
        let phi_payload = PhiPayload {
            id: "happy_test".to_string(),
            patient_id: "PAT003".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };

        let hashed_phi = phi_payload.hash();
        let signature = signing_service.sign_hash(&hashed_phi);
        let signature_bytes = signature.as_ref().to_vec();

        let is_valid = VerificationService::verify_signature(
            &public_key_bytes,
            &hashed_phi,
            &signature_bytes,
        )
        .is_ok();

        assert!(is_valid, "Signature should be valid on happy path");
    }

    #[test]
    fn test_signing_and_verification_tampered_hash() {
        let signing_service = SigningService::new();
        let public_key_bytes = signing_service.get_public_key_bytes();

        let raw_phi = serde_json::json!({ "status": "healthy" });
        let phi_payload = PhiPayload {
            id: "tamper_test".to_string(),
            patient_id: "PAT004".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };

        let hashed_phi = phi_payload.hash();
        let signature = signing_service.sign_hash(&hashed_phi);
        let signature_bytes = signature.as_ref().to_vec();

        // Tamper with the hashed data
        let mut tampered_hashed_phi = hashed_phi.clone();
        tampered_hashed_phi[0] = tampered_hashed_phi[0].wrapping_add(1);

        let is_valid = VerificationService::verify_signature(
            &public_key_bytes,
            &tampered_hashed_phi,
            &signature_bytes,
        )
        .is_ok();

        assert!(!is_valid, "Signature should be invalid for tampered hash");
    }

    #[actix_web::test]
    async fn test_sign_api_endpoint() {
        let signing_service = Arc::new(SigningService::new());
        let app = actix_test::init_service(
            App::new()
                .app_data(web::Data::new(signing_service.clone()))
                .service(sign_phi),
        )
        .await;

        let raw_phi = serde_json::json!({ "blood_pressure": "120/80" });
        let phi_payload = PhiPayload {
            id: "api_test_sign".to_string(),
            patient_id: "PAT005".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };
        let sign_request = SignRequest { phi_data: phi_payload.clone() };

        let req = actix_test::TestRequest::post()
            .uri("/sign")
            .set_json(&sign_request)
            .to_request();
        let resp = actix_test::call_service(&app, req).await;

        assert_eq!(resp.status(), StatusCode::OK);

        let response_body: SignResponse = actix_test::read_body_json(resp).await;
        assert_eq!(response_body.id, phi_payload.id);
        assert!(!response_body.signature.is_empty());
        assert!(!response_body.signed_phi_hash.is_empty());
    }

    #[actix_web::test]
    async fn test_verify_api_endpoint_success() {
        let signing_service = Arc::new(SigningService::new());
        let app = actix_test::init_service(
            App::new()
                .app_data(web::Data::new(signing_service.clone()))
                .service(sign_phi)
                .service(verify_phi),
        )
        .await;

        // First, sign a payload to get valid data
        let raw_phi = serde_json::json!({ "heart_rate": 75 });
        let phi_payload = PhiPayload {
            id: "api_test_verify_success".to_string(),
            patient_id: "PAT006".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };
        let sign_request = SignRequest { phi_data: phi_payload.clone() };

        let req_sign = actix_test::TestRequest::post()
            .uri("/sign")
            .set_json(&sign_request)
            .to_request();
        let resp_sign = actix_test::call_service(&app, req_sign).await;
        let sign_response: SignResponse = actix_test::read_body_json(resp_sign).await;

        // Now, verify the signed payload
        let mut verified_phi_payload = phi_payload.clone();
        verified_phi_payload.timestamp = sign_response.timestamp;

        let verify_request = VerifyRequest {
            phi_data: verified_phi_payload,
            signature: sign_response.signature,
            public_key: sign_response.public_key,
        };

        let req_verify = actix_test::TestRequest::post()
            .uri("/verify")
            .set_json(&verify_request)
            .to_request();
        let resp_verify = actix_test::call_service(&app, req_verify).await;

        assert_eq!(resp_verify.status(), StatusCode::OK);
        let verify_response: VerifyResponse = actix_test::read_body_json(resp_verify).await;
        assert!(verify_response.is_valid);
        assert_eq!(verify_response.id, sign_response.id);
    }

    #[actix_web::test]
    async fn test_verify_api_endpoint_tampered_data() {
        let signing_service = Arc::new(SigningService::new());
        let app = actix_test::init_service(
            App::new()
                .app_data(web::Data::new(signing_service.clone()))
                .service(sign_phi)
                .service(verify_phi),
        )
        .await;

        // First, sign a payload to get valid data
        let raw_phi = serde_json::json!({ "temperature": 98.6 });
        let phi_payload = PhiPayload {
            id: "api_test_verify_tamper".to_string(),
            patient_id: "PAT007".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };
        let sign_request = SignRequest { phi_data: phi_payload.clone() };

        let req_sign = actix_test::TestRequest::post()
            .uri("/sign")
            .set_json(&sign_request)
            .to_request();
        let resp_sign = actix_test::call_service(&app, req_sign).await;
        let sign_response: SignResponse = actix_test::read_body_json(resp_sign).await;

        // Tamper with the PHI data before verification
        let tampered_raw_phi = serde_json::json!({ "temperature": 102.0 });
        let tampered_phi_payload = PhiPayload {
            id: phi_payload.id.clone(),
            patient_id: phi_payload.patient_id.clone(),
            data: tampered_raw_phi,
            timestamp: sign_response.timestamp,
        };

        let verify_request = VerifyRequest {
            phi_data: tampered_phi_payload,
            signature: sign_response.signature,
            public_key: sign_response.public_key,
        };

        let req_verify = actix_test::TestRequest::post()
            .uri("/verify")
            .set_json(&verify_request)
            .to_request();
        let resp_verify = actix_test::call_service(&app, req_verify).await;

        assert_eq!(resp_verify.status(), StatusCode::OK); // API returns 200 OK even if verification fails
        let verify_response: VerifyResponse = actix_test::read_body_json(resp_verify).await;
        assert!(!verify_response.is_valid, "Verification should fail for tampered data");
    }

    #[actix_web::test]
    async fn test_verify_api_endpoint_invalid_public_key_format() {
        let raw_phi = serde_json::json!({ "blood_type": "A+" });
        let phi_payload = PhiPayload {
            id: "api_test_invalid_pk".to_string(),
            patient_id: "PAT008".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };

        let verify_request = VerifyRequest {
            phi_data: phi_payload,
            signature: hex::encode(&[0; 64]), // Dummy valid length signature
            public_key: "invalid-hex-string".to_string(), // Invalid public key
        };

        let app = actix_test::init_service(App::new().service(verify_phi)).await;
        let req_verify = actix_test::TestRequest::post()
            .uri("/verify")
            .set_json(&verify_request)
            .to_request();
        let resp_verify = actix_test::call_service(&app, req_verify).await;

        assert_eq!(resp_verify.status(), StatusCode::BAD_REQUEST);
        let verify_response: VerifyResponse = actix_test::read_body_json(resp_verify).await;
        assert!(!verify_response.is_valid);
        assert_eq!(verify_response.message, "Invalid public key format");
    }

    #[actix_web::test]
    async fn test_verify_api_endpoint_invalid_signature_format() {
        let raw_phi = serde_json::json!({ "blood_type": "B-" });
        let phi_payload = PhiPayload {
            id: "api_test_invalid_sig".to_string(),
            patient_id: "PAT009".to_string(),
            data: raw_phi,
            timestamp: Utc::now(),
        };

        let signing_service = SigningService::new();
        let public_key_bytes = signing_service.get_public_key_bytes();

        let verify_request = VerifyRequest {
            phi_data: phi_payload,
            signature: "invalid-hex-string".to_string(), // Invalid signature
            public_key: hex::encode(public_key_bytes),
        };

        let app = actix_test::init_service(App::new().service(verify_phi)).await;
        let req_verify = actix_test::TestRequest::post()
            .uri("/verify")
            .set_json(&verify_request)
            .to_request();
        let resp_verify = actix_test::call_service(&app, req_verify).await;

        assert_eq!(resp_verify.status(), StatusCode::BAD_REQUEST);
        let verify_response: VerifyResponse = actix_test::read_body_json(resp_verify).await;
        assert!(!verify_response.is_valid);
        assert_eq!(verify_response.message, "Invalid signature format");
    }

}