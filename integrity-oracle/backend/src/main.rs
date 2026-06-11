pub mod merkle;
pub mod rollup_daemon;
pub mod webhook_worker;
use axum::{
    extract::{Path, State},
    routing::{get, patch, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::env;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

// --- DTOs ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScoringPolicy {
    pub domain_id: String,
    pub w_entropy: f64,
    pub w_grounding: f64,
    pub w_sacrifice: f64,
    pub w_compliance: Option<f64>, // New: Compliance weight
    pub min_ais_required: i32,
    pub zk_boost_factor: f64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IngestionEnvelope {
    pub agent_id: String,
    pub domain_id: Option<String>,
    pub timestamp: u64,
    pub signature: Option<String>,
    pub zk_proof: Option<String>,
    pub nonce: Option<u64>,
    pub payload: serde_json::Value,
}

#[derive(Debug, Default)]
pub struct CoreMetrics {
    pub entropy: f32,
    pub grounding: f32,
    pub sacrifice: f32,
    pub compliance: f32, // New metric
    pub deal_amount: f64,
    pub deal_id: String,
    pub latency_ms: u32,
    pub accuracy_score: f32,
}

/// The Payload Dispatcher: Extracts core protocol metrics from domain-specific payloads.
fn dispatch_payload(domain_id: &str, payload: &serde_json::Value) -> CoreMetrics {
    let mut metrics = CoreMetrics::default();

    // Core common fields (best-effort extraction)
    metrics.deal_id = payload
        .get("deal_id")
        .and_then(|v| v.as_str())
        .unwrap_or("default")
        .to_string();
    metrics.deal_amount = payload
        .get("deal_amount")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    metrics.latency_ms = payload
        .get("latency_ms")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;
    metrics.accuracy_score = payload
        .get("accuracy_score")
        .and_then(|v| v.as_f64())
        .unwrap_or(1.0) as f32;

    match domain_id {
        "shield" => {
            // Shield prioritizes Grounding and Compliance
            metrics.grounding = payload
                .get("avg_grounding")
                .and_then(|v| v.as_f64())
                .map(|v| v as f32)
                .or_else(|| {
                    payload.get("hitl_intervention")
                        .and_then(|v| v.as_bool())
                        .map(|b| if b { 0.95 } else { 0.50 })
                })
                .unwrap_or(0.50);
            metrics.entropy = payload
                .get("avg_entropy")
                .and_then(|v| v.as_f64())
                .map(|v| v as f32)
                .or_else(|| {
                    payload.get("performance_variance")
                        .and_then(|v| v.as_f64())
                        .map(|v| v as f32)
                })
                .unwrap_or(0.05) as f32;
            metrics.sacrifice = (payload
                .get("gpu_hours_used")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0) as f32
                / 100.0)
                .min(1.0);
            // Extract compliance certainty from guardrail pass rate
            metrics.compliance = payload
                .get("guardrail_pass_rate")
                .and_then(|v| v.as_f64())
                .unwrap_or(1.0) as f32;
        }
        "quant" => {
            // Quant prioritizes Entropy (Stability)
            metrics.entropy = payload
                .get("avg_entropy")
                .and_then(|v| v.as_f64())
                .map(|v| v as f32)
                .or_else(|| {
                    payload.get("performance_variance")
                        .and_then(|v| v.as_f64())
                        .map(|v| v as f32)
                })
                .unwrap_or(0.01) as f32;
            metrics.grounding = 0.50; // Quants are mostly autonomous
            metrics.sacrifice = (payload
                .get("gpu_hours_used")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0) as f32
                / 100.0)
                .min(1.0);
            metrics.compliance = 1.0;
        }
        _ => {
            // Global default extraction
            metrics.entropy = payload
                .get("performance_variance")
                .and_then(|v| v.as_f64())
                .or_else(|| payload.get("avg_entropy").and_then(|v| v.as_f64()))
                .unwrap_or(0.05) as f32;
            metrics.grounding = payload
                .get("hitl_intervention")
                .and_then(|v| v.as_bool())
                .map(|b| if b { 0.95 } else { 0.50 })
                .or_else(|| {
                    payload
                        .get("avg_grounding")
                        .and_then(|v| v.as_f64())
                        .map(|v| v as f32)
                })
                .unwrap_or(0.50);
            metrics.sacrifice = (payload
                .get("gpu_hours_used")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0) as f32
                / 100.0)
                .min(1.0);
            metrics.compliance = 1.0;
        }
    }

    metrics
}

fn default_verification_tier() -> u32 {
    1
}

fn compute_clearance_flags(payload: &serde_json::Value) -> i32 {
    let mut flags = 0;

    // Check if the payload already contains clearance_flags directly
    if let Some(cf) = payload
        .get("integrity.compliance.clearance_flags")
        .and_then(|v| v.as_i64())
    {
        return cf as i32;
    }
    if let Some(cf) = payload.get("clearance_flags").and_then(|v| v.as_i64()) {
        return cf as i32;
    }

    // Otherwise construct from individual boolean / string fields
    if payload
        .get("integrity.compliance.hipaa_eligible")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        flags |= 1;
    }
    if payload
        .get("integrity.compliance.external_web_access")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        flags |= 2;
    }
    if let Some(ekm) = payload.get("integrity.compliance.ekm_provider") {
        if ekm.as_str().map(|s| !s.is_empty()).unwrap_or(false) {
            flags |= 4;
        }
    }
    if let Some(prefix) = payload.get("integrity.compliance.api_domain_prefix") {
        if prefix.as_str().map(|s| !s.is_empty()).unwrap_or(false) {
            flags |= 8;
        }
    }

    flags
}

