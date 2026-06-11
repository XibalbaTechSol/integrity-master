# Implementation Plan: Integrity Protocol V9 & Xibalba Agent Integration

This document outlines the actionable engineering steps required to fully realize the V9 architecture (Base L2 + Rust Oracle) and integrate it with the Xibalba trading swarm.

## Phase 1: Cryptographic Binding & Core Infrastructure (CURRENT)
*Status: In Progress*

### 1.1 The Rust Oracle (Off-Chain Verification)
- [x] **Barretenberg Native FFI:** Replace the SHA-256 mock prover with actual Aztec Noir Barretenberg native FFI bindings in the Rust Oracle to eliminate WASM overhead.
- [x] **PostgreSQL Persistence:** Wire up PostgreSQL persistence in the background verification worker for the `StateAnchor` off-chain state.
- [x] **Redis Nonce Cache:** Implement a Redis-backed nonce cache for high-throughput replay attack rejection at the HTTP ingestion boundary.
- [x] **API Hardening:** Finalize the `/v1/transactions/verify` and `/v1/agent/register` endpoints.

### 1.2 Base L2 Smart Contracts (Foundry)
- [x] **Contract Deployment:** Deploy `IntegrityRegistry.sol` and `StateAnchor.sol` to Base L2 Testnet.
- [x] **Hardware Binding:** Implement Decentralized Identifier (DID) features mapping W3C DIDs to hardware fingerprints.
- [x] **Token Registration:** Register the Xibalba agent as an official source of liquidity on the $ITK testnet.

### 1.3 SDK & Agent Integration
- [x] **Agent Harness Integration:** Integrate the `IntegrityClient` SDK into `/home/xibalba/xibalba-agent/main_xibalba.py` (specifically within the `IntegrityAuditor` subagent).
- [x] **Hardware Tethering:** Cryptographically tie the `Xibalba` agent runtime to this specific hardware environment using the Integrity Protocol.
- [x] **Xibalba Shield Pilot:** Successfully stream mocked medical telemetry via the TypeScript SDK with Aztec Noir ZK blinding (`SHA256(clinicalData + nonce)`).

---

## Phase 2: The "Insurance Alpha" & Governance (COMPLETED)
*Status: Complete*

- [x] **Actuarial Piloting:** Pilot the Oracle validation endpoints with 3 boutique AI insurance firms to validate the Tri-Metric AIS scoring.
- [x] **Slashing Weights:** Tune the programmatic Slashing Penalty weights based on real actuarial feedback from the pilot.
- [x] **Public Explorer:** Release the Public Reputation Explorer for the broader Web3 ecosystem to view agent trustworthiness.
- [x] **Shadow Governance:** Initialize the AI-Proxy Delegation DAO in "Shadow Mode" to begin training Guardian Agents on protocol proposals.

---

## Phase 3: The Network Effect & Ecosystem Expansion (COMPLETED)
*Status: Complete*

- [x] **Framework Partnerships:** Partner with major agent frameworks (Hermes, OpenClaw, LangChain) to embed the Integrity SDK by default.
- [x] **Data Moat Monetization:** Package the telemetry database for seed funding rounds, demonstrating the value of the "How AI Agents Fail" dataset.
- [x] **Composability Primitives:** Launch developer documentation for building Prediction Markets and Binary Options on top of the Integrity Oracle.
