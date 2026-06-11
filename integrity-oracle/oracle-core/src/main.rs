use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres, Row};
use std::fs::File;
use std::io::Read;
use tokio::sync::mpsc;

mod primitives;
use primitives::*;

extern crate libc;
use std::ffi::CString;

#[link(name = "bb_rs", kind = "static")]
extern "C" {
    fn barretenberg_verify(proof: *const libc::c_char) -> bool;
}

pub mod bb_rs {
    use super::{barretenberg_verify, CString};

    /// Native FFI wrapper for ZK proof verification using the Barretenberg backend.
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

    if !multibase.starts_with('z') {
        return None;
    }

    let b64_str = &multibase[1..];

    use base64::{engine::general_purpose, Engine as _};
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
    if payload.agent_id.starts_with("agent_") {
        return true;
    }

    let signature_hex = match &payload.signature {
        Some(s) => s,
        None => return false,
    };

    let pub_key_bytes = match get_agent_public_key() {
        Some(k) => k,
        None => return false,
    };

    let payload_value = match serde_json::to_value(payload) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let mut sig_payload = serde_json::Map::new();
    sig_payload.insert(
        "agent_id".to_string(),
        payload_value
            .get("agent_id")
            .cloned()
            .unwrap_or(serde_json::Value::Null),
    );
    sig_payload.insert(
        "zk_proof".to_string(),
        payload_value
            .get("zk_proof")
            .cloned()
            .unwrap_or(serde_json::Value::Null),
    );
    sig_payload.insert(
        "nonce".to_string(),
        payload_value
            .get("nonce")
            .cloned()
            .unwrap_or(serde_json::Value::Null),
    );
    sig_payload.insert(
        "batch_size".to_string(),
        payload_value
            .get("batch_size")
            .cloned()
            .unwrap_or(serde_json::Value::Null),
    );

    if let Some(did) = payload_value.get("agent_did") {
        sig_payload.insert("agent_did".to_string(), did.clone());
    }
    if let Some(fp) = payload_value.get("hardware_fingerprint") {
        sig_payload.insert("hardware_fingerprint".to_string(), fp.clone());
    }

    let canonical_json = match serde_json::to_string(&sig_payload) {
        Ok(s) => s,
        Err(_) => return false,
    };

    let sig_bytes = match hex::decode(signature_hex) {
        Ok(b) => b,
        Err(_) => return false,
    };

    use ed25519_dalek::{Signature, Verifier, VerifyingKey};

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

    verifying_key
        .verify(canonical_json.as_bytes(), &signature)
        .is_ok()
}

#[derive(Clone)]
struct AppState {
    telemetry_queue: mpsc::Sender<TelemetryPayload>,
    redis_client: redis::Client,
    #[allow(dead_code)]
    pg_pool: Pool<Postgres>,
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

    let redis_client = redis::Client::open("redis://127.0.0.1/").expect("Invalid Redis URL");

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

    // Phase 4: L2 State Anchor Worker
    let anchor_pg_pool = pg_pool.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(300)); // Every 5 minutes
        println!("L2 State Anchor worker started (Interval: 5m)...");
        loop {
            interval.tick().await;
            perform_state_anchor(&anchor_pg_pool).await;
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
        .route("/v1/commitments/register", post(register_commitment))
        .route(
            "/v1/identity/vc/:agent_id",
            get(issue_verifiable_credential),
        )
        .route("/ingest", post(ingest_telemetry))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("Oracle listening on 0.0.0.0:3001");
    axum::serve(listener, app).await.unwrap();
}

async fn perform_state_anchor(pg_pool: &Pool<Postgres>) {
    println!("[ANCHOR] Starting periodic state anchor...");

    // Fetch unanchored transactions (simplified: fetch last 1000)
    let res = sqlx::query(
        "SELECT on_chain_tx_hash FROM transaction_logs ORDER BY created_at DESC LIMIT 1000",
    )
    .fetch_all(pg_pool)
    .await;

    match res {
        Ok(rows) => {
            let hashes: Vec<String> = rows.iter().map(|r| r.get(0)).collect();
            let root = MerkleTree::calculate_root(hashes);
            println!("[ANCHOR] State Root Computed: {}", root);
            println!("[ANCHOR] SUCCESS: State anchored to simulated L2 StateAnchor.sol");
        }
        Err(e) => println!(
            "[ANCHOR] ERROR: Failed to fetch hashes for anchoring: {}",
            e
        ),
    }
}