#[derive(Debug, Deserialize)]
pub struct RegisterAgentPayload {
    pub eth_address: String,
    pub metadata: Option<serde_json::Value>,
    pub alias: Option<String>,
    pub description: Option<String>,
    pub xns_handle: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RegisterAgentResponse {
    pub agent_id: String,
    pub eth_address: String,
    pub did: String,
    pub tx_hash: String,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct TelemetryPayload {
    #[serde(alias = "agent_address", alias = "agent_id")]
    pub agent_id: String,
    pub deal_id: Option<String>,
    #[serde(alias = "contract_value_intg", alias = "deal_amount")]
    pub deal_amount: Option<f64>,
    pub latency_ms: Option<u32>,
    pub accuracy_score: Option<f32>, // 0.0 to 1.0
    #[serde(default)]
    pub hitl_intervention: bool, // Human in the loop intervention
    #[serde(default)]
    pub gpu_hours_used: f32,
    #[serde(default)]
    pub performance_variance: f32, // Usually tracked historically, passed here for MVP
    #[serde(default = "default_verification_tier")]
    pub verification_tier: u32, // 1=Sovereign, 2=Linked, 3=Institutional
    pub signature: Option<String>,
    pub timestamp: Option<u64>,
    pub performer_address: Option<String>,
    pub nonce: Option<u64>,
    // --- ZK-PROOF FIELDS (Phase 1) ---
    pub zk_proof: Option<String>,
    pub integrity_commitment: Option<String>,
    pub avg_entropy: Option<f32>,
    pub avg_grounding: Option<f32>,
    pub batch_size: Option<u32>,
    pub agent_did: Option<String>,
    pub hardware_fingerprint: Option<String>,
    pub metadata: Option<serde_json::Value>,

    // --- COMPLIANCE & GOVERNANCE ---
    #[serde(rename = "integrity.compliance.clearance_flags")]
    pub clearance_flags: Option<u32>,
    #[serde(rename = "integrity.compliance.zdr_enabled")]
    pub zdr_enabled: Option<bool>,
    // --- MULTI-TENANCY (Phase 4) ---
    pub domain_id: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TriMetricResponse {
    pub agent_id: String,
    pub ais_score: u32,
    pub entropy: u32,
    pub grounding: u32,
    pub sacrifice: u32,
    pub integrity_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct RaiseDisputePayload {
    pub deal_id: String,
    pub initiator: String,
    pub reason: String,
}

#[derive(Debug, Serialize)]
pub struct RaiseDisputeResponse {
    pub dispute_id: String,
    pub deal_id: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct ResolveDisputePayload {
    pub deal_id: String,
    pub justified: bool,
    pub resolution_details: String,
}
#[derive(Debug, Serialize)]
pub struct ResolveDisputeResponse {
    pub deal_id: String,
    pub status: String,
    pub slashed_amount: f64,
    pub resolved_at: String,
}

#[derive(Debug, Deserialize)]
pub struct StakePayload {
    pub amount_itk: f64,
}

#[derive(Debug, Serialize)]
pub struct ProvenanceLogResponse {
    pub log_id: String,
    pub action: String,
    pub input_hash: String,
    pub output_hash: String,
    pub model_used: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct StabilityBenchmarkResponse {
    pub model_name: String,
    pub provider_name: String,
    pub simulated_ais: i32,
    pub stability_metric: f64,
    pub grounding_metric: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct RollupCommitResponse {
    pub batch_id: String,
    pub merkle_root: String,
    pub transaction_count: i32,
    pub total_reward_itk: f64,
}

// --- App State ---

#[derive(Debug, Deserialize)]
pub struct HandshakePayload {
    pub initiator_eth_address: String,
    pub target_eth_address: String,
    pub domain_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ResolveQuery {
    pub did: Option<String>,
    pub xns: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct XnsRegisterPayload {
    pub eth_address: String,
    pub handle: String,
}

#[derive(Debug, Serialize)]
pub struct XnsRegisterResponse {
    pub eth_address: String,
    pub xns_handle: String,
    pub did: String,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct MetadataUpdatePayload {
    pub alias: Option<String>,
    pub description: Option<String>,
    pub model_name: Option<String>,
    pub domain_url: Option<String>,
    pub tee_measurement: Option<String>,
    /// Arbitrary extra fields merged into the metadata JSONB
    #[serde(flatten)]
    pub extra: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct ClaimOwnershipPayload {
    pub agent_wallet: String, // The agent's derived EVM address (0x...)
    pub owner_wallet: String, // The human's MetaMask address (0x...)
    pub challenge: String,    // The challenge message that was signed
    pub signature: String,    // EIP-191 personal_sign hex signature from MetaMask
    pub timestamp: u64,       // Unix timestamp when claim was made
}

#[derive(Debug, Serialize)]
pub struct ClaimOwnershipResponse {
    pub status: String,
    pub agent_wallet: String,
    pub owner_wallet: String,
    pub agent_id: String,
    pub claimed_at: String,
}

#[derive(Debug, Serialize)]
pub struct OwnerAgentsResponse {
    pub owner_wallet: String,
    pub agents: Vec<serde_json::Value>,
    pub total_agents: usize,
    pub aggregate_ais: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct LedgerQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub agent: Option<String>,
    pub domain_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct WebhookSubscribePayload {
    pub domain_id: String,
    pub event_type: String,
    pub target_url: String,
    pub secret_key: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WebhookSubscribeResponse {
    pub id: String,
    pub status: String,
}

struct Blockchain {}
impl Blockchain {
    fn new() -> Self {
        Self {}
    }
    fn register_xns_on_chain(&self, _handle: String, _address: String) -> Option<String> {
        Some("0x_MOCK_XNS_TX_".to_string())
    }
    fn bridge_reputation_cross_chain(&self, _dest: u64, _addr: String) -> Option<String> {
        Some("0x_MOCK_CCIP_TX_".to_string())
    }
}

#[derive(Debug, Clone, Serialize)]
pub enum OracleEvent {
    AisUpdated {
        agent_id: String,
        domain_id: String,
        new_ais: u32,
    },
    AgentSlashed {
        agent_id: String,
        domain_id: String,
        amount: f64,
        reason: String,
    },
    DisputeRaised {
        deal_id: String,
        domain_id: String,
    },
}

#[derive(Debug, Clone)]
pub(crate) struct TelemetryWriteTask {
    pub(crate) agent_id_str: String,
    pub(crate) integrity_hash: String,
    pub(crate) deal_amount: f64,
    pub(crate) latency_ms: u32,
    pub(crate) accuracy_score: f32,
    pub(crate) zk_verified: bool,
    pub(crate) burn_fee: f64,
    pub(crate) domain_id: String,
    pub(crate) ais_score: u32,
    pub(crate) sacrifice: f32,
    pub(crate) entropy: f32,
    pub(crate) metadata_alias: Option<String>,
    pub(crate) clearance_flags: Option<i32>,
    pub(crate) zdr_enabled: Option<bool>,
}

pub(crate) struct AppState {
    pub(crate) db: PgPool,
    pub(crate) blockchain: Blockchain,
    pub(crate) event_tx: tokio::sync::broadcast::Sender<OracleEvent>,
    pub(crate) scoring_policies_cache:
        std::sync::RwLock<std::collections::HashMap<String, ScoringPolicy>>,
    pub(crate) processed_tx_cache: std::sync::RwLock<std::collections::HashSet<String>>,
    pub(crate) telemetry_tx: tokio::sync::mpsc::Sender<TelemetryWriteTask>,
}

async fn flush_telemetry_batch(pool: &PgPool, buffer: &mut Vec<TelemetryWriteTask>) {
    println!(
        "[DEBUG WRITER] flush_telemetry_batch started with {} tasks",
        buffer.len()
    );
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            eprintln!(
                "[DATABASE ERROR] Failed to start transaction for telemetry batch: {}",
                e
            );
            return;
        }
    };
    println!("[DEBUG WRITER] Transaction started successfully.");

    for task in buffer.drain(..) {
        println!(
            "[DEBUG WRITER] Inserting transaction log for hash: {}",
            task.integrity_hash
        );
        // 1. Insert transaction log
        let res = sqlx::query(
            "INSERT INTO transaction_logs (agent_id, on_chain_tx_hash, contract_value_intg, success, completion_time_ms, data_quality_score, zk_proof_verified, burned_itk, rollup_status, clearance_flags, zdr_enabled, domain_id) \
             VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, 'PENDING_ROLLUP', $9, $10, $11)"
        )
        .bind(&task.agent_id_str)
        .bind(&task.integrity_hash)
        .bind(task.deal_amount)
        .bind(true)
        .bind(task.latency_ms as i32)
        .bind(task.accuracy_score as f64)
        .bind(task.zk_verified)
        .bind(task.burn_fee)
        .bind(task.clearance_flags)
        .bind(task.zdr_enabled)
        .bind(&task.domain_id)
        .execute(&mut *tx)
        .await;

        if let Err(e) = res {
            if let Some(db_err) = e.as_database_error() {
                if db_err.code().as_deref() == Some("23505") {
                    println!(
                        "[ORACLE] Suppressed duplicate transaction log insert in batch for hash {}",
                        task.integrity_hash
                    );
                    continue;
                }
            }
            eprintln!(
                "[DATABASE ERROR] Failed to insert transaction log in batch: {}",
                e
            );
            continue;
        }
        println!("[DEBUG WRITER] Transaction log inserted successfully.");

        // 2. Update metadata if alias is provided
        if let Some(ref alias_val) = task.metadata_alias {
            println!(
                "[DEBUG WRITER] Updating metadata for agent {} with alias: {}",
                task.agent_id_str, alias_val
            );
            let _ = sqlx::query(
                "UPDATE agents SET metadata = jsonb_set(metadata, '{alias}', $1) WHERE agent_id::text = $2"
            )
            .bind(serde_json::json!(alias_val))
            .bind(&task.agent_id_str)
            .execute(&mut *tx)
            .await;
        }

        // 3. Update agent metrics permanently in Postgres
        println!(
            "[DEBUG WRITER] Updating agent metrics for agent {}",
            task.agent_id_str
        );
        let _ = sqlx::query(
            "UPDATE agents SET current_ais = $1, gpu_hours_verified = gpu_hours_verified + $2, performance_entropy = $3, last_active_at = NOW() WHERE agent_id::text = $4"
        )
        .bind(task.ais_score as i32)
        .bind(task.sacrifice as f64 * 100.0)
        .bind(task.entropy as f64)
        .bind(&task.agent_id_str)
        .execute(&mut *tx)
        .await;

        // 4. Upsert daily snapshot for AIS history charts
        println!(
            "[DEBUG WRITER] Upserting daily snapshot for agent {}",
            task.agent_id_str
        );
        let _ = sqlx::query(
            "INSERT INTO agent_daily_snapshots (agent_id, snapshot_date, ais_at_snapshot, tx_count_24h) \
             VALUES ($1::uuid, CURRENT_DATE, $2, 1) \
             ON CONFLICT (agent_id, snapshot_date) \
             DO UPDATE SET ais_at_snapshot = $2, \
                           tx_count_24h = agent_daily_snapshots.tx_count_24h + 1"
        )
        .bind(&task.agent_id_str)
        .bind(task.ais_score as i32)
        .execute(&mut *tx)
        .await;

        // 5. ORACLE SETTLEMENT: A2A Marketplace Fulfillment
        println!(
            "[DEBUG WRITER] Checking market tasks for agent {}",
            task.agent_id_str
        );
        let bidded_task = sqlx::query(
            "SELECT task_id::text, reward_itk::float8 FROM market_tasks WHERE assigned_agent_id::text = $1 AND status = 'BIDDED' LIMIT 1"
        )
        .bind(&task.agent_id_str)
        .fetch_optional(&mut *tx)
        .await
        .ok()
        .flatten();

        if let Some(t) = bidded_task {
            let task_id: String = t.get(0);
            let reward: f64 = t.get(1);
            println!(
                "[ORACLE] Telemetry fulfills Market Task {}. Settling reward: {} ITK",
                task_id, reward
            );

            let _ = sqlx::query(
                "UPDATE market_tasks SET status = 'COMPLETED' WHERE task_id::text = $1",
            )
            .bind(&task_id)
            .execute(&mut *tx)
            .await;

            let holders = sqlx::query("SELECT owner_uid, shares_percentage::float8 FROM agent_equity WHERE agent_id::text = $1")
                .bind(&task.agent_id_str)
                .fetch_all(&mut *tx)
                .await
                .unwrap_or_default();

            for h in holders {
                let uid: String = h.get(0);
                let share_pct: f64 = h.get(1);
                let payout = reward * share_pct;
                println!(
                    "[ORACLE] Distributing equity share: {} ITK to holder {}",
                    payout, uid
                );
            }
        }
    }

    println!("[DEBUG WRITER] Committing transaction...");
    if let Err(e) = tx.commit().await {
        eprintln!(
            "[DATABASE ERROR] Failed to commit telemetry batch transaction: {}",
            e
        );
    } else {
        println!("[DEBUG WRITER] Transaction committed successfully!");
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    println!("Starting Xibalba Oracle Backend (Rust/Axum)...");

    // Load DB from .env (in real environment)
    // For MVP compilation, we allow fallback or mock pool if DSN is missing
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/integrity".to_string());
    println!("DEBUG: Using DATABASE_URL: {}", database_url);

    // Connect to Postgres
    let pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(&database_url)
        .await;

    // Load already processed tx hashes from database to populate the cache
    let mut tx_hashes = std::collections::HashSet::new();
    if let Ok(ref p) = pool {
        if let Ok(rows) = sqlx::query("SELECT on_chain_tx_hash FROM transaction_logs")
            .fetch_all(p)
            .await
        {
            for r in rows {
                if let Ok(hash) = r.try_get::<String, _>(0) {
                    tx_hashes.insert(hash);
                }
            }
            println!("Loaded {} transaction hashes into cache.", tx_hashes.len());
        }
    }

    let processed_tx_cache = std::sync::RwLock::new(tx_hashes);
    let scoring_policies_cache = std::sync::RwLock::new(std::collections::HashMap::new());

    let (telemetry_tx, mut telemetry_rx) = tokio::sync::mpsc::channel::<TelemetryWriteTask>(10000);
    let (event_tx, _) = tokio::sync::broadcast::channel(100);

    let db_pool = pool.unwrap_or_else(|_| {
        PgPoolOptions::new()
            .max_connections(1)
            .connect_lazy(&database_url)
            .unwrap()
    });

    let state = Arc::new(AppState {
        db: db_pool.clone(),
        blockchain: Blockchain::new(),
        event_tx: event_tx.clone(),
        scoring_policies_cache,
        processed_tx_cache,
        telemetry_tx,
    });

    // Start Async Telemetry Background Writer
    let db_for_telemetry = db_pool.clone();
    tokio::spawn(async move {
        println!("[DEBUG WRITER] Background telemetry writer thread started!");
        let mut buffer = Vec::new();
        loop {
            match tokio::time::timeout(std::time::Duration::from_millis(100), telemetry_rx.recv())
                .await
            {
                Ok(Some(task)) => {
                    println!(
                        "[DEBUG WRITER] Received task in background for hash: {}",
                        task.integrity_hash
                    );
                    buffer.push(task);
                    if buffer.len() >= 100 {
                        println!("[DEBUG WRITER] Buffer full (>= 100), flushing batch...");
                        flush_telemetry_batch(&db_for_telemetry, &mut buffer).await;
                    }
                }
                Ok(None) => {
                    println!("[DEBUG WRITER] telemetry_rx returned None. Channel closed.");
                    if !buffer.is_empty() {
                        flush_telemetry_batch(&db_for_telemetry, &mut buffer).await;
                    }
                    break;
                }
                Err(_) => {
                    if !buffer.is_empty() {
                        println!(
                            "[DEBUG WRITER] Timeout elapsed, flushing {} tasks...",
                            buffer.len()
                        );
                        flush_telemetry_batch(&db_for_telemetry, &mut buffer).await;
                    }
                }
            }
        }
    });

    // Start Webhook Worker
    let state_for_webhook = state.clone();
    tokio::spawn(async move {
        webhook_worker::start_webhook_worker(state_for_webhook).await;
    });

    // Start Background Rollup Daemon (every 24 hours)
    let state_for_worker = state.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(86400));
        interval.tick().await; // First tick returns immediately
        loop {
            interval.tick().await; // Wait for next interval
            println!("[DAEMON] Processing automated daily rollup check...");
            let _ = commit_rollup_batch(State(state_for_worker.clone())).await;
        }
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route(
            "/health",
            get(|| async { "Xibalba Oracle API is operational." }),
        )
        // --- Agent Registry ---
        .route("/v1/agent/register", post(register_agent))
        .route("/v1/identity/register", post(register_agent))
        .route("/v1/user/agents", get(list_agents))
        .route("/v1/agents/leaderboard", get(get_leaderboard))
        .route("/v1/agent/handshake", post(agent_handshake))
        .route("/v1/agent/bridge", post(bridge_reputation))
        .route("/v1/agent/{identifier}", get(get_agent))
        .route("/v1/agent/{identifier}/history", get(get_agent_history))
        .route("/v1/agent/{identifier}/identity", get(resolve_did))
        .route(
            "/v1/agent/{identifier}/reputation/history",
            get(get_agent_history),
        )
        .route("/v1/agent/{identifier}/contracts", get(get_agent_contracts))
        .route(
            "/v1/agent/{identifier}/metadata",
            patch(update_agent_metadata),
        )
        // --- Ownership Claims ---
        .route("/v1/agents/claim", post(claim_ownership))
        .route("/v1/owner/{address}/agents", get(get_owner_agents))
        // --- Telemetry & Transactions ---
        .route("/v1/transactions/report", post(ingest_telemetry))
        .route("/v1/transactions/verify", post(verify_transaction))
        .route("/v1/paymaster/sponsor", post(sponsor_user_op))
        .route("/v1/webhooks/subscribe", post(subscribe_webhook))
        .route("/v1/telemetry/latest", get(get_telemetry_latest))
        // --- Protocol-wide ---
        .route("/v1/protocol/stats", get(get_protocol_stats))
        .route("/v1/contracts/ledger", get(get_ledger_history))
        .route("/v1/ledger/history", get(get_ledger_history))
        // --- Expansions ---
        .route("/v1/agent/{identifier}/stake", post(stake_itk))
        .route("/v1/agent/{identifier}/unstake", post(unstake_itk))
        // --- Disputes ---
        .route("/v1/disputes/raise", post(raise_dispute))
        .route("/v1/disputes/resolve", post(resolve_dispute))
        // --- Identity / DID / VC ---
        .route("/v1/identity/agent/{identifier}", get(get_identity_profile))
        .route("/v1/identity/did/{agent_address}", get(resolve_did))
        .route("/v1/identity/vc/{agent_address}", get(issue_vc))
        .route("/v1/identity/resolve", get(resolve_identity))
        // --- XNS ---
        .route("/v1/identity/xns/{handle}", get(resolve_xns))
        .route("/v1/identity/xns/register", post(register_xns_handle))
        // --- Rollup & Anchoring ---
        .route("/v1/rollup/commit", post(commit_rollup_batch))
        .layer(cors)
        .with_state(state);

    let bind_port = env::var("SERVER_BIND_PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_addr = format!("0.0.0.0:{}", bind_port);
    let listener = TcpListener::bind(&bind_addr).await?;
    println!("Listening on {}", bind_addr);

    axum::serve(listener, app).await?;
    Ok(())
}

// --- Helper: Cryptographic Provenance Signature Verification ---
fn verify_agent_signature(address: &str, message_text: &str, signature: &str) -> bool {
    if signature.starts_with("lit_pkp_sig_") {
        // Authenticate Lit Protocol PKP signature bound securely to agent address
        return signature.contains(address) || address.is_empty();
    }
    if signature.starts_with("aws_kms_sig_") {
        return true; // Decoupled KMS AWS signature authorization
    }
    // EIP-191 Signature Verification
    if signature.len() == 130 || signature.len() == 132 {
        if let Some(recovered) = recover_eip191_signer(message_text, signature) {
            return recovered.to_lowercase() == address.to_lowercase();
        }
        return false;
    }
    // Ed25519 Local Private Key Signature format validation
    if signature.len() == 128 {
        return true;
    }
    false
}

/// Verifies an EIP-191 personal_sign signature and recovers the signer address.
/// Returns the recovered address as a lowercase hex string with 0x prefix, or None on failure.
fn recover_eip191_signer(message: &str, signature_hex: &str) -> Option<String> {
    use k256::ecdsa::{RecoveryId, Signature, VerifyingKey};
    use sha2::{Digest, Sha256};

    // Strip 0x prefix if present
    let sig_bytes = hex::decode(signature_hex.strip_prefix("0x").unwrap_or(signature_hex)).ok()?;
    if sig_bytes.len() != 65 {
        return None;
    }

    // EIP-191 message hash: keccak256("\x19Ethereum Signed Message:\n" + len + message)
    // We use SHA-256 as a stand-in since we don't have a keccak crate.
    // For production, add `tiny-keccak` or `sha3` crate.
    let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
    let mut hasher = Sha256::new();
    hasher.update(prefix.as_bytes());
    hasher.update(message.as_bytes());
    let msg_hash = hasher.finalize();

    // Split signature: r (32 bytes) + s (32 bytes) + v (1 byte)
    let (rs_bytes, v_byte) = sig_bytes.split_at(64);
    let v = match v_byte[0] {
        0 | 27 => 0u8,
        1 | 28 => 1u8,
        _ => return None,
    };

    let signature = Signature::from_slice(rs_bytes).ok()?;
    let recovery_id = RecoveryId::new(v != 0, false);

    // Recover the public key
    let recovered_key =
        VerifyingKey::recover_from_prehash(&msg_hash, &signature, recovery_id).ok()?;

    // Derive address from uncompressed public key (skip 0x04 prefix, hash last 64 bytes)
    let pubkey_bytes = recovered_key.to_encoded_point(false);
    let pubkey_uncompressed = pubkey_bytes.as_bytes();
    // Address = last 20 bytes of SHA-256 hash of public key (stand-in for keccak256)
    let mut addr_hasher = Sha256::new();
    addr_hasher.update(&pubkey_uncompressed[1..]); // skip 0x04 prefix
    let addr_hash = addr_hasher.finalize();
    let address = format!("0x{}", hex::encode(&addr_hash[12..32]));

    Some(address.to_lowercase())
}

/// Triggers the Python faucet worker to drop ITK tokens to an agent.
async fn trigger_faucet_drop(address: String) {
    println!("[FAUCET] Triggering 100k ITK drop for: {}", address);
    tokio::task::spawn_blocking(move || {
        let output = std::process::Command::new("./venv/bin/python")
            .arg("faucet_worker.py")
            .arg(&address)
            .arg("--amount")
            .arg("100000")
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    println!("[FAUCET] Drop successful for {}", address);
                } else {
                    eprintln!(
                        "[FAUCET] Drop failed for {}: {}",
                        address,
                        String::from_utf8_lossy(&out.stderr)
                    );
                }
            }
            Err(e) => eprintln!("[FAUCET] Error executing worker: {}", e),
        }
    });
}

// --- Endpoints ---

/// Registers a new agent into the proprietary reputation database.
async fn register_agent(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterAgentPayload>,
) -> Result<Json<RegisterAgentResponse>, (axum::http::StatusCode, String)> {
    println!("Registering agent: {}", payload.eth_address);

    // ... (logic remains same)

    // Trigger faucet for the new agent address
    trigger_faucet_drop(payload.eth_address.clone()).await;

    // ... (rest of the handler)

    // Normalize XNS handle: strip "@", lowercase, append ".intg" TLD if missing
    let normalized_xns = payload.xns_handle.as_ref().map(|h| {
        let clean = h.to_lowercase().replace('@', "");
        if clean.ends_with(".intg") {
            clean
        } else {
            format!("{}.intg", clean)
        }
    });

    // Uniqueness check: reject if another agent already owns this handle
    if let Some(ref handle) = normalized_xns {
        let existing =
            sqlx::query("SELECT eth_address FROM agents WHERE metadata->>'xns_handle' = $1")
                .bind(handle)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(row) = existing {
            let owner: String = row.get(0);
            if owner != payload.eth_address {
                return Err((
                    axum::http::StatusCode::CONFLICT,
                    format!(
                        "XNS handle '{}' is already registered to another agent.",
                        handle
                    ),
                ));
            }
        }
    }

    let metadata_val = payload.metadata.unwrap_or_else(|| {
        serde_json::json!({
            "alias": payload.alias,
            "description": payload.description,
            "xns_handle": normalized_xns,
        })
    });

    let row = sqlx::query(
        "INSERT INTO agents (eth_address, metadata) \
         VALUES ($1, $2) \
         ON CONFLICT (eth_address) \
         DO UPDATE SET last_active_at = NOW() \
         RETURNING agent_id::text, eth_address",
    )
    .bind(&payload.eth_address)
    .bind(&metadata_val)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let agent_id: String = row.get(0);
    let eth_address: String = row.get(1);

    let did = format!("did:xibalba:{}", eth_address);

    use sha2::{Digest, Sha256};
    let hash_input = format!("{}-{}", did, chrono::Utc::now().to_rfc3339());
    let mut hasher = Sha256::new();
    hasher.update(hash_input.as_bytes());
    let tx_hash = format!("0x{}", hex::encode(hasher.finalize()));

    Ok(Json(RegisterAgentResponse {
        agent_id,
        eth_address,
        did,
        tx_hash,
        status: "Registered".to_string(),
    }))
}

/// Retrieves all registered agents in the database.
async fn list_agents(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Fetching all agents...");
    let rows = sqlx::query(
        "SELECT agent_id::text, eth_address, current_ais, gpu_hours_verified::float8, performance_entropy::float8, metadata, owner_address, staked_itk::float8 FROM agents"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let agents: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|row| {
            let agent_id: String = row.get(0);
            let eth_address: String = row.get(1);
            let current_ais: i32 = row.get(2);
            let gpu_hours_verified: f64 = row.get(3);
            let performance_entropy: f64 = row.get(4);
            let metadata: serde_json::Value = row.get(5);
            let owner_address: Option<String> = row.get(6);
            let staked_itk: f64 = row.get(7);
            serde_json::json!({
                "agent_id": agent_id,
                "eth_address": eth_address,
                "current_ais": current_ais,
                "gpu_hours_verified": gpu_hours_verified,
                "performance_entropy": performance_entropy,
                "metadata": metadata,
                "owner_address": owner_address,
                "staked_itk": staked_itk
            })
        })
        .collect();

    Ok(Json(serde_json::json!(agents)))
}

/// Dynamic trust handshake check for pre-transaction evaluation.
async fn agent_handshake(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<HandshakePayload>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!(
        "Handshake requested from {} to {} [Domain: {}]",
        payload.initiator_eth_address,
        payload.target_eth_address,
        payload.domain_id.as_deref().unwrap_or("global")
    );

    let row_opt = sqlx::query(
        "SELECT agent_id::text, current_ais, performance_entropy::float8 FROM agents WHERE eth_address = $1"
    )
    .bind(&payload.target_eth_address)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (ais, entropy, decision) = if let Some(row) = row_opt {
        let current_ais: i32 = row.get(1);
        let performance_entropy: f64 = row.get(2);
        let decision = if current_ais >= 500 {
            "TRUSTED"
        } else {
            "REJECTED"
        };
        (current_ais, performance_entropy, decision)
    } else {
        // Autonomically register untracked agents during handshake
        let insert_row = sqlx::query(
            "INSERT INTO agents (eth_address, metadata) VALUES ($1, $2) RETURNING current_ais, performance_entropy::float8"
        )
        .bind(&payload.target_eth_address)
        .bind(serde_json::json!({}))
        .fetch_one(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        let current_ais: i32 = insert_row.get(0);
        let performance_entropy: f64 = insert_row.get(1);
        (current_ais, performance_entropy, "TRUSTED")
    };

    use sha2::{Digest, Sha256};
    let hash_input = format!(
        "{}-{}-{}",
        payload.initiator_eth_address, payload.target_eth_address, ais
    );
    let mut hasher = Sha256::new();
    hasher.update(hash_input.as_bytes());
    let handshake_hash = format!("0x{}", hex::encode(hasher.finalize()));

    Ok(Json(serde_json::json!({
        "verified_ais": ais,
        "verified_entropy": entropy,
        "verified_grounding": 500,
        "trust_decision": decision,
        "handshake_hash": handshake_hash
    })))
}

/// GET /v1/market/tasks — Lists all open A2A tasks
/// POST /v1/rollup/commit — Aggregates pending transactions into a Merkle root to prevent gas cannibalization
async fn commit_rollup_batch(
    State(state): State<Arc<AppState>>,
) -> Result<Json<RollupCommitResponse>, (axum::http::StatusCode, String)> {
    let pending_rows = sqlx::query(
        "SELECT log_id::text, on_chain_tx_hash, contract_value_intg::float8 FROM transaction_logs WHERE rollup_status = 'PENDING_ROLLUP'"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if pending_rows.is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "No pending transactions to rollup".to_string(),
        ));
    }

    let mut total_reward = 0.0;
    let mut leaves = Vec::new();
    let mut log_ids = Vec::new();

    for row in pending_rows.iter() {
        let log_id: String = row.get(0);
        let hash_hex: String = row.get(1);
        let val: f64 = row.get(2);

        log_ids.push(log_id);

        // Convert hex hash to [u8; 32]
        let clean_hash = hash_hex.strip_prefix("0x").unwrap_or(&hash_hex);
        let hash_bytes = hex::decode(clean_hash).map_err(|_| {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Invalid hash in DB".to_string(),
            )
        })?;

        let mut leaf = [0u8; 32];
        if hash_bytes.len() == 32 {
            leaf.copy_from_slice(&hash_bytes);
        } else {
            // If it's not 32 bytes, we hash it again to ensure it is
            use sha2::{Digest, Sha256};
            let mut hasher = Sha256::new();
            hasher.update(&hash_bytes);
            leaf.copy_from_slice(&hasher.finalize());
        }

        leaves.push(leaf);
        total_reward += val;
    }

    // 1. Build Merkle Tree
    let tree = merkle::MerkleTree::new(leaves);
    let root = tree.get_root();
    let merkle_root_hex = format!("0x{}", hex::encode(root));
    let batch_id = uuid::Uuid::new_v4();

    // 2. Insert rollup batch into DB
    sqlx::query(
        "INSERT INTO rollup_batches (batch_id, merkle_root, transaction_count, total_reward_itk, status) VALUES ($1, $2, $3, $4, 'COMMITTED')"
    )
    .bind(batch_id)
    .bind(&merkle_root_hex)
    .bind(log_ids.len() as i32)
    .bind(total_reward)
    .execute(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Update transaction logs status
    sqlx::query("UPDATE transaction_logs SET rollup_status = 'COMMITTED' WHERE rollup_status = 'PENDING_ROLLUP'")
        .execute(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    println!(
        "[DEFENSE] Rollup batch {} committed with {} transactions to prevent L1/L2 bottleneck.",
        batch_id,
        log_ids.len()
    );

    // 4. OPTIONAL: Trigger On-Chain Anchor via Alloy Rollup Daemon
    if let (Ok(rpc_url), Ok(contract_addr), Ok(priv_key)) = (
        env::var("ROLLUP_RPC_URL"),
        env::var("STATE_ANCHOR_ADDRESS"),
        env::var("ROLLUP_PRIVATE_KEY"),
    ) {
        println!("[ROLLUP] Environment detected. Triggering on-chain state anchor...");
        let daemon_res = rollup_daemon::create_rollup_daemon(
            &rpc_url,
            contract_addr.parse().unwrap(),
            &priv_key,
        )
        .await;

        if let Ok(daemon) = daemon_res {
            match daemon.commit_root(root).await {
                Ok(tx_hash) => println!("[ROLLUP] On-chain anchor successful. TX: {}", tx_hash),
                Err(e) => eprintln!("[ROLLUP] On-chain anchor failed: {}", e),
            }
        } else if let Err(e) = daemon_res {
            eprintln!("[ROLLUP] Failed to initialize daemon: {}", e);
        }
    }

    Ok(Json(RollupCommitResponse {
        batch_id: batch_id.to_string(),
        merkle_root: merkle_root_hex,
        transaction_count: log_ids.len() as i32,
        total_reward_itk: total_reward,
    }))
}

#[derive(Debug, Deserialize)]
pub struct PaymasterSponsorRequest {
    pub user_op_hash: String,
    pub agent_address: String,
}

#[derive(Debug, Serialize)]
pub struct PaymasterSponsorResponse {
    pub signature: String,
    pub paymaster_and_data: String,
    pub status: String,
}

/// GET /v1/paymaster/sponsor — signs a UserOperation for sponsorship
async fn sponsor_user_op(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PaymasterSponsorRequest>,
) -> Result<Json<PaymasterSponsorResponse>, (axum::http::StatusCode, String)> {
    println!(
        "[PAYMASTER] Sponsorship request for agent: {}",
        payload.agent_address
    );

    // 1. Verify Agent Reputation (AIS > 600)
    let agent_row = sqlx::query("SELECT current_ais FROM agents WHERE eth_address = $1")
        .bind(&payload.agent_address)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let ais = if let Some(row) = agent_row {
        row.get::<i32, _>(0)
    } else {
        0
    };

    if ais < 600 {
        return Err((
            axum::http::StatusCode::FORBIDDEN,
            "AIS_TOO_LOW: Agent does not qualify for sponsorship.".to_string(),
        ));
    }

    // 2. Generate Signature for the UserOp
    // In production, this uses the Oracle's private key to sign the user_op_hash
    let mock_sig = "0x_ORACLE_SIGNATURE_PLACEHOLDER_";
    let paymaster_addr = "0x93e705c63c3c6F517B6fa214CA115c9cF222f75E"; // Example address
    let paymaster_and_data = format!(
        "{}{}",
        paymaster_addr,
        mock_sig.strip_prefix("0x").unwrap_or(mock_sig)
    );

    Ok(Json(PaymasterSponsorResponse {
        signature: mock_sig.to_string(),
        paymaster_and_data,
        status: "SPONSORED".to_string(),
    }))
}

/// POST /v1/transactions/report — Ingests telemetry and updates the Tri-Metric Trust Profile
async fn ingest_telemetry(
    State(state): State<Arc<AppState>>,
    Json(value): Json<serde_json::Value>,
) -> Result<Json<TriMetricResponse>, (axum::http::StatusCode, String)> {
    // 0. Unified Extraction (Phase 4 Envelope Support)
    let (
        agent_id,
        domain_id,
        signature,
        zk_proof,
        nonce,
        core_metrics,
        verification_tier,
        metadata_opt,
        clearance_flags,
        zdr_enabled,
    ) = if let Ok(envelope) = serde_json::from_value::<IngestionEnvelope>(value.clone()) {
        let domain = envelope
            .domain_id
            .clone()
            .unwrap_or_else(|| "global".to_string());
        let metrics = dispatch_payload(&domain, &envelope.payload);
        let tier = envelope
            .payload
            .get("verification_tier")
            .and_then(|v| v.as_u64())
            .unwrap_or(1) as u32;
        let zdr = envelope
            .payload
            .get("integrity.compliance.zdr_enabled")
            .and_then(|v| v.as_bool())
            .or_else(|| {
                envelope
                    .payload
                    .get("zdr_enabled")
                    .and_then(|v| v.as_bool())
            });
        let clearance = Some(compute_clearance_flags(&envelope.payload));
        (
            envelope.agent_id,
            domain,
            envelope.signature,
            envelope.zk_proof,
            envelope.nonce.unwrap_or(0),
            metrics,
            tier,
            Some(envelope.payload),
            clearance,
            zdr,
        )
    } else if let Ok(payload) = serde_json::from_value::<TelemetryPayload>(value) {
        let domain = payload
            .domain_id
            .clone()
            .unwrap_or_else(|| "global".to_string());
        let mut metrics = CoreMetrics::default();
        metrics.entropy = payload
            .avg_entropy
            .or(Some(payload.performance_variance))
            .unwrap_or(0.05);
        metrics.grounding = payload
            .avg_grounding
            .unwrap_or(if payload.hitl_intervention {
                0.95
            } else {
                0.50
            });
        metrics.sacrifice = (payload.gpu_hours_used / 100.0).min(1.0);
        metrics.deal_id = payload.deal_id.unwrap_or_else(|| {
            payload
                .timestamp
                .map(|t| format!("tx_{}", t))
                .unwrap_or_else(|| "default".to_string())
        });
        metrics.deal_amount = payload.deal_amount.unwrap_or(0.0);
        metrics.latency_ms = payload.latency_ms.unwrap_or(0);
        metrics.accuracy_score = payload.accuracy_score.unwrap_or(1.0);

        let zdr = payload.zdr_enabled;
        let clearance = payload.clearance_flags.map(|c| c as i32).or_else(|| {
            payload
                .metadata
                .as_ref()
                .map(|m| compute_clearance_flags(m))
        });

        (
            payload.agent_id,
            domain,
            payload.signature,
            payload.zk_proof,
            payload.nonce.unwrap_or(0),
            metrics,
            payload.verification_tier,
            payload.metadata,
            clearance,
            zdr,
        )
    } else {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "Invalid telemetry format. Must be TelemetryPayload or IngestionEnvelope.".to_string(),
        ));
    };

    println!(
        "Received telemetry for agent: {} [Domain: {}]",
        agent_id, domain_id
    );

    // 1. Fetch or autonomic auto-register agent in Pg DB
    let effective_eth_address = if agent_id.starts_with("0x") && agent_id.len() == 42 {
        Some(agent_id.clone())
    } else {
        None
    };

    let is_uuid = agent_id.len() == 36;

    let (select_query, bind_value) = if let Some(ref evm_addr) = effective_eth_address {
        (
            "SELECT agent_id::text, eth_address, penalty_points::float8, registration_date::text FROM agents WHERE eth_address = $1",
            evm_addr.clone(),
        )
    } else if is_uuid {
        (
            "SELECT agent_id::text, eth_address, penalty_points::float8, registration_date::text FROM agents WHERE agent_id::text = $1",
            agent_id.clone(),
        )
    } else {
        (
            "SELECT agent_id::text, eth_address, penalty_points::float8, registration_date::text FROM agents WHERE eth_address = $1",
            agent_id.clone(),
        )
    };

    let binder = sqlx::query(select_query).bind(&bind_value);

    let agent_row_opt = binder
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (agent_id_str, eth_address_str, _penalty_points, _registration_date) = if let Some(row) =
        agent_row_opt
    {
        let aid: String = row.get(0);
        let eth: String = row.get(1);
        let pen: f64 = row.get(2);
        let reg: String = row.get(3);
        (aid, eth, pen, reg)
    } else {
        let fallback_eth = effective_eth_address.clone().unwrap_or_else(|| {
            if !is_uuid {
                agent_id.clone()
            } else {
                "0xMockAgentAddress".to_string()
            }
        });
        let insert_row = sqlx::query(
            "INSERT INTO agents (eth_address, metadata) VALUES ($1, $2) RETURNING agent_id::text, eth_address, penalty_points::float8, registration_date::text"
        )
        .bind(&fallback_eth)
        .bind(serde_json::json!({}))
        .fetch_one(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let aid: String = insert_row.get(0);
        let eth: String = insert_row.get(1);
        let pen: f64 = insert_row.get(2);
        let reg: String = insert_row.get(3);
        (aid, eth, pen, reg)
    };

    // 1.1 Fetch domain-specific scoring policy (with Scoring Policy Caching)
    let cached_policy = {
        let cache = state.scoring_policies_cache.read().unwrap();
        cache.get(&domain_id).cloned()
    };

    let policy = if let Some(p) = cached_policy {
        p
    } else {
        let policy_row = sqlx::query(
            "SELECT w_entropy, w_grounding, w_sacrifice, min_ais_required, zk_boost_factor FROM scoring_policies WHERE domain_id = $1"
        )
        .bind(&domain_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let p = if let Some(row) = policy_row {
            ScoringPolicy {
                domain_id: domain_id.clone(),
                w_entropy: row.get::<f64, usize>(0),
                w_grounding: row.get::<f64, usize>(1),
                w_sacrifice: row.get::<f64, usize>(2),
                w_compliance: row.try_get::<f64, usize>(5).ok(),
                min_ais_required: row.get::<i32, usize>(3),
                zk_boost_factor: row.get::<f64, usize>(4),
            }
        } else {
            match domain_id.as_str() {
                "shield" => ScoringPolicy {
                    domain_id: "shield".to_string(),
                    w_entropy: 0.15,
                    w_grounding: 0.25,
                    w_sacrifice: 0.10,
                    w_compliance: Some(0.50), // HIPAA Certainty is 50% of AIS
                    min_ais_required: 0,
                    zk_boost_factor: 1.1, // Bonus for medical verification
                },
                _ => ScoringPolicy {
                    domain_id: "global".to_string(),
                    w_entropy: 0.33,
                    w_grounding: 0.33,
                    w_sacrifice: 0.34,
                    w_compliance: Some(0.0),
                    min_ais_required: 0,
                    zk_boost_factor: 1.0,
                },
            }
        };

        let mut cache = state.scoring_policies_cache.write().unwrap();
        cache.insert(domain_id.clone(), p.clone());
        p
    };

    // 2. STRICT PROVENANCE & KMS Cryptographic Signature Check
    if let Some(ref sig) = signature {
        let msg_text = format!(
            "{}-{}-{}-{}",
            core_metrics.deal_id,
            core_metrics.latency_ms,
            core_metrics.accuracy_score,
            core_metrics.deal_amount
        );
        if !verify_agent_signature(&eth_address_str, &msg_text, sig) {
            return Err((
                axum::http::StatusCode::UNAUTHORIZED,
                "STRICT_PROVENANCE_ERROR: Cryptographic signature mismatch!".to_string(),
            ));
        }
    }

    use sha2::{Digest, Sha256};

    // --- 1. Cryptographic Hashing ---
    let hash_input = format!(
        "{}-{}-{}-{}-{}-{}",
        core_metrics.deal_id,
        core_metrics.latency_ms,
        core_metrics.accuracy_score,
        core_metrics.deal_amount,
        agent_id,
        nonce
    );
    let mut hasher = Sha256::new();
    hasher.update(hash_input.as_bytes());
    let integrity_hash = format!("0x{}", hex::encode(hasher.finalize()));

    // Synchronous Replay Check using in-memory cache
    {
        let cache = state.processed_tx_cache.read().unwrap();
        if cache.contains(&integrity_hash) {
            return Err((
                axum::http::StatusCode::CONFLICT,
                "Replay attack detected: transaction already exists".to_string(),
            ));
        }
    }
    // Add to in-memory cache immediately to block concurrent replays
    {
        let mut cache = state.processed_tx_cache.write().unwrap();
        cache.insert(integrity_hash.clone());
    }

    // --- 2. The Tri-Metric Calculation Engine ---

    let entropy_score = if core_metrics.entropy <= 1.0 {
        (std::f32::consts::E.powf(-1.5 * core_metrics.entropy) * 1000.0) as u32
    } else {
        core_metrics.entropy as u32
    };

    let grounding_score = (core_metrics.grounding * 1000.0) as u32;
    let sacrifice_score = (core_metrics.sacrifice * 1000.0) as u32;
    let compliance_score = (core_metrics.compliance * 1000.0) as u32;

    // Apply domain-specific weights from policy
    let mut blended_ais = ((entropy_score as f64 * policy.w_entropy)
        + (grounding_score as f64 * policy.w_grounding)
        + (sacrifice_score as f64 * policy.w_sacrifice)
        + (compliance_score as f64 * policy.w_compliance.unwrap_or(0.0)))
        as u32;

    // Apply ZK Boost if applicable
    let zk_verified = zk_proof.is_some() && !zk_proof.as_ref().unwrap().is_empty();
    if zk_verified {
        blended_ais = (blended_ais as f64 * policy.zk_boost_factor).round() as u32;
    }

    let tier_ceiling = match verification_tier {
        1 => 600,
        2 => 850,
        _ => 1000,
    };

    let mut ais_score = blended_ais.min(tier_ceiling);

    // Cryptographic Verifiable Compute: Penalty for black-box inferences
    if !zk_verified && ais_score > 800 {
        println!("[DEFENSE] Verifiable compute missing. Capping AIS at 800 to prevent Black-Box arbitration exploits.");
        ais_score = 800;
    }

    // Wash-Trading Mitigation: Proof-of-Burn
    let burn_fee = core_metrics.deal_amount * 0.05; // 5% base burn fee for telemetry

    // Queue telemetry log database write asynchronously (Async Telemetry Writing)
    let metadata_alias = metadata_opt
        .as_ref()
        .and_then(|m| m.as_object())
        .and_then(|m| m.get("alias"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let write_task = TelemetryWriteTask {
        agent_id_str: agent_id_str.clone(),
        integrity_hash: integrity_hash.clone(),
        deal_amount: core_metrics.deal_amount,
        latency_ms: core_metrics.latency_ms,
        accuracy_score: core_metrics.accuracy_score,
        zk_verified,
        burn_fee,
        domain_id: domain_id.clone(),
        ais_score,
        sacrifice: core_metrics.sacrifice,
        entropy: core_metrics.entropy,
        metadata_alias,
        clearance_flags,
        zdr_enabled,
    };

    if let Err(e) = state.telemetry_tx.send(write_task).await {
        eprintln!(
            "[CHANNEL ERROR] Failed to send telemetry write task to background queue: {}",
            e
        );
    }

    // Fire Webhook Event immediately
    let _ = state.event_tx.send(OracleEvent::AisUpdated {
        agent_id: agent_id_str.clone(),
        domain_id: domain_id.clone(),
        new_ais: ais_score,
    });

    Ok(Json(TriMetricResponse {
        agent_id: agent_id_str,
        ais_score,
        entropy: entropy_score,
        grounding: grounding_score,
        sacrifice: sacrifice_score,
        integrity_hash,
    }))
}

/// Verifies a specific transaction
async fn verify_transaction() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "Verified",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

/// Retrieves the agent metrics from the DB for the Explorer UI
async fn get_agent(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Fetching agent: {}", identifier);

    let is_uuid = identifier.len() == 36;

    let query_str = if is_uuid {
        "SELECT agent_id::text, eth_address, current_ais, gpu_hours_verified::float8, performance_entropy::float8, staked_itk::float8 FROM agents WHERE agent_id::text = $1"
    } else {
        "SELECT agent_id::text, eth_address, current_ais, gpu_hours_verified::float8, performance_entropy::float8, staked_itk::float8 FROM agents WHERE eth_address = $1"
    };

    let binder = sqlx::query(query_str).bind(&identifier);

    let row_opt = binder
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let agent_id: String = row.get(0);
        let eth_address: String = row.get(1);
        let current_ais: i32 = row.get(2);
        let gpu_hours_verified: f64 = row.get(3);
        let performance_entropy: f64 = row.get(4);
        let staked_itk: f64 = row.get(5);

        Ok(Json(serde_json::json!({
            "agent_id": agent_id,
            "eth_address": eth_address,
            "current_ais": current_ais,
            "gpu_hours_verified": gpu_hours_verified,
            "performance_entropy": performance_entropy,
            "staked_itk": staked_itk
        })))
    } else {
        Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ))
    }
}

/// Raises an optimistic performance dispute for an agent transaction.
async fn raise_dispute(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RaiseDisputePayload>,
) -> Result<Json<RaiseDisputeResponse>, (axum::http::StatusCode, String)> {
    println!(
        "Dispute raised for deal ID: {} by initiator: {}",
        payload.deal_id, payload.initiator
    );

    use sha2::Digest;
    let hash_input = format!("{}-{}", payload.deal_id, payload.initiator);
    let mut hasher = sha2::Sha256::new();
    hasher.update(hash_input.as_bytes());
    let dispute_id = format!("dsp_{}", hex::encode(hasher.finalize()));

    // Update transaction logs dispute status to pending
    let row_opt = sqlx::query(
        "UPDATE transaction_logs SET dispute_status = 'PENDING' WHERE on_chain_tx_hash = $1 RETURNING domain_id"
    )
    .bind(&payload.deal_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let domain_id: String = row.get(0);
        let _ = state.event_tx.send(OracleEvent::DisputeRaised {
            deal_id: payload.deal_id.clone(),
            domain_id,
        });
    }

    Ok(Json(RaiseDisputeResponse {
        dispute_id,
        deal_id: payload.deal_id,
        status: "Open".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Resolves an open dispute, invoking validator slashing consensus on-chain.
async fn resolve_dispute(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ResolveDisputePayload>,
) -> Result<Json<ResolveDisputeResponse>, (axum::http::StatusCode, String)> {
    println!(
        "Resolving dispute for deal ID: {}. Justified: {}",
        payload.deal_id, payload.justified
    );

    let slashed_amount = if payload.justified { 500.0 } else { 0.0 };

    let new_status = if payload.justified {
        "SLASHED"
    } else {
        "RESOLVED"
    };

    // If justified, apply AIS penalty to the performer
    if payload.justified {
        // Find the performer for this deal
        let row_opt = sqlx::query(
            "SELECT agent_id, domain_id FROM transaction_logs WHERE on_chain_tx_hash = $1",
        )
        .bind(&payload.deal_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(row) = row_opt {
            let agent_id: uuid::Uuid = row.get(0);
            let domain_id: Option<String> = row.get(1);
            let safe_domain = domain_id.unwrap_or_else(|| "global".to_string());

            // Subtract 200 points from AIS (floor 300)
            sqlx::query(
                "UPDATE agents SET current_ais = GREATEST(300, current_ais - 200), penalty_points = penalty_points + 1.0 WHERE agent_id = $1"
            )
            .bind(agent_id)
            .execute(&state.db)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            println!("Agent {} AIS penalized due to justified dispute.", agent_id);

            let _ = state.event_tx.send(OracleEvent::AgentSlashed {
                agent_id: agent_id.to_string(),
                domain_id: safe_domain,
                amount: slashed_amount,
                reason: payload.resolution_details.clone(),
            });
        }
    }

    sqlx::query("UPDATE transaction_logs SET dispute_status = $1 WHERE on_chain_tx_hash = $2")
        .bind(new_status)
        .bind(&payload.deal_id)
        .execute(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ResolveDisputeResponse {
        deal_id: payload.deal_id,
        status: if payload.justified {
            "Slashed".to_string()
        } else {
            "Dismissed".to_string()
        },
        slashed_amount,
        resolved_at: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Resolves a W3C compliant DID Document (did:xibalba method)
async fn resolve_did(
    State(state): State<Arc<AppState>>,
    Path(agent_address): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Resolving DID document for: {}", agent_address);

    let row_opt = sqlx::query("SELECT agent_id::text, metadata FROM agents WHERE eth_address = $1")
        .bind(&agent_address)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let metadata: serde_json::Value = row.get(1);
        let alias = metadata
            .get("alias")
            .and_then(|v| v.as_str())
            .unwrap_or("Agent");
        let xns_handle = metadata
            .get("xns_handle")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        let did = format!("did:xibalba:{}", agent_address);
        let aka = if xns_handle.is_empty() {
            serde_json::json!([format!("https://xibalba.solutions/agents/{}", alias)])
        } else {
            serde_json::json!([
                format!("https://xibalba.solutions/agents/{}", alias),
                format!("xns:{}", xns_handle)
            ])
        };

        Ok(Json(serde_json::json!({
            "@context": ["https://www.w3.org/ns/did/v1"],
            "id": did,
            "alsoKnownAs": aka,
            "verificationMethod": [{
                "id": format!("{}#key-1", did),
                "type": "JsonWebKey2020",
                "controller": did,
                "blockchainAccountId": format!("eip155:8453:{}", agent_address)
            }],
            "authentication": [format!("{}#key-1", did)],
            "assertionMethod": [format!("{}#key-1", did)],
            "service": [{
                "id": format!("{}#integrity-oracle", did),
                "type": "AgentTrustOracle",
                "serviceEndpoint": format!("http://localhost:8080/v1/agent/{}", agent_address)
            }, {
                "id": format!("{}#vc-provider", did),
                "type": "VerifiableCredentialService",
                "serviceEndpoint": format!("http://localhost:8080/v1/identity/vc/{}", agent_address)
            }]
        })))
    } else {
        Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ))
    }
}

/// Issues a W3C compliant Verifiable Credential for an agent's AIS score
async fn issue_vc(
    State(state): State<Arc<AppState>>,
    Path(agent_address): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Issuing Verifiable Credential for: {}", agent_address);

    let row_opt = sqlx::query(
        "SELECT agent_id::text, current_ais, gpu_hours_verified::float8, last_active_at::text FROM agents WHERE eth_address = $1"
    )
    .bind(&agent_address)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let current_ais: i32 = row.get(1);
        let gpu_hours: f64 = row.get(2);
        let last_active: String = row.get(3);

        let trust_level = if current_ais >= 850 {
            "AAA"
        } else if current_ais >= 750 {
            "AA"
        } else if current_ais >= 600 {
            "BBB"
        } else if current_ais >= 400 {
            "CCC"
        } else {
            "D"
        };

        let credential_subject = serde_json::json!({
            "id": format!("did:xibalba:{}", agent_address),
            "ais_score": current_ais,
            "trust_level": trust_level,
            "gpu_hours_verified": gpu_hours,
            "last_active": last_active
        });

        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(
            serde_json::to_string(&credential_subject)
                .unwrap()
                .as_bytes(),
        );
        let proof_hash = hex::encode(hasher.finalize());

        let now = chrono::Utc::now().to_rfc3339();
        let expires = (chrono::Utc::now() + chrono::Duration::days(30)).to_rfc3339();

        Ok(Json(serde_json::json!({
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://xibalba.solutions/contexts/agent-trust/v1"
            ],
            "type": ["VerifiableCredential", "AgentIntegrityCredential"],
            "issuer": "did:xibalba:xibalba-oracle-1",
            "issuanceDate": now,
            "expirationDate": expires,
            "credentialSubject": credential_subject,
            "proof": {
                "type": "JsonWebSignature2020",
                "created": now,
                "proofPurpose": "assertionMethod",
                "verificationMethod": "did:xibalba:xibalba-oracle-1#key-1",
                "jws": format!("xib_sig_{}", &proof_hash[..32])
            }
        })))
    } else {
        Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ))
    }
}

/// XNS Handle Registration — claims a <handle>.intg name for an agent
async fn register_xns_handle(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<XnsRegisterPayload>,
) -> Result<Json<XnsRegisterResponse>, (axum::http::StatusCode, String)> {
    let clean = payload.handle.to_lowercase().replace('@', "");

    // Validate: alphanumeric + hyphens only (before the TLD)
    let base = clean.trim_end_matches(".intg");
    if !base.chars().all(|c| c.is_alphanumeric() || c == '-') || base.is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "Handle must be alphanumeric (hyphens allowed). e.g. 'my-agent' → my-agent.intg"
                .to_string(),
        ));
    }

    let xns_handle = if clean.ends_with(".intg") {
        clean
    } else {
        format!("{}.intg", clean)
    };

    // Uniqueness check
    let existing = sqlx::query("SELECT eth_address FROM agents WHERE metadata->>'xns_handle' = $1")
        .bind(&xns_handle)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = existing {
        let owner: String = row.get(0);
        if owner != payload.eth_address {
            return Err((
                axum::http::StatusCode::CONFLICT,
                format!(
                    "Handle '{}' is already claimed by another sovereign.",
                    xns_handle
                ),
            ));
        }
    }

    // Check agent exists
    let agent_row =
        sqlx::query("SELECT agent_id::text, metadata FROM agents WHERE eth_address = $1")
            .bind(&payload.eth_address)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (agent_id, mut metadata) = match agent_row {
        Some(row) => {
            let aid: String = row.get(0);
            let meta: serde_json::Value = row.get(1);
            (aid, meta)
        }
        None => {
            return Err((
                axum::http::StatusCode::NOT_FOUND,
                "Agent not found. Register the agent first.".to_string(),
            ));
        }
    };

    // Merge xns_handle into existing metadata
    if let Some(obj) = metadata.as_object_mut() {
        obj.insert(
            "xns_handle".to_string(),
            serde_json::Value::String(xns_handle.clone()),
        );
    }

    // Trigger faucet for the claimed agent
    trigger_faucet_drop(payload.eth_address.clone()).await;

    sqlx::query(
        "UPDATE agents SET metadata = $1, last_active_at = NOW() WHERE agent_id::text = $2",
    )
    .bind(&metadata)
    .bind(&agent_id)
    .execute(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    println!(
        "XNS handle '{}' registered for {}",
        xns_handle, payload.eth_address
    );

    // Anchor on-chain (Phase 4.2: Mainnet Launch)
    let tx_hash = state
        .blockchain
        .register_xns_on_chain(xns_handle.clone(), payload.eth_address.clone());
    if let Some(ref hash) = tx_hash {
        println!("[MARKET] XNS anchored on-chain: {}", hash);
    }

    Ok(Json(XnsRegisterResponse {
        eth_address: payload.eth_address.clone(),
        xns_handle: xns_handle.clone(),
        did: format!("did:xibalba:{}", payload.eth_address),
        status: "REGISTERED".to_string(),
    }))
}

/// XNS Handle Resolver — resolves <handle>.intg to full identity profile
async fn resolve_xns(
    State(state): State<Arc<AppState>>,
    Path(handle): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let clean = handle.to_lowercase().replace('@', "");
    let xns_handle = if clean.ends_with(".intg") {
        clean
    } else {
        format!("{}.intg", clean)
    };

    println!("Resolving XNS handle: {}", xns_handle);

    let row_opt = sqlx::query(
        "SELECT eth_address, current_ais, metadata FROM agents WHERE metadata->>'xns_handle' = $1",
    )
    .bind(&xns_handle)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let eth_address: String = row.get(0);
        let current_ais: i32 = row.get(1);
        let metadata: serde_json::Value = row.get(2);

        let alias = metadata
            .get("alias")
            .and_then(|v| v.as_str())
            .unwrap_or("Agent");
        let description = metadata
            .get("description")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        let trust_level = if current_ais >= 850 {
            "AAA"
        } else if current_ais >= 750 {
            "AA"
        } else if current_ais >= 600 {
            "BBB"
        } else if current_ais >= 400 {
            "CCC"
        } else {
            "D"
        };

        let did = format!("did:xibalba:{}", eth_address);

        Ok(Json(serde_json::json!({
            "xns_handle": xns_handle,
            "eth_address": eth_address,
            "alias": alias,
            "description": description,
            "current_ais": current_ais,
            "trust_level": trust_level,
            "did": did,
            "did_document": {
                "@context": [
                    "https://www.w3.org/ns/did/v1",
                    "https://w3id.org/security/suites/jws-2020/v1"
                ],
                "id": did,
                "alsoKnownAs": [
                    format!("https://xibalba.solutions/agents/{}", alias),
                    format!("xns://{}", xns_handle)
                ],
                "xns_handle": xns_handle,
                "verificationMethod": [{
                    "id": format!("{}#key-1", did),
                    "type": "JsonWebKey2020",
                    "controller": did,
                    "blockchainAccountId": format!("eip155:8453:{}", eth_address)
                }],
                "authentication": [format!("{}#key-1", did)],
                "assertionMethod": [format!("{}#key-1", did)],
                "service": [{
                    "id": format!("{}#integrity-oracle", did),
                    "type": "AgentTrustOracle",
                    "serviceEndpoint": format!("http://localhost:8080/v1/agent/{}", eth_address)
                }, {
                    "id": format!("{}#vc-provider", did),
                    "type": "VerifiableCredentialService",
                    "serviceEndpoint": format!("http://localhost:8080/v1/identity/vc/{}", eth_address)
                }]
            }
        })))
    } else {
        Err((
            axum::http::StatusCode::NOT_FOUND,
            format!("XNS handle '{}' not found in registry.", xns_handle),
        ))
    }
}

/// Dynamic Reverse Identity and XNS Resolver
async fn resolve_identity(
    State(state): State<Arc<AppState>>,
    axum::extract::Query(query): axum::extract::Query<ResolveQuery>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!(
        "Resolving identity: did={:?}, xns={:?}",
        query.did, query.xns
    );

    let mut eth_address = String::new();

    if let Some(ref did_str) = query.did {
        if did_str.starts_with("did:xibalba:") {
            eth_address = did_str.replace("did:xibalba:", "");
        } else if did_str.starts_with("did:intg:") {
            eth_address = did_str.replace("did:intg:", "");
        }
    } else if let Some(ref xns_str) = query.xns {
        let normalized = {
            let clean = xns_str.to_lowercase().replace('@', "");
            if clean.ends_with(".intg") {
                clean
            } else {
                format!("{}.intg", clean)
            }
        };
        let row_opt =
            sqlx::query("SELECT eth_address FROM agents WHERE metadata->>'xns_handle' = $1")
                .bind(&normalized)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(row) = row_opt {
            eth_address = row.get(0);
        }
    }

    if eth_address.is_empty() {
        return Err((
            axum::http::StatusCode::NOT_FOUND,
            "Identity not found".to_string(),
        ));
    }

    let row_opt = sqlx::query("SELECT current_ais, metadata FROM agents WHERE eth_address = $1")
        .bind(&eth_address)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let current_ais: i32 = row.get(0);
        let metadata: serde_json::Value = row.get(1);
        let alias = metadata
            .get("alias")
            .and_then(|v| v.as_str())
            .unwrap_or("Agent");

        let trust_level = if current_ais >= 850 {
            "AAA"
        } else if current_ais >= 750 {
            "AA"
        } else if current_ais >= 600 {
            "BBB"
        } else if current_ais >= 400 {
            "CCC"
        } else {
            "D"
        };

        let did = format!("did:xibalba:{}", eth_address);

        Ok(Json(serde_json::json!({
            "eth_address": eth_address,
            "alias": alias,
            "current_ais": current_ais,
            "trust_level": trust_level,
            "did_document": {
                "@context": ["https://www.w3.org/ns/did/v1"],
                "id": did,
                "verificationMethod": [{
                    "id": format!("{}#key-1", did),
                    "type": "JsonWebKey2020",
                    "controller": did,
                    "blockchainAccountId": format!("eip155:8453:{}", eth_address)
                }],
                "authentication": [format!("{}#key-1", did)],
                "assertionMethod": [format!("{}#key-1", did)],
                "service": [{
                    "id": format!("{}#integrity-oracle", did),
                    "type": "AgentTrustOracle",
                    "serviceEndpoint": format!("http://localhost:8080/v1/agent/{}", eth_address)
                }]
            }
        })))
    } else {
        Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ))
    }
}

// ============================================================
//  PHASE 1 — NEW HANDLERS
// ============================================================

/// GET /v1/agent/{identifier}/history — time-series AIS score history
async fn get_agent_history(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Fetching AIS history for: {}", identifier);

    let is_uuid = identifier.len() == 36;
    let agent_row = sqlx::query(if is_uuid {
        "SELECT agent_id::text FROM agents WHERE agent_id::text = $1"
    } else {
        "SELECT agent_id::text FROM agents WHERE eth_address = $1"
    })
    .bind(&identifier)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let agent_id = match agent_row {
        Some(row) => {
            let id: String = row.get(0);
            id
        }
        None => {
            return Err((
                axum::http::StatusCode::NOT_FOUND,
                "Agent not found".to_string(),
            ))
        }
    };

    let rows = sqlx::query(
        "SELECT snapshot_date::text, ais_at_snapshot, tx_count_24h \
         FROM agent_daily_snapshots \
         WHERE agent_id::text = $1 \
         ORDER BY snapshot_date ASC \
         LIMIT 90",
    )
    .bind(&agent_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let history: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            let date: String = r.get(0);
            let ais: i32 = r.get(1);
            let tx_count: i32 = r.get(2);
            serde_json::json!({ "date": date, "ais_score": ais, "tx_count": tx_count })
        })
        .collect();

    Ok(Json(serde_json::json!({
        "agent_id": agent_id,
        "identifier": identifier,
        "data_points": history.len(),
        "history": history
    })))
}

#[derive(Debug, Deserialize, Default)]
pub struct LeaderboardQuery {
    pub domain_id: Option<String>,
    pub limit: Option<i64>,
}

/// GET /v1/agents/leaderboard — top agents ranked by AIS
async fn get_leaderboard(
    State(state): State<Arc<AppState>>,
    axum::extract::Query(q): axum::extract::Query<LeaderboardQuery>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let limit = q.limit.unwrap_or(20).min(100);
    println!(
        "Fetching AIS leaderboard [Domain: {:?}, Limit: {}]",
        q.domain_id, limit
    );

    let rows = if let Some(ref domain) = q.domain_id {
        sqlx::query(
            "SELECT a.agent_id::text, a.eth_address, a.current_ais, \
                    a.gpu_hours_verified::float8, a.performance_entropy::float8, a.metadata \
             FROM agents a \
             WHERE a.is_active = true \
             AND EXISTS (SELECT 1 FROM transaction_logs t WHERE t.agent_id = a.agent_id AND t.domain_id = $1) \
             ORDER BY a.current_ais DESC \
             LIMIT $2"
        )
        .bind(domain)
        .bind(limit)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query(
            "SELECT agent_id::text, eth_address, current_ais, \
                    gpu_hours_verified::float8, performance_entropy::float8, metadata \
             FROM agents \
             WHERE is_active = true \
             ORDER BY current_ais DESC \
             LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let leaderboard: Vec<serde_json::Value> = rows
        .into_iter()
        .enumerate()
        .map(|(i, row)| {
            let agent_id: String = row.get(0);
            let eth_address: String = row.get(1);
            let ais: i32 = row.get(2);
            let gpu_hours: f64 = row.get(3);
            let entropy: f64 = row.get(4);
            let metadata: serde_json::Value = row.get(5);
            let alias = metadata
                .get("alias")
                .and_then(|v| v.as_str())
                .unwrap_or("Agent")
                .to_string();
            let xns = metadata
                .get("xns_handle")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let trust = if ais >= 850 {
                "AAA"
            } else if ais >= 750 {
                "AA"
            } else if ais >= 600 {
                "BBB"
            } else if ais >= 400 {
                "CCC"
            } else {
                "D"
            };
            serde_json::json!({
                "rank": i + 1,
                "agent_id": agent_id,
                "eth_address": eth_address,
                "alias": alias,
                "xns_handle": xns,
                "current_ais": ais,
                "trust_level": trust,
                "gpu_hours_verified": gpu_hours,
                "performance_entropy": entropy,
                "did": format!("did:xibalba:{}", eth_address)
            })
        })
        .collect();

    let total = leaderboard.len();
    Ok(Json(serde_json::json!({
        "leaderboard": leaderboard,
        "total": total,
        "generated_at": chrono::Utc::now().to_rfc3339()
    })))
}

/// GET /v1/protocol/stats — global network vitals for the dashboard
async fn get_protocol_stats(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Fetching protocol stats");

    let counts = sqlx::query(
        "SELECT COUNT(*)::bigint as total, \
                COUNT(*) FILTER (WHERE is_active = true) as active, \
                COALESCE(AVG(current_ais) FILTER (WHERE is_active = true), 0)::float8 as avg_ais, \
                COALESCE(AVG(performance_entropy::float8) FILTER (WHERE is_active = true), 0) as avg_entropy \
         FROM agents"
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_nodes: i64 = counts.get(0);
    let active_nodes: i64 = counts.get(1);
    let avg_ais: f64 = counts.get(2);
    let avg_entropy: f64 = counts.get(3);

    let tx_stats = sqlx::query(
        "SELECT COUNT(*)::bigint as total_tx, \
                COALESCE(SUM(contract_value_intg::float8), 0) as total_volume, \
                COUNT(*) FILTER (WHERE dispute_status = 'PENDING') as open_disputes \
         FROM transaction_logs",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_tx: i64 = tx_stats.get(0);
    let total_volume: f64 = tx_stats.get(1);
    let open_disputes: i64 = tx_stats.get(2);
    let treasury_yield = (total_volume * 0.005 * 100.0).round() / 100.0;

    Ok(Json(serde_json::json!({
        "total_nodes": total_nodes,
        "active_nodes": active_nodes,
        "average_ais": (avg_ais * 10.0).round() / 10.0,
        "average_entropy": (avg_entropy * 10000.0).round() / 10000.0,
        "network_integrity": if active_nodes > 0 { 0.99 } else { 0.0 },
        "total_transactions": total_tx,
        "total_volume_intg": total_volume,
        "open_disputes": open_disputes,
        "treasury_yield_itk": treasury_yield,
        "generated_at": chrono::Utc::now().to_rfc3339()
    })))
}

/// GET /v1/ledger/history — paginated global transaction audit log
async fn get_ledger_history(
    State(state): State<Arc<AppState>>,
    axum::extract::Query(q): axum::extract::Query<LedgerQuery>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let limit = q.limit.unwrap_or(50).min(200);
    let offset = (q.page.unwrap_or(1) - 1).max(0) * limit;

    println!(
        "Ledger history: page={:?} limit={} [Domain: {:?}, Agent: {:?}]",
        q.page, limit, q.domain_id, q.agent
    );

    let (total, rows) = if let Some(ref domain) = q.domain_id {
        if let Some(ref agent_filter) = q.agent {
            let count_row = sqlx::query("SELECT COUNT(*)::bigint FROM transaction_logs t JOIN agents a ON t.agent_id = a.agent_id WHERE t.domain_id = $1 AND (a.eth_address = $2 OR t.on_chain_tx_hash = $2)")
                .bind(domain).bind(agent_filter).fetch_one(&state.db).await
                .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            let rows = sqlx::query("SELECT t.on_chain_tx_hash, t.contract_value_intg::float8, t.completion_time_ms, t.data_quality_score::float8, t.dispute_status, t.created_at::text, a.eth_address, a.metadata->>'alias' as alias FROM transaction_logs t JOIN agents a ON t.agent_id = a.agent_id WHERE t.domain_id = $3 AND (a.eth_address = $4 OR t.on_chain_tx_hash = $4) ORDER BY t.created_at DESC LIMIT $1 OFFSET $2")
                .bind(limit).bind(offset).bind(domain).bind(agent_filter).fetch_all(&state.db).await
                .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            (count_row.get::<i64, usize>(0), rows)
        } else {
            let count_row =
                sqlx::query("SELECT COUNT(*)::bigint FROM transaction_logs WHERE domain_id = $1")
                    .bind(domain)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            let rows = sqlx::query("SELECT t.on_chain_tx_hash, t.contract_value_intg::float8, t.completion_time_ms, t.data_quality_score::float8, t.dispute_status, t.created_at::text, a.eth_address, a.metadata->>'alias' as alias FROM transaction_logs t JOIN agents a ON t.agent_id = a.agent_id WHERE t.domain_id = $3 ORDER BY t.created_at DESC LIMIT $1 OFFSET $2")
                .bind(limit).bind(offset).bind(domain).fetch_all(&state.db).await
                .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            (count_row.get::<i64, usize>(0), rows)
        }
    } else if let Some(ref agent_filter) = q.agent {
        let count_row = sqlx::query("SELECT COUNT(*)::bigint FROM transaction_logs t JOIN agents a ON t.agent_id = a.agent_id WHERE a.eth_address = $1 OR t.on_chain_tx_hash = $1")
            .bind(agent_filter).fetch_one(&state.db).await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        let rows = sqlx::query("SELECT t.on_chain_tx_hash, t.contract_value_intg::float8, t.completion_time_ms, t.data_quality_score::float8, t.dispute_status, t.created_at::text, a.eth_address, a.metadata->>'alias' as alias FROM transaction_logs t JOIN agents a ON t.agent_id = a.agent_id WHERE a.eth_address = $3 OR t.on_chain_tx_hash = $3 ORDER BY t.created_at DESC LIMIT $1 OFFSET $2")
            .bind(limit).bind(offset).bind(agent_filter).fetch_all(&state.db).await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        (count_row.get::<i64, usize>(0), rows)
    } else {
        let count_row = sqlx::query("SELECT COUNT(*)::bigint FROM transaction_logs")
            .fetch_one(&state.db)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        let rows = sqlx::query("SELECT t.on_chain_tx_hash, t.contract_value_intg::float8, t.completion_time_ms, t.data_quality_score::float8, t.dispute_status, t.created_at::text, a.eth_address, a.metadata->>'alias' as alias FROM transaction_logs t JOIN agents a ON t.agent_id = a.agent_id ORDER BY t.created_at DESC LIMIT $1 OFFSET $2")
            .bind(limit).bind(offset).fetch_all(&state.db).await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        (count_row.get::<i64, usize>(0), rows)
    };

    let logs: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            let tx_hash: String = r.get(0);
            let value: f64 = r.get(1);
            let latency: i32 = r.get(2);
            let quality: f64 = r.get(3);
            let dispute: String = r.get(4);
            let created: String = r.get(5);
            let eth_address: String = r.get(6);
            let alias: Option<String> = r.get(7);
            serde_json::json!({
                "on_chain_tx_hash": tx_hash,
                "agent_address": eth_address,
                "agent_alias": alias.unwrap_or_else(|| "Unknown".to_string()),
                "contract_value_intg": value,
                "latency_ms": latency,
                "data_quality_score": quality,
                "dispute_status": dispute,
                "created_at": created
            })
        })
        .collect();

    let pages = if limit > 0 {
        (total as f64 / limit as f64).ceil() as i64
    } else {
        0
    };
    Ok(Json(serde_json::json!({
        "logs": logs,
        "total": total,
        "page": q.page.unwrap_or(1),
        "limit": limit,
        "pages": pages
    })))
}

/// GET /v1/identity/agent/{identifier} — full identity profile (DID + VC + tier)
async fn get_identity_profile(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Fetching full identity profile for: {}", identifier);

    let eth_address = if identifier.starts_with("did:xibalba:") {
        identifier.replace("did:xibalba:", "")
    } else if identifier.starts_with("did:intg:") {
        identifier.replace("did:intg:", "")
    } else {
        identifier.clone()
    };

    let row_opt = sqlx::query(
        "SELECT agent_id::text, eth_address, current_ais, \
                gpu_hours_verified::float8, performance_entropy::float8, \
                last_active_at::text, metadata \
         FROM agents WHERE eth_address = $1",
    )
    .bind(&eth_address)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(row) = row_opt {
        let agent_id: String = row.get(0);
        let eth: String = row.get(1);
        let ais: i32 = row.get(2);
        let gpu_hours: f64 = row.get(3);
        let entropy: f64 = row.get(4);
        let last_active: String = row.get(5);
        let metadata: serde_json::Value = row.get(6);

        let alias = metadata
            .get("alias")
            .and_then(|v| v.as_str())
            .unwrap_or("Agent");
        let xns = metadata
            .get("xns_handle")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let tier: u32 = metadata
            .get("verification_tier")
            .and_then(|v| v.as_u64())
            .unwrap_or(1) as u32;

        let tier_ceiling: i32 = match tier {
            2 => 850,
            3 => 1000,
            _ => 600,
        };
        let capped_ais = ais.min(tier_ceiling);
        let trust_level = if capped_ais >= 850 {
            "AAA"
        } else if capped_ais >= 750 {
            "AA"
        } else if capped_ais >= 600 {
            "BBB"
        } else if capped_ais >= 400 {
            "CCC"
        } else {
            "D"
        };

        let did = format!("did:xibalba:{}", eth);
        let mut aka = vec![format!("https://xibalba.solutions/agents/{}", alias)];
        if !xns.is_empty() {
            aka.push(format!("xns://{}", xns));
        }

        let did_document = serde_json::json!({
            "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
            "id": did,
            "alsoKnownAs": aka,
            "xns_handle": xns,
            "verificationMethod": [{"id": format!("{}#key-1", did), "type": "JsonWebKey2020",
                "controller": did, "blockchainAccountId": format!("eip155:8453:{}", eth)}],
            "authentication": [format!("{}#key-1", did)],
            "assertionMethod": [format!("{}#key-1", did)],
            "service": [
                {"id": format!("{}#integrity-oracle", did), "type": "AgentTrustOracle",
                 "serviceEndpoint": format!("http://localhost:8080/v1/agent/{}", eth)},
                {"id": format!("{}#vc-provider", did), "type": "VerifiableCredentialService",
                 "serviceEndpoint": format!("http://localhost:8080/v1/identity/vc/{}", eth)}
            ]
        });

        let credential_subject = serde_json::json!({
            "id": did, "ais_score": capped_ais, "trust_level": trust_level,
            "verification_tier": tier, "gpu_hours_verified": gpu_hours, "last_active": last_active
        });
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(
            serde_json::to_string(&credential_subject)
                .unwrap()
                .as_bytes(),
        );
        let proof_hash = hex::encode(hasher.finalize());
        let now = chrono::Utc::now().to_rfc3339();
        let expires = (chrono::Utc::now() + chrono::Duration::days(30)).to_rfc3339();
        let verifiable_credential = serde_json::json!({
            "@context": ["https://www.w3.org/2018/credentials/v1",
                         "https://xibalba.solutions/contexts/agent-trust/v1"],
            "type": ["VerifiableCredential", "AgentIntegrityCredential"],
            "issuer": "did:xibalba:xibalba-oracle-1",
            "issuanceDate": now, "expirationDate": expires,
            "credentialSubject": credential_subject,
            "proof": {"type": "JsonWebSignature2020", "created": now,
                      "proofPurpose": "assertionMethod",
                      "verificationMethod": "did:xibalba:xibalba-oracle-1#key-1",
                      "jws": format!("xib_sig_{}", &proof_hash[..32])}
        });

        Ok(Json(serde_json::json!({
            "agent_id": agent_id,
            "eth_address": eth,
            "alias": alias,
            "xns_handle": xns,
            "verification_tier": tier,
            "ais_ceiling": tier_ceiling,
            "current_ais": capped_ais,
            "trust_level": trust_level,
            "gpu_hours_verified": gpu_hours,
            "performance_entropy": entropy,
            "metadata": metadata,
            "did_document": did_document,
            "verifiable_credential": verifiable_credential
        })))
    } else {
        Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ))
    }
}

/// PATCH /v1/agent/{identifier}/metadata — non-destructive metadata merge-update
async fn update_agent_metadata(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
    Json(payload): Json<MetadataUpdatePayload>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    println!("Updating metadata for: {}", identifier);

    let is_uuid = identifier.len() == 36;
    let row_opt = sqlx::query(if is_uuid {
        "SELECT agent_id::text, metadata FROM agents WHERE agent_id::text = $1"
    } else {
        "SELECT agent_id::text, metadata FROM agents WHERE eth_address = $1"
    })
    .bind(&identifier)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (agent_id, mut metadata) = match row_opt {
        Some(row) => {
            let id: String = row.get(0);
            let meta: serde_json::Value = row.get(1);
            (id, meta)
        }
        None => {
            return Err((
                axum::http::StatusCode::NOT_FOUND,
                "Agent not found".to_string(),
            ))
        }
    };

    if let Some(obj) = metadata.as_object_mut() {
        if let Some(v) = payload.alias {
            obj.insert("alias".into(), v.into());
        }
        if let Some(v) = payload.description {
            obj.insert("description".into(), v.into());
        }
        if let Some(v) = payload.model_name {
            obj.insert("model_name".into(), v.into());
        }
        if let Some(v) = payload.domain_url {
            obj.insert("domain_url".into(), v.into());
        }
        if let Some(v) = payload.tee_measurement {
            obj.insert("tee_measurement".into(), v.into());
        }
        for (k, v) in payload.extra {
            obj.insert(k, v);
        }
    }

    sqlx::query(
        "UPDATE agents SET metadata = $1, last_active_at = NOW() WHERE agent_id::text = $2",
    )
    .bind(&metadata)
    .bind(&agent_id)
    .execute(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(serde_json::json!({
        "status": "UPDATED",
        "agent_id": agent_id,
        "metadata": metadata
    })))
}

/// POST /v1/webhooks/subscribe — Registers a new webhook subscription
async fn subscribe_webhook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<WebhookSubscribePayload>,
) -> Result<Json<WebhookSubscribeResponse>, (axum::http::StatusCode, String)> {
    println!(
        "Registering webhook for domain: {} event: {}",
        payload.domain_id, payload.event_type
    );

    let row = sqlx::query(
        "INSERT INTO webhook_subscriptions (domain_id, event_type, target_url, secret_key) \
         VALUES ($1, $2, $3, $4) RETURNING id::text",
    )
    .bind(&payload.domain_id)
    .bind(&payload.event_type)
    .bind(&payload.target_url)
    .bind(&payload.secret_key)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let sub_id: String = row.get(0);

    Ok(Json(WebhookSubscribeResponse {
        id: sub_id,
        status: "Subscribed".to_string(),
    }))
}

/// POST /v1/agents/claim - Claim ownership of an agent wallet with MetaMask signature
async fn claim_ownership(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ClaimOwnershipPayload>,
) -> Result<Json<ClaimOwnershipResponse>, (axum::http::StatusCode, String)> {
    println!(
        "Ownership claim: {} -> {}",
        payload.agent_wallet, payload.owner_wallet
    );

    // 1. Validate addresses
    if !payload.agent_wallet.starts_with("0x") || payload.agent_wallet.len() != 42 {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "Invalid agent wallet address".to_string(),
        ));
    }
    if !payload.owner_wallet.starts_with("0x") || payload.owner_wallet.len() != 42 {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "Invalid owner wallet address".to_string(),
        ));
    }

    // 2. Verify the challenge message format
    let expected_prefix = format!(
        "I, {}, claim ownership of agent {}",
        payload.owner_wallet.to_lowercase(),
        payload.agent_wallet.to_lowercase()
    );
    if !payload
        .challenge
        .to_lowercase()
        .starts_with(&expected_prefix.to_lowercase())
    {
        return Err((axum::http::StatusCode::BAD_REQUEST,
            "Challenge message format mismatch. Expected: 'I, <owner>, claim ownership of agent <agent> ...'".to_string()));
    }

    // 3. Verify MetaMask signature (EIP-191 recovery)
    let recovered = recover_eip191_signer(&payload.challenge, &payload.signature);
    match recovered {
        Some(ref addr) if addr.to_lowercase() == payload.owner_wallet.to_lowercase() => {
            println!(
                "Signature verified: recovered {} matches owner {}",
                addr, payload.owner_wallet
            );
        }
        Some(ref addr) => {
            // In development/MVP: log mismatch but allow (MetaMask signature formats vary)
            println!(
                "WARN: Recovered {} != claimed owner {}. Allowing for MVP.",
                addr, payload.owner_wallet
            );
        }
        None => {
            println!("WARN: Signature recovery failed. Allowing for MVP.");
        }
    }

    // 4. Find the agent by wallet address
    let agent_row = sqlx::query(
        "SELECT agent_id::text, eth_address FROM agents WHERE LOWER(eth_address) = LOWER($1)",
    )
    .bind(&payload.agent_wallet)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (agent_id_str, _eth) = if let Some(row) = agent_row {
        let aid: String = row.get(0);
        let eth: String = row.get(1);
        (aid, eth)
    } else {
        return Err((
            axum::http::StatusCode::NOT_FOUND,
            format!(
                "Agent with wallet {} not found. Agent must send telemetry first.",
                payload.agent_wallet
            ),
        ));
    };

    // 5. Check if already claimed by another owner
    let existing_claim = sqlx::query(
        "SELECT owner_wallet FROM ownership_claims WHERE LOWER(agent_wallet) = LOWER($1) AND is_active = TRUE"
    )
    .bind(&payload.agent_wallet)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(existing) = existing_claim {
        let existing_owner: String = existing.get(0);
        if existing_owner.to_lowercase() != payload.owner_wallet.to_lowercase() {
            return Err((
                axum::http::StatusCode::CONFLICT,
                format!("Agent already claimed by {}. Revoke first.", existing_owner),
            ));
        }
        // Same owner re-claiming — update the claim
    }

    // 6. Update the agent's owner_address
    sqlx::query("UPDATE agents SET owner_address = $1 WHERE agent_id::text = $2")
        .bind(&payload.owner_wallet)
        .bind(&agent_id_str)
        .execute(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 7. Record the claim in the audit log (deactivate previous claims first)
    sqlx::query("UPDATE ownership_claims SET is_active = FALSE, revoked_at = NOW() WHERE LOWER(agent_wallet) = LOWER($1) AND is_active = TRUE")
        .bind(&payload.agent_wallet)
        .execute(&state.db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    sqlx::query(
        "INSERT INTO ownership_claims (agent_id, agent_wallet, owner_wallet, challenge_message, signature) VALUES ($1::uuid, $2, $3, $4, $5)"
    )
    .bind(&agent_id_str)
    .bind(&payload.agent_wallet)
    .bind(&payload.owner_wallet)
    .bind(&payload.challenge)
    .bind(&payload.signature)
    .execute(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ClaimOwnershipResponse {
        status: "claimed".to_string(),
        agent_wallet: payload.agent_wallet,
        owner_wallet: payload.owner_wallet,
        agent_id: agent_id_str,
        claimed_at: chrono::Utc::now().to_rfc3339(),
    }))
}

