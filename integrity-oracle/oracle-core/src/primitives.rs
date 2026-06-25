use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TelemetryPayload {
    pub agent_id: String,
    pub deal_id: Option<String>,
    pub deal_amount: Option<f64>,
    pub latency_ms: Option<u32>,
    pub accuracy_score: Option<f32>,
    pub hitl_intervention: bool,
    pub gpu_hours_used: f32,
    pub performance_variance: f32,
    pub verification_tier: u32,
    pub signature: Option<String>,
    pub timestamp: Option<u64>,
    pub performer_address: Option<String>,
    pub nonce: u64,
    pub zk_proof: String,
    pub batch_size: u32,
    pub avg_entropy: Option<f64>,
    pub avg_grounding: Option<f64>,
    pub sacrifice: Option<f64>,
    pub metadata: Option<serde_json::Value>,
    pub payload_type: String,
    pub domain_id: String,
}

#[derive(Serialize, Deserialize)]
pub struct VerifiableCredential {
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    pub id: String,
    pub r#type: Vec<String>,
    pub issuer: String,
    pub issuance_date: String,
    pub credential_subject: CredentialSubject,
    pub proof: CredentialProof,
}

#[derive(Serialize, Deserialize)]
pub struct CredentialSubject {
    pub id: String,
    pub ais_score: u32,
    pub trust_level: String,
}

#[derive(Serialize, Deserialize)]
pub struct CredentialProof {
    pub r#type: String,
    pub created: String,
    pub proof_purpose: String,
    pub verification_method: String,
    pub jws: String,
}

#[derive(Deserialize)]
pub struct Commitment {
    pub agent_id: String,
    pub domain_id: String,
    pub action_type: String,
    pub target_resource: String,
    pub commitment_hash: String,
    pub signature: String,
}

pub struct ZkVerifier;

pub mod verification {
    use async_trait::async_trait;
    
    #[async_trait]
    pub trait Verifier {
        async fn verify(&self, proof: &str) -> Result<bool, String>;
    }

    #[async_trait]
    impl Verifier for super::ZkVerifier {
        async fn verify(&self, _proof: &str) -> Result<bool, String> {
            Ok(true)
        }
    }
}

pub struct MerkleTree;

impl MerkleTree {
    pub fn calculate_root(__hashes: Vec<String>) -> String {
        "0xmockroot".to_string()
    }
}

pub fn calculate_default_ais(_entropy: Option<f64>, _grounding: Option<f64>, _sacrifice: Option<f64>) -> u32 {
    1000
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_tree() {
        assert_eq!(MerkleTree::calculate_root(vec![]), "0xmockroot");
    }

    #[test]
    fn test_calculate_default_ais() {
        assert_eq!(calculate_default_ais(None, None, None), 1000);
    }
}
