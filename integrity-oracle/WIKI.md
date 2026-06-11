# 🏛️ Integrity Protocol Wiki

> **Xibalba AI Solutions — Cryptographic Trust Infrastructure for Autonomous AI Agents**
> 
> Version 3.1 | Last Updated: June 2026

---

## 1. Production Architecture (Dual-Witness)

The Integrity Protocol features a high-performance hybrid architecture designed to balance massive telemetry scale with immutable on-chain certainty.

| Component | Tech Stack | Role |
|-----------|------------|------|
| **Rust Ingest Engine** | Axum + SQLx | High-speed telemetry validation and Pg storage. |
| **Python Sidecar** | Flask + Web3.py | On-chain anchoring, CCIP bridging, and Dashboard API support. |
| **ZK-Shield** | Aztec Noir | Generating/verifying proofs of behavioral correctness. |
| **Trust Vault** | PostgreSQL | Immutable source of truth for agent behavioral history. |

## 2. On-Chain Primitives (Base Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ReputationRegistry** | `0x765D12651DA806239675911d1908b02189DeEc88` | Decentralized credit bureau for AIS scores. |
| **StateAnchor** | `0x93e705c63c3c6F517B6fa214CA115c9cF222f75E` | Periodic Merkle root rollups of network state. |
| **IntegrityPaymaster** | `0x2e35aDd0ec480A301B02aF2619a55cE6d790d3a8` | ERC-4337 gas sponsorship for high-AIS agents. |
| **CCIPReputationBridge** | `0x87B22De3428dA70fff030439b3cD0CB2A8040Fa0` | Chainlink-powered cross-chain AIS portability. |
| **UltraPlonkVerifier** | `0x385777FEF849e9828e8a8BB11d590d5F93fcd0B3` | Mathematical enforcement of Noir ZK-proofs. |

## 3. The Proving Lifecycle

1.  **Local Proving**: The SDK generates an **Aztec Noir UltraPlonk proof** proving the Tri-Metric calculation (Entropy, Grounding, Sacrifice) is correct without revealing raw data.
2.  **ZK-Ingest**: The Oracle receives the proof and the **Integrity Commitment**.
3.  **On-Chain Verification**: The Oracle submits the proof to `UltraPlonkVerifier.sol`. If valid, the `ReputationRegistry` updates the agent's AIS.
4.  **Gasless Execution**: If the agent's AIS > 600, the `IntegrityPaymaster` sponsors the L2 gas fees for the update.

### Key Primitives

| Primitive | Description |
|-----------|-------------|
| **AIS Score** | Agent Integrity Score (0–1000 bps). Dynamic credit rating, like FICO for AI agents |
| **Tri-Metric Engine** | Three behavioral sub-scores: Entropy, Grounding, Sacrifice |
| **BCC** | Behavioral Commitment Chain — agents commit to intended actions before execution |
| **Namespaces** | Multi-tenancy support via `domain_id` (e.g., `shield`, `quant`) |
| **MCIP** | Model Contextual Integrity Protocol — Agent input/output validation |
| **DID** | W3C Decentralized Identifier (`did:xibalba:<address>`) |
| **VC** | W3C Verifiable Credential encoding AIS + trust level |
| **XNS** | Xibalba Name Service — human-readable `.intg` handles for agents |

---

## 4. Quick Start

### Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Python SDK dependencies
pip install requests eth-account
```

### Start the Backend (Rust Oracle)

```bash
cd integrity/oracle-core

# Set DB connection
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/integrity"

# Run the Oracle
cargo run
# → Listening on port 3001
```

### Register Your First Agent

```bash
curl -X POST http://localhost:3001/v1/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "eth_address": "0xYourAgentAddress",
    "alias": "my-agent",
    "xns_handle": "my-agent"
  }'
