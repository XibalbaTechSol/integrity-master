# Phase 1 Implementation - Backend Features

This document outlines the tasks for Phase 1 of backend feature implementation, based on the gap analysis.

## Tasks

### 1. GET /v1/agent/{address}/history - AIS Score History
- [x] Implement daily snapshot writer (background task or trigger on `ingest_telemetry`).
- [x] Implement GET handler to retrieve time-series AIS history from `agent_daily_snapshots` table.

### 2. GET /v1/protocol/stats - Global Network Vitals
- [x] Implement SQL aggregations to retrieve total agents, active agents, average AIS, open disputes, and total volume.
- [x] Create GET handler for `/v1/protocol/stats`.

### 3. GET /v1/ledger/history - Global Transaction Ledger
- [x] Implement SQL query for a read-only audit log of all transactions.
- [x] Add pagination to the ledger history endpoint.
- [x] Create GET handler for `/v1/ledger/history`.

### 4. GET /v1/agents/leaderboard - AIS Leaderboard
- [x] Implement a query to order agents by `current_ais` in descending order.
- [x] Add a limit to return the top N agents.
- [x] Create GET handler for `/v1/agents/leaderboard`.

### 5. GET /v1/identity/agent/{identifier} - Full Identity Profile
- [x] Compose existing handlers for DID Document, Verifiable Credential, AIS, and tier ceiling.
- [x] Create a single GET handler for `/v1/identity/agent/{identifier}`.

### 6. PATCH /v1/agent/{address}/metadata - Update Agent Metadata
- [x] Implement JSONB merge functionality to update `alias`, `description`, `TEE measurements`, and `model_name` in agent metadata.
- [x] Create PATCH handler for `/v1/agent/{address}/metadata`.

## Phase 2 Implementation - Backend Features

### 7. POST /v1/telemetry/batch - Batch Telemetry Ingestion
- [x] Implement batch processing of telemetry events in `IntegrityDataIngestor`.
- [x] Create POST handler for `/v1/telemetry/batch`.

### 8. POST /v1/identity/upgrade - Verification Tier Upgrades
- [x] Implement logic to update agent verification tier and AIS ceiling.
- [x] Create POST handler for `/v1/identity/upgrade`.

### 9. POST /v1/agent/stake - Record Staking Events
- [x] Implement logic to record staking events and update `Sacrifice` score.
- [x] Create POST handler for `/v1/agent/stake`.

### 10. GET /v1/insurance/quote - Actuarial Risk Profiling
- [x] Implement logic to calculate actuarial risk profile based on agent performance.
- [x] Create GET handler for `/v1/insurance/quote`.

## Phase 3 (In Progress)

### 11. EIP-191 signature recovery — Wallet Ownership Verification
- [x] Implement EIP-191 signature recovery for proving wallet ownership.
- [x] Create POST handler for `/v1/hermes/verify-signature`.

### 12. Merkle Root Anchoring — `StateAnchor.sol` Integration
- [x] Implement logic to compute Merkle root of AIS scores and submit to `StateAnchor.sol`.
- [x] Integrate with `ethers-rs` crate for on-chain calls (Conceptual: requires local Rust execution).

### 13. Daily Snapshot Cron — AIS History Writer
- [x] Implemented as part of `process_new_transaction` and `process_telemetry_batch` in `data_ingestor.py`.

## Phase 4: Architectural Generalization & Multi-Tenancy

### 14. Multi-Tenant `domain_id` Backend Integration
- [x] Update `TelemetryPayload` and `HandshakePayload` to include `domain_id`.
- [x] Enforce domain-specific isolation in `transaction_logs` and `provenance_logs` queries.
- [x] Add `domain_id` filtering to the Ledger and Leaderboard endpoints.

### 15. Scoring Policy Abstraction
- [x] Decouple AIS calculation logic from `scoring_engine.rs`.
- [x] Implement a `ScoringPolicy` registry that allows different formulas per `domain_id`.
- [x] Support externalized weights for Entropy, Grounding, and Sacrifice via database config.

### 16. Standardized Ingestion Envelope
- [x] Refactor telemetry ingest to use a "Standard Envelope" (Header + Generic JSONB Payload).
- [x] Implement a "Payload Dispatcher" that routes domain-specific data to vertical-aware processors.

### 17. Reactive Webhook & Event System
- [x] Implement an internal Event Bus for system-wide notifications (AIS updates, Slashing).
- [x] Create a `WebhookService` allowing vertical frameworks to subscribe to specific agent events.

### 18. Omnichain Reputation Propagation (CCIP)
- [ ] Integrate Chainlink CCIP in the `rollup_daemon` to sync AIS scores across L2s.
- [ ] Implement a cross-chain `ReputationOracle` contract to receive and verify AIS state roots.
