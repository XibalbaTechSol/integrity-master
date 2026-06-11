# Integrity Oracle 🔮

The high-performance, off-chain cryptographic telemetry ingestion and Zero-Knowledge (ZK) proof verification engine for the **Integrity Protocol**.

Built using **Rust**, **Axum**, **Tokio** (MPSC async queues), and direct **Barretenberg C FFI bindings**.

---

## Architecture Overview

The Oracle serves as the Zero-Trust gatekeeper between stochastic off-chain AI Agent actions and deterministic on-chain Base L2 finality.

```
                  ┌────────────────────────────────┐
                  │      HTTP Post Ingestion       │
                  │   /v1/transactions/verify      │
                  └───────────────┬────────────────┘
                                  ▼
                  ┌────────────────────────────────┐
                  │    Redis Anti-Replay Check     │
                  │     (set_nx + 3600s TTL)       │
                  └───────────────┬────────────────┘
                                  ▼
                  ┌────────────────────────────────┐
                  │    Asynchronous MPSC Queue     │
                  └───────────────┬────────────────┘
                                  ▼
                  ┌────────────────────────────────┐
                  │  Static C FFI Noir Prover Link │
                  │     `barretenberg_verify`      │
                  └───────────────┬────────────────┘
                                  ▼
                  ┌────────────────────────────────┐
                  │   PostgreSQL trust log DB      │
                  │    `transaction_logs`          │
                  └────────────────────────────────┘
```

### Key Technical Primitives
1. **Asynchronous Ingest Worker Pipeline**: Axum router receives payload envelopes and immediately delegates them to a Tokio multi-producer single-consumer (`mpsc`) channel. Telemetry requests return `202 Accepted` instantly to agent runtimes (eliminating LLM inference blocking).
2. **Deterministic Cryptographic Key Verification**: Resolves the agent's W3C DID document (`did:integrity:<fingerprint>`), extracts the public key, and validates the deterministic Ed25519 signature of the spatial envelope.
3. **Redis Anti-Replay Safeguard**: Leverages Redis cache layer with atomic `SETNX` operations to identify and reject duplicated timestamp nonces (`409 Conflict`), preventing replay attacks.
4. **ZK Proof FFI Compiler**: Calls the Aztec Noir compiler proving logic using static C FFI linking to compile and verify Plonk proof bounds in real-time.

---

## Database Setup

Initialize the `integrity` database in PostgreSQL:

```sql
CREATE TABLE transaction_logs (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    zk_proof TEXT NOT NULL,
    nonce BIGINT NOT NULL,
    batch_size INTEGER NOT NULL,
    avg_entropy DOUBLE PRECISION DEFAULT 0.0,
    avg_grounding DOUBLE PRECISION DEFAULT 0.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    payload_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Local Compilation & Development

### Prerequisites
- **Rust Toolchain**: `rustc` and `cargo` 1.80+

### Compilation
The project utilizes a nested Cargo workspace to compile the static C FFI libraries in `bb_rs` cleanly without lock deadlocks:

```bash
# Build the binary in release profile
cargo build --release
```

### Run the Server
Configure Postgres and Redis connection parameters via environment variables:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/integrity ./target/release/oracle
```

---

## Production Dockerization

The Oracle includes a high-performance multi-stage `Dockerfile` optimizing build-caching and reducing the runtime layer footprint to only **136MB**:

```bash
# Build production Docker image
docker build -t integrity-oracle:latest .

# Run Docker container
docker run -p 3001:3001 -e DATABASE_URL=postgres://... integrity-oracle:latest
```
