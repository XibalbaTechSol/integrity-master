use axum::{Json, Router, http::StatusCode, routing::post};
use dotenvy::dotenv;
use ethers::signers::{LocalWallet, Signer};
use ethers::types::{Address as EthersAddress, Signature};
use serde::{Deserialize, Serialize};
use std::env;
use std::net::SocketAddr;
use std::str::FromStr;

#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    dotenv().ok();

    let app = Router::new().route("/verify_passport", post(verify_passport_handler));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Passport Verifier listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[derive(Deserialize)]
struct VerifyRequest {
    address: String,
}

#[derive(Serialize)]
struct VerifyResponse {
    message: String,
    signature: Option<String>,
    error: Option<String>,
}

async fn verify_passport_handler(
    Json(payload): Json<VerifyRequest>,
) -> (StatusCode, Json<VerifyResponse>) {
    let address = match EthersAddress::from_str(&payload.address) {
        Ok(addr) => addr,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(VerifyResponse {
                    message: "Invalid Ethereum address provided.".to_string(),
                    signature: None,
                    error: Some("bad_address_format".to_string()),
                }),
            );
        }
    };

    // --- 1. Query Gitcoin Passport API (Placeholder) ---
    let passport_score = match query_gitcoin_passport(address).await {
        Ok(score) => score,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(VerifyResponse {
                    message: "Failed to query Gitcoin Passport.".to_string(),
                    signature: None,
                    error: Some(e),
                }),
            );
        }
    };

    // --- 2. Check Score Threshold ---
    let required_score: u32 = env::var("PASSPORT_SCORE_THRESHOLD")
        .unwrap_or("25".to_string())
        .parse()
        .unwrap_or(25);
    if passport_score < required_score {
        return (
            StatusCode::FORBIDDEN,
            Json(VerifyResponse {
                message: format!(
                    "Passport score of {} is below the required threshold of {}.",
                    passport_score, required_score
                ),
                signature: None,
                error: Some("score_too_low".to_string()),
            }),
        );
    }

    // --- 3. Generate EIP-712 Signature (Placeholder) ---
    let signature = match create_eip712_attestation(address).await {
        Ok(sig) => sig,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(VerifyResponse {
                    message: "Failed to generate signature.".to_string(),
                    signature: None,
                    error: Some(e),
                }),
            );
        }
    };

    // --- 4. Return Success Response ---
    (
        StatusCode::OK,
        Json(VerifyResponse {
            message: "Passport verified successfully.".to_string(),
            signature: Some(format!("0x{}", hex::encode(signature.to_vec()))),
            error: None,
        }),
    )
}

/// Placeholder function to simulate querying the Gitcoin Passport API.
/// In a real implementation, this would involve making an HTTP request.
async fn query_gitcoin_passport(address: EthersAddress) -> Result<u32, String> {
    println!(
        "Simulating Gitcoin Passport check for address: {:?}",
        address
    );
    // In a real implementation, you would use `reqwest` to call:
    // let url = format!("https://api.scorer.gitcoin.co/registry/score/{}/{}", SCORER_ID, address);
    // let client = reqwest::Client::new();
    // let res = client.get(&url).header("X-API-KEY", GITCOIN_API_KEY).send().await;
    // For now, we return a mock score.
    Ok(30)
}

/// Placeholder function to create an EIP-712 attestation.
async fn create_eip712_attestation(address: EthersAddress) -> Result<Signature, String> {
    println!("Simulating EIP-712 signature for address: {:?}", address);
    // This is a simplified example. A real EIP-712 implementation is more complex
    // and would involve defining the domain and typed data structure.
    // We will sign a simple hash for this boilerplate.

    let private_key_hex =
        env::var("VERIFIER_PRIVATE_KEY").map_err(|_| "VERIFIER_PRIVATE_KEY not set".to_string())?;
    let wallet: LocalWallet = private_key_hex
        .parse()
        .map_err(|_| "Failed to parse private key".to_string())?;

    let message = format!("Attesting passport for address: {:?}", address);
    let signature = wallet
        .sign_message(message.as_bytes())
        .await
        .map_err(|e| e.to_string())?;

    Ok(signature)
}
