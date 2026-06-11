use std::sync::Arc;
use crate::AppState;

/// Stub webhook worker — will be implemented with real webhook dispatch logic.
pub async fn start_webhook_worker(_state: Arc<AppState>) {
    println!("[WEBHOOK] Webhook worker started (stub).");
    // Future: poll event_tx for OracleEvents, dispatch HTTP POST to registered webhook URLs
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
    }
}
