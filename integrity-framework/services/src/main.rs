use axum::{
    routing::{get, post},
    Router, Json, extract::{State, Path, Query},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::env;
use sha2::{Sha256, Digest};

pub mod orderbook;

// --- DTOs ---

#[derive(Debug, Deserialize)]
pub struct CreateMarketTaskPayload {
    pub creator_agent_id: String,
    pub title: String,
    pub description: Option<String>,
    pub reward_itk: f64,
    pub budget_itk: Option<f64>,
    pub min_ais_required: i32,
    pub auction_duration_sec: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct BidMarketTaskPayload {
    pub task_id: String,
    pub bidder_agent_address: String,
    pub bid_amount_itk: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct MarketTaskResponse {
    pub task_id: String,
    pub creator_agent_id: String,
    pub title: String,
    pub description: Option<String>,
    pub reward_itk: f64,
    pub min_ais_required: i32,
    pub status: String,
    pub linked_contract_address: Option<String>,
    pub is_factory_contract: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct BorrowPayload {
    pub amount_itk: f64,
    pub term_days: i32,
}

#[derive(Debug, Deserialize)]
pub struct RepayPayload {
    pub loan_id: String,
    pub amount_itk: f64,
}

#[derive(Debug, Serialize)]
pub struct LoanResponse {
    pub loan_id: String,
    pub principal: f64,
    pub interest_rate: f64,
    pub repaid_amount: f64,
    pub status: String,
    pub due_date: String,
}

#[derive(Debug, Serialize)]
pub struct CreditProfileResponse {
    pub credit_score: i32,
    pub max_borrow_limit: f64,
    pub total_borrowed: f64,
    pub active_loans: Vec<LoanResponse>,
}

#[derive(Debug, Deserialize)]
pub struct BuyEquityPayload {
    pub agent_address: String,
    pub shares_percentage: f64,
    pub price_itk: f64,
}

#[derive(Debug, Serialize)]
pub struct AgentEquityResponse {
    pub owner_uid: String,
    pub shares_percentage: f64,
    pub purchase_price_itk: f64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct DeployContractPayload {
    pub owner_address: String,
    pub contract_type: String,
    pub language: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct ListMarketContractPayload {
    pub contract_address: String,
    pub title: String,
    pub description: Option<String>,
    pub reward_itk: f64,
    pub min_ais_required: i32,
}

#[derive(Debug, Deserialize)]
pub struct AuditRequestPayload {
    pub agent_address: String,
    pub audit_type: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse {
    pub success: bool,
    pub message: String,
}

// --- App State ---

struct AppState {
    db: PgPool,
    orderbook: tokio::sync::Mutex<orderbook::Orderbook>,
}

// --- Error Helper ---
fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::fmt::Display,
{
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    println!("Starting Integrity Framework Service (Port 3002)...");

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/integrity".to_string());
    
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url).await?;

    let state = Arc::new(AppState {
        db: pool,
        orderbook: tokio::sync::Mutex::new(orderbook::Orderbook::new()),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(|| async { "Integrity Framework is operational." }))
        .route("/v1/market/tasks", get(get_market_tasks))
        .route("/v1/market/task/create", post(create_market_task))
        .route("/v1/market/task/bid", post(bid_on_task))
        .route("/v1/market/task/settle", post(settle_auction))
        .route("/v1/market/inference/bid", post(place_inference_bid))
        .route("/v1/market/inference/ask", post(place_inference_ask))
        .route("/v1/market/inference/match", post(match_inference_orders))
        .route("/v1/agent/:identifier/credit/profile", get(get_credit_profile))
        .route("/v1/agent/:identifier/credit/borrow", post(borrow_itk))
        .route("/v1/agent/credit/repay", post(repay_loan))
        .route("/v1/agent/equity", get(get_agent_equity))
        .route("/v1/agent/equity/buy", post(buy_agent_equity))
        .route("/v1/contracts/factory/deploy", post(deploy_contract))
        .route("/v1/contracts/list-market", post(list_contract_in_market))
        .route("/v1/audit/request", post(request_audit))
        .layer(cors)
        .with_state(state);

    let bind_addr = "0.0.0.0:3002";
    let listener = TcpListener::bind(bind_addr).await?;
    println!("Listening on {}", bind_addr);
    
    axum::serve(listener, app).await?;
    Ok(())
}

// --- HANDLERS ---

async fn get_market_tasks(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<MarketTaskResponse>>, (StatusCode, String)> {
    let rows = sqlx::query(
        "SELECT task_id::text, creator_agent_id::text, title, description, reward_itk::float8, min_ais_required, status, created_at::text, linked_contract_address, is_factory_contract FROM market_tasks WHERE status = 'OPEN'"
    )
    .fetch_all(&state.db)
    .await
    .map_err(internal_error)?;

    let tasks = rows.into_iter().map(|r| MarketTaskResponse {
        task_id: r.get(0),
        creator_agent_id: r.get(1),
        title: r.get(2),
        description: r.get(3),
        reward_itk: r.get(4),
        min_ais_required: r.get(5),
        status: r.get(6),
        created_at: r.get(7),
        linked_contract_address: r.get(8),
        is_factory_contract: r.get(9),
    }).collect();

    Ok(Json(tasks))
}

async fn create_market_task(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateMarketTaskPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let creator_id = uuid::Uuid::parse_str(&payload.creator_agent_id)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid creator_agent_id".to_string()))?;

    let task_id = uuid::Uuid::new_v4();
    let auction_end = match payload.auction_duration_sec {
        Some(d) => Some(chrono::Utc::now() + chrono::Duration::seconds(d as i64)),
        None => None,
    };

    sqlx::query(
        "INSERT INTO market_tasks (task_id, creator_agent_id, title, description, reward_itk, min_ais_required, status, auction_end_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    )
    .bind(task_id)
    .bind(creator_id)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(payload.reward_itk)
    .bind(payload.min_ais_required)
    .bind(if payload.auction_duration_sec.is_some() { "AUCTION" } else { "OPEN" })
    .bind(auction_end)
    .execute(&state.db)
    .await
    .map_err(internal_error)?;

    Ok(Json(serde_json::json!({ "status": "TASK_CREATED", "task_id": task_id.to_string() })))
}

async fn bid_on_task(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<BidMarketTaskPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let task_row = sqlx::query("SELECT min_ais_required, status, reward_itk FROM market_tasks WHERE task_id::text = $1")
        .bind(&payload.task_id)
        .fetch_one(&state.db)
        .await
        .map_err(internal_error)?;
    
    let bidder_row = sqlx::query("SELECT agent_id, current_ais FROM agents WHERE eth_address = $1")
        .bind(&payload.bidder_agent_address)
        .fetch_one(&state.db)
        .await
        .map_err(internal_error)?;

    let bidder_id: uuid::Uuid = bidder_row.get(0);
    let bidder_ais: i32 = bidder_row.get(1);
    let min_ais: i32 = task_row.get(0);
    let base_reward: f64 = task_row.get(2);

    if bidder_ais < min_ais {
        return Err((StatusCode::FORBIDDEN, "AIS too low for this task".to_string()));
    }

    let bid_amount = payload.bid_amount_itk.unwrap_or(base_reward);

    sqlx::query("INSERT INTO market_bids (bid_id, task_id, bidder_agent_id, bid_amount_itk, bidder_ais_at_time, status) VALUES ($1, $2, $3, $4, $5, 'PENDING')")
        .bind(uuid::Uuid::new_v4())
        .bind(uuid::Uuid::parse_str(&payload.task_id).map_err(internal_error)?)
        .bind(bidder_id)
        .bind(bid_amount)
        .bind(bidder_ais)
        .execute(&state.db)
        .await
        .map_err(internal_error)?;

    Ok(Json(serde_json::json!({ "status": "BID_RECORDED" })))
}

async fn settle_auction(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let task_id_str = payload.get("task_id").and_then(|v| v.as_str()).ok_or((StatusCode::BAD_REQUEST, "Missing task_id".to_string()))?;
    let task_id = uuid::Uuid::parse_str(task_id_str).map_err(|_| (StatusCode::BAD_REQUEST, "Invalid task_id".to_string()))?;

    let bids = sqlx::query("SELECT bid_id, bidder_agent_id, bid_amount_itk, bidder_ais_at_time FROM market_bids WHERE task_id = $1 AND status = 'PENDING'")
        .bind(task_id)
        .fetch_all(&state.db)
        .await
        .map_err(internal_error)?;

    if bids.is_empty() { return Err((StatusCode::BAD_REQUEST, "No bids found".to_string())); }

    let mut winner = None;
    let mut max_score = -1.0;

    for row in bids {
        let bid_id: uuid::Uuid = row.get(0);
        let agent_id: uuid::Uuid = row.get(1);
        let amount: f64 = row.get(2);
        let ais: i32 = row.get(3);
        let score = if amount > 0.0 { ais as f64 / amount } else { ais as f64 };
        if score > max_score { max_score = score; winner = Some((bid_id, agent_id)); }
    }

    if let Some((bid_id, agent_id)) = winner {
        sqlx::query("UPDATE market_tasks SET assigned_agent_id = $1, status = 'BIDDED' WHERE task_id = $2").bind(agent_id).bind(task_id).execute(&state.db).await.map_err(internal_error)?;
        sqlx::query("UPDATE market_bids SET status = 'ACCEPTED' WHERE bid_id = $1").bind(bid_id).execute(&state.db).await.map_err(internal_error)?;
        Ok(Json(serde_json::json!({ "status": "AUCTION_SETTLED", "winner": agent_id.to_string() })))
    } else {
        Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to settle".to_string()))
    }
}

async fn get_credit_profile(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
) -> Result<Json<CreditProfileResponse>, (StatusCode, String)> {
    let agent_row = sqlx::query("SELECT agent_id, current_ais FROM agents WHERE eth_address = $1")
        .bind(&identifier)
        .fetch_one(&state.db)
        .await
        .map_err(internal_error)?;
    
    let agent_id: uuid::Uuid = agent_row.get(0);
    let ais: i32 = agent_row.get(1);

    let credit_score = (ais as f64 * 1.1) as i32;
    let max_borrow_limit = ais as f64 * 10.0;

    let loans = sqlx::query(
        "SELECT loan_id::text, principal_itk::float8, interest_rate::float8, repaid_amount_itk::float8, status, due_date::text FROM loans WHERE agent_id = $1"
    )
    .bind(agent_id)
    .fetch_all(&state.db)
    .await
    .map_err(internal_error)?;

    let loan_responses = loans.into_iter().map(|r| LoanResponse {
        loan_id: r.get(0),
        principal: r.get(1),
        interest_rate: r.get(2),
        repaid_amount: r.get(3),
        status: r.get(4),
        due_date: r.get(5),
    }).collect();

    Ok(Json(CreditProfileResponse {
        credit_score,
        max_borrow_limit,
        total_borrowed: 0.0,
        active_loans: loan_responses,
    }))
}

async fn borrow_itk(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
    Json(payload): Json<BorrowPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let agent_row = sqlx::query("SELECT agent_id, current_ais FROM agents WHERE eth_address = $1").bind(&identifier).fetch_one(&state.db).await.map_err(internal_error)?;
    let agent_id: uuid::Uuid = agent_row.get(0);
    let loan_id = uuid::Uuid::new_v4();
    sqlx::query("INSERT INTO loans (loan_id, agent_id, principal_itk, interest_rate, term_days, due_date) VALUES ($1, $2, $3, 0.1, $4, NOW() + INTERVAL '30 days')")
        .bind(loan_id).bind(agent_id).bind(payload.amount_itk).bind(payload.term_days).execute(&state.db).await.map_err(internal_error)?;
    Ok(Json(serde_json::json!({ "status": "BORROWED", "loan_id": loan_id.to_string() })))
}

async fn repay_loan(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RepayPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    sqlx::query("UPDATE loans SET repaid_amount_itk = repaid_amount_itk + $1, status = 'REPAID' WHERE loan_id::text = $2")
        .bind(payload.amount_itk).bind(&payload.loan_id).execute(&state.db).await.map_err(internal_error)?;
    Ok(Json(serde_json::json!({ "status": "REPAYMENT_RECORDED" })))
}

async fn get_agent_equity(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<AgentEquityResponse>>, (StatusCode, String)> {
    let addr = params.get("agent_address").ok_or((StatusCode::BAD_REQUEST, "Missing agent_address".to_string()))?;
    let rows = sqlx::query("SELECT owner_uid, shares_percentage::float8, purchase_price_itk::float8, created_at::text FROM agent_equity ae JOIN agents a ON ae.agent_id = a.agent_id WHERE a.eth_address = $1")
        .bind(addr).fetch_all(&state.db).await.map_err(internal_error)?;
    let equity = rows.into_iter().map(|r| AgentEquityResponse { owner_uid: r.get(0), shares_percentage: r.get(1), purchase_price_itk: r.get(2), created_at: r.get(3) }).collect();
    Ok(Json(equity))
}

async fn buy_agent_equity(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<BuyEquityPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let agent_row = sqlx::query("SELECT agent_id FROM agents WHERE eth_address = $1").bind(&payload.agent_address).fetch_one(&state.db).await.map_err(internal_error)?;
    let agent_id: uuid::Uuid = agent_row.get(0);
    sqlx::query("INSERT INTO agent_equity (equity_id, agent_id, owner_uid, shares_percentage, purchase_price_itk) VALUES ($1, $2, 'buyer_uid', $3, $4)")
        .bind(uuid::Uuid::new_v4()).bind(agent_id).bind(payload.shares_percentage).bind(payload.price_itk).execute(&state.db).await.map_err(internal_error)?;
    Ok(Json(serde_json::json!({ "status": "EQUITY_PURCHASED" })))
}

async fn deploy_contract(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<DeployContractPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let contract_address = format!("0x{}", hex::encode(Sha256::digest(payload.code.as_bytes()))[..40].to_string());
    Ok(Json(serde_json::json!({ "status": "DEPLOYED", "address": contract_address })))
}

async fn list_contract_in_market(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<ListMarketContractPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    Ok(Json(serde_json::json!({ "status": "LISTED", "contract": payload.contract_address })))
}

async fn request_audit(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<AuditRequestPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    Ok(Json(serde_json::json!({ "status": "AUDIT_REQUESTED", "agent": payload.agent_address })))
}

async fn place_inference_bid(
    State(state): State<Arc<AppState>>,
    Json(bid): Json<orderbook::Bid>,
) -> Json<serde_json::Value> {
    let mut ob = state.orderbook.lock().await;
    ob.insert_bid(bid.clone());
    serde_json::json!({ "status": "BID_PLACED", "bid_id": bid.bid_id }).into()
}

async fn place_inference_ask(
    State(state): State<Arc<AppState>>,
    Json(ask): Json<orderbook::Ask>,
) -> Json<serde_json::Value> {
    let mut ob = state.orderbook.lock().await;
    ob.insert_ask(ask.clone());
    serde_json::json!({ "status": "ASK_PLACED", "ask_id": ask.ask_id }).into()
}

async fn match_inference_orders(
    State(state): State<Arc<AppState>>,
) -> Json<serde_json::Value> {
    let mut ob = state.orderbook.lock().await;
    let matches = ob.match_orders();
    serde_json::json!({ "status": "MATCHING_EXECUTED", "count": matches.len() }).into()
}
