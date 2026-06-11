# Integrity Oracle (Node 5: Economic & Compliance Observability)

**The Layer 0 Rust Engine for the Xibalba Integrity Protocol.**

## Overview

The `integrity-oracle` is the foundational backend service of the Integrity Protocol. It serves as **Node 5** in the End-to-End (E2E) Validation Lifecycle. Built in Rust and Axum for maximum concurrency and safety, it processes high-frequency agent telemetry, verifies cryptographic proofs (ZK-ML), enforces domain-specific scoring policies, and anchors agent behaviors to the Base L2 blockchain.

By acting as an isolated, multi-tenant economic engine, the Oracle calculates the **Agent Integrity Score (AIS)**—a mathematically verifiable FICO score for autonomous agents.

## Table of Contents
- [Architecture & Protocol Role](#architecture--protocol-role)
- [Technical Specifications](#technical-specifications)
- [Tri-Metric Scoring Engine](#tri-metric-scoring-engine)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage & API](#usage--api)
- [Development & Testing](#development--testing)

## Architecture & Protocol Role

As **Node 5: Economic & Compliance Observability**, the Oracle provides absolute isolation and cryptographic accountability:

```mermaid
graph TD
    subgraph Data Ingestion
        SDK[Integrity SDK] -->|Telemetry / ZKP| API[Axum REST/WebSocket API]
        BCC[BCC Middleware] -->|Commitment Hashes| API
    end

    subgraph Oracle Core (Rust)
        API --> V[Verification Engine]
        V -->|Aztec Noir Validator| ZK[ZK-ML Circuit Verification]
        V --> S[Scoring Engine]
        S -->|Calculates AIS| T[Trust Vault]
    end

    subgraph State Anchoring
        T -->|PostgreSQL| DB[(Relational DB)]
        T -->|Batched Merkle Roots| Base[Base L2 - StateAnchor.sol]
    end
```

### Key Responsibilities
1. **Telemetry Ingestion:** Receives raw and ZK-blinded execution metrics from autonomous agents.
2. **ZK-ML Verification:** Validates Aztec Noir Zero-Knowledge Proofs generated at the edge (Node 4) to ensure data compliance (e.g., HIPAA) without ingesting PHI.
3. **AIS Calculation:** Computes dynamic trust scores based on Entropy, Grounding, Sacrifice, and Compliance metrics.
4. **State Anchoring:** Batches reputation states into Merkle Roots and anchors them to `StateAnchor.sol` on Base L2 via Alloy 2.0.

## Technical Specifications

- **Language/Framework:** Rust (Edition 2021) / Axum Web Framework
- **Database:** PostgreSQL (sqlx / SeaORM)
- **Blockchain RPC:** Alloy 2.0 for high-frequency `wss://` RPC communication.
- **ZK Verification Backend:** Aztec Barretenberg UltraPlonk validator.

## Tri-Metric Scoring Engine

The Oracle executes the Phase 4 Domain-Weighted AIS Calculation:
`AIS_final = (S_entropy * w_E + S_grounding * w_G + S_sacrifice * w_S + S_compliance * w_C) * ZK_boost`

- **S_entropy:** Stability and variance in agent performance (penalizes hallucinations).
- **S_grounding:** Human Grounding Index (measures human-in-the-loop oversight).
- **S_sacrifice:** Proof of Work (GPU hours) and ITK staking locked on-chain.
- **S_compliance:** Regulatory health derived from BCC OPA evaluations.

## Installation & Setup

### Prerequisites
- [Rust](https://rustup.rs/) (latest stable)
- PostgreSQL (v14+)
- Base L2 RPC URL

### Build
```bash
cd integrity-oracle
cargo build --release
```

## Configuration

Copy the example environment file and configure your parameters:

```bash
cp .env.example .env
```

Ensure the following critical variables are set:
- `DATABASE_URL`: Connection string for the PostgreSQL Trust Vault.
- `BASE_L2_RPC_URL`: WebSocket or HTTP RPC endpoint for Base L2.
- `ORACLE_PRIVATE_KEY`: The ECDSA key used to sign Merkle root anchors.

### Authentication & Rate Limiting

- **Developer API Keys:** For testing, agents can use API keys. The Oracle hard-caps these agents at an AIS of **300**.
- **Production Mode:** Requires a validated W3C DID document (`did:intg:<address>`) and AWS Nitro/SGX hardware attestation to unlock AIS > 300.

## Usage & API

Start the Oracle server:
```bash
cargo run --release
```

By default, the server listens on port `3000`. It exposes endpoints for:
- `POST /api/v1/telemetry`: Ingest raw execution data.
- `POST /api/v1/proofs/verify`: Submit Aztec ZK proofs.
- `GET /api/v1/agent/:id/score`: Retrieve real-time AIS.

## Development & Testing

Run the test suite:
```bash
cargo test
```
To run integration tests that hit a local database, ensure `DATABASE_URL` points to a test database and run:
```bash
cargo test -- --ignored
```