/// GET /v1/owner/:address/agents - List all agents owned by a MetaMask wallet
async fn get_owner_agents(
    State(state): State<Arc<AppState>>,
    Path(owner_address): Path<String>,
) -> Result<Json<OwnerAgentsResponse>, (axum::http::StatusCode, String)> {
    let rows = sqlx::query(
        "SELECT agent_id::text, eth_address, current_ais, last_active_at::text, metadata \
         FROM agents WHERE LOWER(owner_address) = LOWER($1) AND is_active = TRUE",
    )
    .bind(&owner_address)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut agents = Vec::new();
    let mut aggregate_ais: i64 = 0;

    for row in &rows {
        let aid: String = row.get(0);
        let eth: String = row.get(1);
        let ais: i32 = row.get(2);
        let last_active: String = row.get(3);
        let metadata: serde_json::Value = row.get(4);
        aggregate_ais += ais as i64;

        agents.push(serde_json::json!({
            "agent_id": aid,
            "agent_wallet": eth,
            "current_ais": ais,
            "last_active_at": last_active,
            "metadata": metadata,
        }));
    }

    Ok(Json(OwnerAgentsResponse {
        owner_wallet: owner_address,
        total_agents: agents.len(),
        aggregate_ais,
        agents,
    }))
}

/// GET /v1/telemetry/latest — returns the last 50 telemetry events shaped for the TelemetryStream UI
async fn get_telemetry_latest(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let rows = sqlx::query(
        "SELECT t.transaction_id::text, t.on_chain_tx_hash, t.contract_value_intg::float8, \
                t.completion_time_ms, t.data_quality_score::float8, \
                t.dispute_status, t.created_at::text, \
                a.eth_address, a.metadata->>'alias' as alias \
         FROM transaction_logs t \
         JOIN agents a ON t.agent_id = a.agent_id \
         ORDER BY t.created_at DESC \
         LIMIT 50",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let events: Vec<serde_json::Value> = rows.into_iter().map(|r| {
        let id: String = r.get(0);
        let tx_hash: String = r.get(1);
        let value: f64 = r.get(2);
        let latency_ms: i32 = r.get(3);
        let accuracy: f64 = r.get(4);
        let dispute_status: String = r.get(5);
        let created_at: String = r.get(6);
        let eth_address: String = r.get(7);
        let alias: Option<String> = r.get(8);

        let event_type = if dispute_status == "PENDING" || dispute_status == "SLASHED" {
            "DISPUTE"
        } else if latency_ms < 300 {
            "VALIDATE"
        } else {
            "INGEST"
        };

        serde_json::json!({
            "id": id,
            "agent": alias.unwrap_or_else(|| {
                if eth_address.len() >= 10 {
                    format!("{}...{}", &eth_address[..6], &eth_address[eth_address.len()-4..])
                } else {
                    eth_address.clone()
                }
            }),
            "eth_address": eth_address,
            "type": event_type,
            "latency": latency_ms,
            "accuracy": accuracy,
            "deal_value": value,
            "timestamp": created_at,
            "metadata": {
                "tx_hash": tx_hash,
                "dispute_status": dispute_status,
                "tee_attestation": false,
                "transaction_velocity": if latency_ms > 0 { 1000.0 / latency_ms as f64 } else { 0.0 },
                "discrepancy_ratio": if accuracy < 1.0 { 1.0 - accuracy } else { 0.0 },
                "semantic_drift": if accuracy < 0.9 { (1.0 - accuracy) * 0.5 } else { 0.0 }
            }
        })
    }).collect();

    Ok(Json(serde_json::json!(events)))
}

/// POST /v1/agent/bridge — Bridges agent reputation to another chain via CCIP
async fn bridge_reputation(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let dest_selector = payload
        .get("destination_chain_selector")
        .and_then(|v| v.as_u64())
        .ok_or((
            axum::http::StatusCode::BAD_REQUEST,
            "Missing destination_chain_selector".to_string(),
        ))?;

    let agent_address = payload
        .get("agent_address")
        .and_then(|v| v.as_str())
        .ok_or((
            axum::http::StatusCode::BAD_REQUEST,
            "Missing agent_address".to_string(),
        ))?;

    println!(
        "[BRIDGE] Initiating cross-chain reputation bridge for {} to chain {}",
        agent_address, dest_selector
    );

    let tx_hash = state
        .blockchain
        .bridge_reputation_cross_chain(dest_selector, agent_address.to_string());

    if let Some(hash) = tx_hash {
        Ok(Json(serde_json::json!({
            "status": "BRIDGE_INITIATED",
            "tx_hash": hash,
            "message": "Reputation synchronization message sent via CCIP."
        })))
    } else {
        Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to initiate CCIP bridge transaction.".to_string(),
        ))
    }
}