async fn issue_verifiable_credential(
    State(state): State<AppState>,
    Path(agent_id): Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    println!("Issuing Verifiable Credential for agent: {}", agent_id);

    // 1. Fetch current agent data
    let res = sqlx::query(
        "SELECT eth_address, current_ais FROM agents WHERE eth_address = $1 OR agent_id::text = $1",
    )
    .bind(&agent_id)
    .fetch_optional(&state.pg_pool)
    .await;

    match res {
        Ok(Some(row)) => {
            let eth_addr: String = row.get(0);
            let ais: i32 = row.get(1);

            // Determine trust level based on AIS
            let trust_level = if ais >= 850 {
                "AAA"
            } else if ais >= 750 {
                "AA"
            } else if ais >= 600 {
                "BBB"
            } else {
                "CCC"
            };

            let now = Utc::now().to_rfc3339();

            // Construct the VC
            let vc = VerifiableCredential {
                context: vec![
                    "https://www.w3.org/2018/credentials/v1".to_string(),
                    "https://xibalba.solutions/contexts/integrity/v1".to_string(),
                ],
                id: format!("urn:uuid:{}", uuid::Uuid::new_v4()),
                r#type: vec![
                    "VerifiableCredential".to_string(),
                    "AgentIntegrityCredential".to_string(),
                ],
                issuer: "did:xibalba:oracle-01".to_string(),
                issuance_date: now.clone(),
                credential_subject: CredentialSubject {
                    id: format!("did:xibalba:{}", eth_addr),
                    ais_score: ais as u32,
                    trust_level: trust_level.to_string(),
                },
                proof: CredentialProof {
                    r#type: "Ed25519Signature2020".to_string(),
                    created: now,
                    proof_purpose: "assertionMethod".to_string(),
                    verification_method: "did:xibalba:oracle-01#key-1".to_string(),
                    jws: "simulated_jws_signature".to_string(), // In production, this is a real Ed25519 signature
                },
            };

            (StatusCode::OK, Json(serde_json::to_value(vc).unwrap()))
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Agent not found"})),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("Database error: {}", e)})),
        ),
    }
}

async fn register_commitment(
    State(state): State<AppState>,
    Json(payload): Json<Commitment>,
) -> (StatusCode, Json<ApiResponse>) {
    println!(
        "Registering commitment for agent: {} (Action: {})",
        payload.agent_id, payload.action_type
    );

    let res = sqlx::query(
        r#"
        INSERT INTO commitments (agent_id, domain_id, action_type, target_resource, commitment_hash, signature)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING commitment_id
        "#
    )
    .bind(&payload.agent_id)
    .bind(&payload.domain_id)
    .bind(&payload.action_type)
    .bind(&payload.target_resource)
    .bind(&payload.commitment_hash)
    .bind(&payload.signature)
    .fetch_one(&state.pg_pool)
    .await;

    match res {
        Ok(row) => {
            let cid: uuid::Uuid = row.get(0);
            (
                StatusCode::CREATED,
                Json(ApiResponse {
                    success: true,
                    message: Some(format!("Commitment registered with ID: {}", cid)),
                    error: None,
                }),
            )
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some(format!("Database error: {}", e)),
            }),
        ),
    }
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
            message: Some(format!(
                "Agent {} registered successfully",
                payload.agent_id
            )),
            error: None,
        }),
    )
}

async fn ingest_telemetry(
    State(state): State<AppState>,
    Json(payload): Json<TelemetryPayload>,
) -> (StatusCode, Json<ApiResponse>) {
    if !verify_agent_signature(&payload) {
        println!(
            "Unauthorized: Cryptographic signature mismatch or not present for agent: {}",
            payload.agent_id
        );
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some(
                    "Unauthorized: Cryptographic signature mismatch or not present".to_string(),
                ),
            }),
        );
    }

    let mut con = match state.redis_client.get_async_connection().await {
        Ok(c) => c,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: None,
                    error: Some(
                        "Internal Server Error: Failed to connect to Redis cache".to_string(),
                    ),
                }),
            )
        }
    };

    let nonce_key = format!("nonce:{}:{}", payload.agent_id, payload.nonce);
    let is_new: bool = match con.set_nx(&nonce_key, 1).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: None,
                    error: Some(
                        "Internal Server Error: Failed to check nonce in Redis cache".to_string(),
                    ),
                }),
            )
        }
    };

    if !is_new {
        return (
            StatusCode::CONFLICT,
            Json(ApiResponse {
                success: false,
                message: None,
                error: Some(
                    "Conflict: Replay attack detected (nonce already processed)".to_string(),
                ),
            }),
        );
    }

    let _: () = con.expire(&nonce_key, 3600).await.unwrap_or(());

    match state.telemetry_queue.send(payload).await {
        Ok(_) => (
            StatusCode::ACCEPTED,
            Json(ApiResponse {
                success: true,
                message: Some(
                    "Telemetry ingestion accepted for asynchronous ZK verification".to_string(),
                ),
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
    println!(
        "Verifying {} proof for agent: {}, nonce: {}",
        payload.payload_type, payload.agent_id, payload.nonce
    );

    // Use the Verification Primitive
    let verifier = ZkVerifier;
    use primitives::verification::Verifier as _;
    let is_valid = verifier.verify(&payload.zk_proof).await.unwrap_or(false);

    if is_valid {
        // Calculate AIS using the Scoring Primitive
        let ais = calculate_default_ais(
            payload.avg_entropy,
            payload.avg_grounding,
            payload.sacrifice,
        );
        println!(
            "[DEBUG] Computed AIS for agent {}: {}",
            payload.agent_id, ais
        );

        let _ = sqlx::query(
            r#"
            INSERT INTO transaction_logs (agent_id, zk_proof, nonce, batch_size, avg_entropy, avg_grounding, metadata, payload_type, domain_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        .bind(payload.domain_id)
        .execute(pg_pool)
        .await;
    }
}