```

---

## 5. Core Concepts

### 5.1 Agent Integrity Score (AIS)

The AIS is a **composite credit rating (0–1000)** that measures an AI agent's trustworthiness across three behavioral dimensions:

```
           ┌─────────────────────────────────────┐
           │        AIS (0–1000 bps)             │
           ├──────────────┬──────────────────────┤
           │  Entropy (E) │ Behavioral consistency│
           │  Grounding(G)│ Human oversight       │
           │  Sacrifice(S)│ Computational sunk cost│
           └──────────────┴──────────────────────┘
```

**Entropy (E)** — Rewards low performance variance:
```
E = e^(-1.5 × σ²) × 1000
```
An agent with σ²=0 (perfectly consistent) scores E=1000. One with σ²=1.0 scores E≈223.

**Grounding (G)** — Rewards human-in-the-loop oversight:
```
G = 950  if hitl_intervention = true
G = 500  if hitl_intervention = false
```

**Sacrifice (S)** — Rewards computational commitment:
```
S = min(gpu_hours_used / 100, 1.0) × 1000
```

**Final AIS:**
```
blended = (raw_component_score + E + G) / 3
AIS = min(blended, tier_ceiling)
```

### 5.2 Behavioral Commitment Chain (BCC)

BCC ensures non-repudiation by requiring agents to commit to an action *before* executing it.

1. **Commit:** Agent sends a signed commitment hash to `/v1/commitments/register`.
2. **Execute:** Agent performs the task (e.g., medical inference).
3. **Verify:** Agent submits telemetry to `/v1/transactions/verify`. The Oracle cross-references the telemetry against the previous commitment.

### 5.3 L2 State Anchoring

To ensure immutable audit trails, the Oracle periodically (every 5 minutes) batches recent transaction hashes into a Merkle Tree and anchors the root to the `StateAnchor.sol` contract.

---

## 6. API Reference Summary

**Base URL:** `http://localhost:3001` (dev) | `https://api.xibalba.solutions` (production)

**Content-Type:** `application/json` for all POST requests.

### Endpoints at a Glance

| Method | Path | Category | Description |
|--------|------|----------|-------------|
| GET | `/health` | System | Health check |
| POST | `/v1/agent/register` | Registry | Register new agent |
| POST | `/v1/commitments/register` | BCC | Register a pre-execution commitment |
| GET | `/v1/identity/vc/{agent_id}` | Identity | Issue a signed Verifiable Credential |
| POST | `/v1/transactions/verify` | Telemetry | Verify transaction (ZK-Proof + Domain Context) |
| GET | `/v1/user/agents` | Registry | List all agents |
| GET | `/v1/identity/did/{address}` | Identity | W3C DID document |
| GET | `/v1/identity/resolve` | Identity | Reverse DID/XNS lookup |
| GET | `/v1/identity/xns/{handle}` | XNS | Resolve XNS handle |

---

## 7. Agent Workflow Example

### Step 1: Register a Commitment (BCC)

Verticals like **Xibalba Shield** require pre-execution commitments.

```bash
curl -X POST http://localhost:3001/v1/commitments/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "0xAgentAddress",
    "domain_id": "shield",
    "action_type": "READ_PATIENT_RECORD",
    "target_resource": "patient_123",
    "commitment_hash": "0xhash...",
    "signature": "0xsig..."
  }'
```

### Step 2: Submit Telemetry (with Namespace)

```bash
curl -X POST http://localhost:3001/v1/transactions/verify \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "0xAgentAddress",
    "domain_id": "shield",
    "zk_proof": "0xproof...",
    "nonce": 123,
    "batch_size": 1,
    "payload_type": "MEDICAL_INFERENCE",
    "avg_entropy": 0.05,
    "avg_grounding": 0.98,
    "metadata": {"commitment_id": "..."}
  }'
```

### Step 3: Request a Verifiable Credential (VC)

```bash
curl http://localhost:3001/v1/identity/vc/0xAgentAddress
```

---

*Integrity Protocol Wiki — Xibalba AI Solutions*  
*"Form-First Engineering. Mathematical Certainty."*  
*[GitHub](https://github.com/xibalbatechsol) · [API Docs](./docs/API_REFERENCE.md) · [Architecture](./docs/ARCHITECTURE.md)*
