# System Architecture & Cryptographic Provenance 🛡️

The Integrity Protocol provides a Zero-Trust cryptographic gateway for autonomous AI agents, establishing identity non-repudiation and compiling telemetry into secure, verifiable spatial envelopes.

---

## 1. Hardware Fingerprinting & Provenance
To prevent identity spoofing, the SDK extracts immutable hardware bounds to establish physical provenance:

1. **Fingerprinting**: Combines Machine ID, MAC Address, CPU Model, and Hostname into a unique 64-character SHA-256 fingerprint.
2. **Deterministic Key Generation**: The fingerprint serves as a deterministic seed for an Ed25519 keypair, binding the agent’s identity ("soul") to its physical hardware.

---

## 2. Behavioral Commitment Chain (BCC)
The BCC forces agents to cryptographically anchor their intents before execution.
- **Commitment**: Agents sign an `intended_state_hash` using their private key.
- **Policy Validation**: The OPA (Open Policy Agent) engine evaluates intent against compliance thresholds (HIPAA/Finance).
- **Drift Detection**: The SDK validates actual execution against the committed intent; deviation triggers a `BCC_INTENT_DRIFT` exception and audit log.

---

## 3. Compliance-as-Code & Infrastructure Telemetry
The system provides a mathematically bound audit trail of the infrastructure itself:
- **HIPAA-Eligible Mode**: Enforced via `external_web_access: false`.
- **Zero Data Retention (ZDR)**: Cryptographically verified provider-level logging exclusions.
- **Data Residency**: Regional API domain tracking (e.g., `eu.api.openai.com`) for geographic confinement proof.

---

## 4. Behavioral Integrity & Macroscopic Observables
The protocol monitors macroscopic system signals to detect unauthorized activity:
- **Destination IP Entropy**: Detects lateral movement or exfiltration.
- **Access Path Entropy**: Monitors file-system crawl attempts.
- **Storage Flux Analysis**: Monitors Read/Write anomalies.

---

## 5. World Awareness (Oracle Integration)
Agents ingest verified off-chain data securely:
- **WorldDataFetcher**: Fetches external data with mandatory HMAC signature verification (Proof of Provenance).
- **Audit Anchoring**: External data sources are anchored as `source_id` within the BCC to ensure all agent decisions are traceable to verified sources.

---

## 6. Multi-Chain Synchronization
Identity is portable across blockchain networks:
- **Canonical Reputation Registry**: Authoritative AIS scores stored on a hub-chain.
- **Cross-Chain Synchronizer**: Propagates AIS and compliance states to satellite networks (e.g., L2s) via standard messaging protocols (CCIP/LayerZero).

---

## 7. ZK-ML Verification (Proof of Inference)
The final pillar of mathematical trust:
- **Inference Circuit (`inference.nr`)**: Noir circuits provide succinct proofs (PoI) that model outputs were computed via authorized model weights stored in the `ZKModelRegistry`.
- **On-Chain Verification**: The `AuditShield` contract validates inference proofs against model hashes, ensuring only authorized AI logic is executed.

---

## 8. Multi-Agent & Hierarchical Isolation
The protocol supports independent swarm members and hierarchical sub-agents:
- **Process Isolation**: Each agent maintains a unique SQLite offline cache (`offline_moat_{agent_id}.db`).
- **DID Hierarchy**: Sub-agents inherit the parent identity, forming a verifiable chain of trust (`parent_id.child_id`).
