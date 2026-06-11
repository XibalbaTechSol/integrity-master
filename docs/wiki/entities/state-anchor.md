---
title: StateAnchor (Solidity Contract)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [layer-2, cryptography]
confidence: high
sources: [raw/legacy/README.md, raw/legacy/ARCHITECTURE.md]
---

# StateAnchor

`StateAnchor.sol` is the primary state anchoring contract of the Integrity Project, deployed on Base L2. 

It is responsible for periodically logging the Merkle root of the off-chain database, serving as the cryptographic bridge that verifies off-chain telemetry states on-chain without requiring high gas fees for routine updates.

## 1. Merkle Root Anchoring
To avoid the astronomical gas costs of registering every single transaction, logprob, and telemetry batch directly to the blockchain, the Integrity Project splits processing into a dual-layer stack:

1.  **Off-Chain Storage:** The high-throughput [Rust Oracle](rust-oracle.md) ingests telemetry batches and maintains the complete database of record in a PostgreSQL Trust Vault.
2.  **On-Chain Anchoring:** Periodically (e.g. every epoch), the Oracle compiles the off-chain database into a Merkle Tree, calculates the Merkle Root, and posts it to the `StateAnchor` contract via `anchorState(bytes32 root)`.

## 2. Inclusion & Fraud Proofs
Once a Merkle Root is anchored on-chain, third-party smart contracts, insurers, and nodes can verify any specific off-chain event (such as an agent's AIS score or compliance record) by submitting a standard Merkle inclusion proof.

Furthermore, if an auditor detects an invalid state transition within the database, the Merkle root is used to locate the corrupted leaf and submit a **Fraud Proof** to `IntegrityRegistry.sol` to execute slashing.

## 3. Related Systems
-   **integrity-registry:** The [Integrity Registry](integrity-registry.md) queries anchored roots in this contract to verify compliance logs before approving slashing or staking floor adjustments.
-   **rust-oracle:** The off-chain [Rust Oracle](rust-oracle.md) is the exclusive compiler and submitter of StateAnchor Merkle roots.
