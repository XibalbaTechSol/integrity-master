use alloy_network::{Ethereum, EthereumWallet};
use alloy_primitives::{Address, FixedBytes};
use alloy_provider::{Provider, ProviderBuilder};
use alloy_rpc_client::WsConnect;
use alloy_signer_local::PrivateKeySigner;

// Define StateAnchor interface
alloy_sol_types::sol! {
    #[sol(rpc)]
    contract StateAnchor {
        function updateStateRoot(bytes32 newRoot) external;
        function getLatestRoot() external view returns (bytes32);
    }
}

pub struct RollupDaemon<P> {
    contract_address: Address,
    provider: P,
}

pub async fn create_rollup_daemon(
    rpc_url: &str,
    contract_addr: Address,
    private_key: &str,
) -> Result<RollupDaemon<impl Provider<Ethereum> + Clone>, String> {
    let signer: PrivateKeySigner = private_key
        .parse()
        .map_err(|e| format!("Invalid private key: {:?}", e))?;
    let wallet = EthereumWallet::from(signer);

    let provider = ProviderBuilder::new()
        .wallet(wallet)
        .connect_ws(WsConnect::new(rpc_url))
        .await
        .map_err(|e| format!("Failed to connect to WebSocket RPC: {:?}", e))?;

    Ok(RollupDaemon {
        contract_address: contract_addr,
        provider,
    })
}

impl<P: Provider<Ethereum> + Clone> RollupDaemon<P> {
    pub async fn commit_root(&self, root: [u8; 32]) -> Result<String, String> {
        let contract = StateAnchor::new(self.contract_address, self.provider.clone());
        let fixed_root = FixedBytes::from_slice(&root);

        let tx = contract
            .updateStateRoot(fixed_root)
            .send()
            .await
            .map_err(|e| format!("Transaction send failed: {:?}", e))?;

        let receipt = tx
            .get_receipt()
            .await
            .map_err(|e| format!("Failed to retrieve receipt: {:?}", e))?;

        Ok(receipt.transaction_hash.to_string())
    }
}
