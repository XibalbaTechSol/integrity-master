// Xibalba Solutions: Telemetry v2.0 - Behavioral Proof Circuit
// Proves behavioral metrics (Entropy, Grounding) are calculated correctly without revealing raw data.

use dep::std;

fn main(
    // Private Inputs: Raw behavioral data
    token_entropy: u32,             // Scaled 0-1000
    grounding_score: u32,           // Scaled 0-1000
    latency_ms: u32,
    accuracy_raw: u32,              // 0-1000
    nonce: Field,                   // Random salt to prevent brute force mapping
    
    // Public Inputs: The commitments we send to the Oracle
    integrity_commitment: pub Field, // PedersenHash(metrics, nonce)
    ais_threshold: pub u32           // Protocol minimum for this tier
) {
    // 1. Range Validation: Ensure metrics are mathematically sound
    assert(token_entropy <= 1000);
    assert(grounding_score <= 1000);
    assert(accuracy_raw <= 1000);
    
    // 2. Threshold Check: Prove the agent is "healthy" according to the protocol
    // This allows the Oracle to reject "junk" proofs immediately.
    assert(token_entropy >= ais_threshold);

    // 3. Cryptographic Binding: Bind the private metrics to the public commitment
    // We use Pedersen Hash because it's ZK-friendly and efficient in Noir.
    let computed_commitment = std::hash::pedersen_hash([
        token_entropy as Field,
        grounding_score as Field,
        latency_ms as Field,
        accuracy_raw as Field,
        nonce
    ]);

    assert(computed_commitment == integrity_commitment);
}

#[test]
fn test_valid_telemetry() {
    let nonce = 123456789;
    let entropy = 850;
    let grounding = 920;
    let latency = 120;
    let accuracy = 990;
    
    let commitment = std::hash::pedersen_hash([
        entropy as Field,
        grounding as Field,
        latency as Field,
        accuracy as Field,
        nonce as Field
    ]);

    main(entropy, grounding, latency, accuracy, nonce as Field, commitment, 800);
}
