use std::sync::Arc;
use crate::AppState;

/// Stub webhook worker — will be implemented with real webhook dispatch logic.
pub(crate) async fn start_webhook_worker(_state: Arc<AppState>) {
    println!("[WEBHOOK] Webhook worker started (stub).");
    // Future: poll event_tx for OracleEvents, dispatch HTTP POST to registered webhook URLs
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Since start_webhook_worker is an infinite loop, testing it directly is tricky without aborting.
    // For coverage of a stub, we could potentially test that it doesn't panic if we run it in a short-lived task.
    #[tokio::test]
    async fn test_start_webhook_worker_stub() {
        // Just verify it compiles and exists.
    }
}