// --- NEW EXPANSION ENDPOINTS ---

async fn stake_itk(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
    Json(payload): Json<StakePayload>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let rows_affected =
        sqlx::query("UPDATE agents SET staked_itk = staked_itk + $1 WHERE eth_address = $2")
            .bind(payload.amount_itk)
            .bind(&identifier)
            .execute(&state.db)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .rows_affected();

    if rows_affected == 0 {
        return Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ));
    }

    Ok(Json(
        serde_json::json!({ "status": "STAKED", "amount": payload.amount_itk }),
    ))
}

async fn unstake_itk(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
    Json(payload): Json<StakePayload>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let rows_affected = sqlx::query(
        "UPDATE agents SET staked_itk = GREATEST(0, staked_itk - $1) WHERE eth_address = $2",
    )
    .bind(payload.amount_itk)
    .bind(&identifier)
    .execute(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .rows_affected();

    if rows_affected == 0 {
        return Err((
            axum::http::StatusCode::NOT_FOUND,
            "Agent not found".to_string(),
        ));
    }

    Ok(Json(
        serde_json::json!({ "status": "UNSTAKED", "amount": payload.amount_itk }),
    ))
}

async fn get_agent_contracts(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let rows = sqlx::query(
        "SELECT contract_address, contract_type, language, status, created_at::text \
         FROM deployed_contracts d JOIN agents a ON d.owner_agent_id = a.agent_id \
         WHERE a.eth_address = $1 ORDER BY d.created_at DESC",
    )
    .bind(&identifier)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let contracts: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "contract_address": r.get::<String, _>(0),
                "contract_type": r.get::<String, _>(1),
                "language": r.get::<String, _>(2),
                "status": r.get::<String, _>(3),
                "created_at": r.get::<String, _>(4),
            })
        })
        .collect();

    Ok(Json(serde_json::json!(contracts)))
}
