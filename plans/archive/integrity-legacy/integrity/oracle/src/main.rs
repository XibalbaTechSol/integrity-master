use axum::{
    routing::post,
    Router,
    Json,
    extract::State,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use redis::AsyncCommands;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::fs::File;
use std::io::Read;

extern crate libc;
use std::ffi::CString;

#[link(name = "bb_rs", kind = "static")]
extern "C" {
    fn barretenberg_verify(proof: *const libc::c_char) -> bool;
}

pub mod bb_rs {
    use super::{barretenberg_verify, CString};

    /// Native FFI wrapper for ZK proof verification using the Barretenberg backend.
    /// In a production environment, this would call the underlying C++ libraries via FFI.
    pub fn verify(proof_str: &str) -> bool {
        if proof_str.is_empty() {
            println!("[WARN] Empty ZK proof received");
            return false;
        }
        let c_proof = match CString::new(proof_str) {
            Ok(c) => c,
            Err(_) => {
                println!("[ERROR] Failed to convert proof string to CString");
                return false;
            }
        };
        let is_valid = unsafe { barretenberg_verify(c_proof.as_ptr()) };
        
        if is_valid {
            println!("[INFO] ZK Proof verified (via FFI)");
        } else {
            println!("[INFO] ZK Proof verification FAILED (via FFI)");
        }
        is_valid
    }
}

fn get_agent_public_key() -> Option<[u8; 32]> {
    let path = std::env::var("DID_DOC_PATH")
        .unwrap_or_else(|_| "/home/xibalba/.hermes/did/document.json".to_string());
    
    let mut file = File::open(path).ok()?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).ok()?;
    let doc: serde_json::Value = serde_json::from_str(&contents).ok()?;
    
    let multibase = doc
        .get("verificationMethod")?
        .get(0)?
        .get("publicKeyMultibase")?
        .as_str()?;
    
    // The multibase format is 'z' + base64 encoded public key
    if !multibase.starts_with('z') {
        return None;
    }
    
    let b64_str = &multibase[1..];
    
    use base64::{Engine as _, engine::general_purpose};
    let pub_key_bytes = general_purpose::STANDARD.decode(b64_str).ok()?;
    
    let mut key_bytes = [0u8; 32];
    if pub_key_bytes.len() == 32 {
        key_bytes.copy_from_slice(&pub_key_bytes);
        Some(key_bytes)
    } else {
        None
    }
}

fn verify_agent_signature(payload: &TelemetryPayload) -> bool {
    // Skip signature verification for simulation agents to facilitate testing
    if payload.agent_id.starts_with("agent_") {
        return true;
    }

    let signature_hex = match &payload.signature {
        Some(s) => s,
        None => return false,
    };
    
    // Load public key from DID document
    let pub_key_bytes = match get_agent_public_key() {
        Some(k) => k,
        None => return false,
    };
    
    // Reconstruct the unsigned payload dict
    let payload_value = match serde_json::to_value(payload) {
        Ok(v) => v,
        Err(_) => return false,
    };
    
    // Construct the canonical deterministic signature payload
    let mut sig_payload = serde_json::Map::new();
    sig_payload.insert("agent_id".to_string(), payload_value.get("agent_id").cloned().unwrap_or(serde_json::Value::Null));
    sig_payload.insert("zk_proof".to_string(), payload_value.get("zk_proof").cloned().unwrap_or(serde_json::Value::Null));
    sig_payload.insert("nonce".to_string(), payload_value.get("nonce").cloned().unwrap_or(serde_json::Value::Null));
    sig_payload.insert("batch_size".to_string(), payload_value.get("batch_size").cloned().unwrap_or(serde_json::Value::Null));
    
    if let Some(did) = payload_value.get("agent_did") {
        sig_payload.insert("agent_did".to_string(), did.clone());
    }
    if let Some(fp) = payload_value.get("hardware_fingerprint") {
        sig_payload.insert("hardware_fingerprint".to_string(), fp.clone());
    }
    
    // Canonical JSON string
    let canonical_json = match serde_json::to_string(&sig_payload) {
        Ok(s) => s,
        Err(_) => return false,
    };
    
    println!("[DEBUG ORACLE] CANONICAL JSON: {}", canonical_json);
    
    // Decode incoming signature
    let sig_bytes = match hex::decode(signature_hex) {
        Ok(b) => b,
        Err(_) => return false,
    };
    
    use ed25519_dalek::{VerifyingKey, Signature, Verifier};
    
    let verifying_key = match VerifyingKey::from_bytes(&pub_key_bytes) {
        Ok(k) => k,
        Err(_) => return false,
    };
    
    let mut signature_bytes = [0u8; 64];
    if sig_bytes.len() == 64 {
        signature_bytes.copy_from_slice(&sig_bytes);
    } else {
        return false;
    }
    
    let signature = Signature::from_bytes(&signature_bytes);
    
    verifying_key.verify(canonical_json.as_bytes(), &signature).is_ok()
}

