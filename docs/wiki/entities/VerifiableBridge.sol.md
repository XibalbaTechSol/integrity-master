# VerifiableBridge.sol (The Truth Anchor)

`VerifiableBridge.sol` functions as the core oracle and data availability layer.

## Mechanism
- **Hash-Anchor Model**: Cryptographically binds off-chain AI reasoning outputs to an on-chain transaction hash.
- **Telemetry Bundling**: Packages token utilization, inference latency, and grounding deltas into a "Proof of Integrity" (PoI).
- **ZK Hash Anchors**: Only the 32-byte SHA-256 hash of performance metrics is written to the ledger, ensuring absolute privacy (e.g., for HIPAA compliance) while maintaining mathematical verifiability.