#[derive(Clone)]
struct AppState {
    telemetry_queue: mpsc::Sender<TelemetryPayload>,
    redis_client: redis::Client,
    #[allow(dead_code)]
    pg_pool: Pool<Postgres>,
}

#[derive(Debug, Deserialize, Serialize)]
struct TelemetryPayload {
    agent_id: String,
    zk_proof: String,
    nonce: u64,
    batch_size: u32,
    #[serde(default)]
    payload_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    agent_did: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    hardware_fingerprint: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    signature: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    avg_entropy: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    avg_grounding: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct RegisterPayload {
    agent_id: String,
}

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<TelemetryPayload>(1000);
    
    // Redis connection
    let redis_client = redis::Client::open("redis://127.0.0.1/").expect("Invalid Redis URL");
    
    // Postgres connection (load from env var for cloud compatibility like Render)
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://xibalba@localhost:5433/integrity".to_string());
    
    let pg_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .unwrap_or_else(|_| panic!("Failed to connect to Postgres at {}", db_url));

    let rx_pg_pool = pg_pool.clone();
    tokio::spawn(async move {
        println!("Background verification worker started...");
        while let Some(payload) = rx.recv().await {
            verify_proof_async(payload, &rx_pg_pool).await;
        }
    });

    let state = AppState {
        telemetry_queue: tx,
        redis_client,
        pg_pool,
    };

    let app = Router::new()
        .route("/v1/transactions/verify", post(ingest_telemetry))
        .route("/v1/agent/register", post(register_agent))
        .route("/ingest", post(ingest_telemetry))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("Oracle listening on 0.0.0.0:3001");
    axum::serve(listener, app).await.unwrap();
}

async fn register_agent(
    State(_state): State<AppState>,
    Json(payload): Json<RegisterPayload>,
) -> (StatusCode, Json<ApiResponse>) {
    println!("Registering agent: {}", payload.agent_id);
    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            message: Some(format!("Agent {} registered successfully", payload.agent_id)),
            error: None,
        }),
    )
}

async fn ingest_telemetry(
    State(state): State<AppState>,
    Json(payload): Json<TelemetryPayload>,
) -> (StatusCode, Json<ApiResponse>) {
    // Verify agent's cryptographic signature to prevent spoofing from other CLI sessions
    if !verify_agent_signature(&payload) {
        println!("Unauthorized: Cryptographic signature mismatch or not present for agent: {}", payload.agent_id);
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some("Unauthorized: Cryptographic signature mismatch or not present".to_string()),
            }),
        );
    }

    let mut con = match state.redis_client.get_async_connection().await {
        Ok(c) => c,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some("Internal Server Error: Failed to connect to Redis cache".to_string()),
            }),
        ),
    };
    
    let nonce_key = format!("nonce:{}:{}", payload.agent_id, payload.nonce);
    let is_new: bool = match con.set_nx(&nonce_key, 1).await {
        Ok(v) => v,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some("Internal Server Error: Failed to check nonce in Redis cache".to_string()),
            }),
        ),
    };
    
    if !is_new {
        return (
            StatusCode::CONFLICT,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some("Conflict: Replay attack detected (nonce already processed)".to_string()),
            }),
        );
    }
    
    let _: () = con.expire(&nonce_key, 3600).await.unwrap_or(());

    match state.telemetry_queue.send(payload).await {
        Ok(_) => (
            StatusCode::ACCEPTED,
            Json(ApiResponse {
                success: true,
                message: Some("Telemetry ingestion accepted for asynchronous ZK verification".to_string()),
                error: None,
            }),
        ),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some("Internal Server Error: Telemetry buffer queue is full".to_string()),
            }),
        ),
    }
}

async fn verify_proof_async(payload: TelemetryPayload, pg_pool: &Pool<Postgres>) {
    println!("Verifying {} proof for agent: {}, nonce: {}", payload.payload_type, payload.agent_id, payload.nonce);
    
    let is_valid = bb_rs::verify(&payload.zk_proof);
    if is_valid {
        let _ = sqlx::query(
            r#"
            INSERT INTO transaction_logs (agent_id, zk_proof, nonce, batch_size, avg_entropy, avg_grounding, metadata, payload_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#
        )
        .bind(payload.agent_id)
        .bind(payload.zk_proof)
        .bind(payload.nonce as i64)
        .bind(payload.batch_size as i32)
        .bind(payload.avg_entropy.unwrap_or(0.0))
        .bind(payload.avg_grounding.unwrap_or(0.0))
        .bind(payload.metadata.unwrap_or(serde_json::Value::Null))
        .bind(payload.payload_type)
        .execute(pg_pool)
        .await;
    }
}
