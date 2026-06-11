# 🛡️ Integrity Protocol: Official Specification (v8.3)

The **Integrity Protocol** is a decentralized trust layer designed for the Agentic Web. It provides a mathematically verifiable framework for assessing the reputation, stability, and accountability of autonomous AI agents. By bridging off-chain performance telemetry with on-chain cryptographic proofs, the protocol establishes a "Credit Score" for AI agents, known as the **Agent Integrity Score (AIS)**.

---

## 1. The Tri-Metric Model

The protocol evaluates agents across three primary dimensions. These metrics are processed by the Xibalba Scoring Engine to generate a comprehensive trust profile.

### I. Entropy Score (Stability)
**Definition**: A measure of the statistical variance and predictability of an agent's performance.
- **Goal**: Identify reliable agents and penalize those with volatile or "jittery" performance characteristics (e.g., erratic latency, fluctuating accuracy).
- **Mathematical Basis**: Calculated using the exponential decay of performance variance ($\sigma^2$).
- **Formula**: $S_{entropy} = e^{-1.5 \cdot \text{performance\_variance}} \times 1000$
- **Interpretation**: A high entropy score (near 1000) indicates a highly stable and predictable agent.

### II. Grounding Score (Accountability)
**Definition**: Quantifies the degree of "Human-in-the-Loop" (HITL) oversight and verified grounding in an agent's decision-making process.
- **Goal**: Reward agents that maintain transparent logs and human-vetoed critical actions.
- **Impact**: Provides a multiplier "boost" (up to 20%) to the overall Integrity Score.
- **Formula**: $S_{grounding} = \text{hgi\_raw} \times 1000$ (where HGI is the Human Grounding Index).

### III. Integrity Score (The Composite AIS)
**Definition**: The definitive reputation score (600–1000) stored on the blockchain.
- **Goal**: A multi-dimensional index that captures economic commitment, historical success, and third-party validation.
- **Core Pillars**:
  1. **Staking (20%)**: Economic collateral (ITK tokens) committed by the agent operator.
  2. **Sacrifice (20%)**: "Proof of Energy" — verified compute hours (GPU/TPU) consumed by the agent.
  3. **TrustFlow (25%)**: Recursive reputation inherited from interactions with other high-integrity agents.
  4. **Xibalba Audit (25%)**: Cryptographic verification status provided by Xibalba Solutions.
  5. **Volume (15%)**: Transactional history and throughput on the protocol.

---

## 2. Technical Schema

The Integrity Protocol utilizes a relational schema to track granular telemetry before aggregating it for the scoring engine.

### `agents` table
The registry of all AI entities within the ecosystem.
```sql
CREATE TABLE agents (
    agent_id UUID PRIMARY KEY,
    eth_address VARCHAR(42) UNIQUE, -- On-chain Identity
    current_ais INTEGER DEFAULT 0,  -- The final aggregated score
    performance_entropy DECIMAL,    -- Rolling stability metric
    gpu_hours_verified DECIMAL,     -- "Sunk Cost" / Sacrifice metric
    is_active BOOLEAN
);
```

### `transaction_logs` table
Records every agent interaction, serving as the raw data for AIS calculations.
```sql
CREATE TABLE transaction_logs (
    transaction_id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(agent_id),
    on_chain_tx_hash VARCHAR(66),
    success BOOLEAN,
    completion_time_ms INTEGER,     -- Used for Entropy
    data_quality_score DECIMAL,      -- Used for Grounding/Accuracy
    staked_amount_intg DECIMAL       -- Used for Staking Weight
);
```

### `xibalba_audits` table
High-trust validations performed by Xibalba Solutions.
```sql
CREATE TABLE xibalba_audits (
    audit_id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(agent_id),
    audit_type VARCHAR(20),          -- AUTOMATED, MANUAL, or PLATINUM
    verification_score DECIMAL,      -- W_XIBALBA input
    expires_at TIMESTAMP
);
```

---

## 3. The Integrity Hash Lifecycle

The protocol uses a **hash-anchor model** to keep transaction costs near zero while maintaining full cryptographic verifiability. Raw metrics are **never** stored on-chain — only a compact `bytes32` hash is anchored.

### Step-by-Step Flow

```
┌─────────────┐     metrics      ┌──────────────────┐     hash      ┌────────────────────┐
│  Agent SDK  │ ───────────────► │  Xibalba Backend │ ────────────► │ IntegrityProtocol  │
│  (Python /  │   latency_ms,    │  (FastAPI)        │  0x37fae...  │ Smart Contract     │
│   Node.js)  │   accuracy,      │                  │              │ (Solidity)         │
│             │   amount, etc.   │  Calculates AIS  │              │                    │
└─────────────┘                  │  Generates Hash  │              │ Stores hash only   │
                                 │  Stores in SQL   │              │ (~21,000 gas)      │
                                 └──────────────────┘              └────────────────────┘
```

**1. SDK Reports Metrics** — The agent's SDK sends raw performance data (latency, accuracy, deal amount) to the Xibalba API after a transaction completes.

**2. Xibalba Computes Scores** — The backend runs the Tri-Metric Scoring Engine:
- Calculates Entropy, Grounding, and Integrity scores
- Generates a deterministic SHA-256 hash of the metrics:
  ```
  hash = SHA256("{deal_id}-{latency_ms}-{accuracy}-{amount}")
  ```
- Stores the full metrics + hash in the Xibalba SQL database

**3. Hash Anchored On-Chain** — The SDK (or the agent) calls the smart contract's `completeHandshake(dealId, hash)` function. Only the 32-byte hash is written to the blockchain — no raw data touches the chain.

**4. Verification** — When a third party (e.g., an insurance company) needs to verify an agent's reputation, they:
- Read the hash from the blockchain (free — it's a `view` call)
- Send the hash to Xibalba's Verification API
- Xibalba confirms the hash matches its stored metrics and returns the full score breakdown

### Why This Architecture

| Concern | Solution |
|---------|----------|
| **Gas costs** | Only a `bytes32` write (~21,000 gas ≈ $0.05). No arrays, no strings, no structs. |
| **Data privacy** | Raw performance metrics stay in Xibalba's database. Competitors cannot reverse-engineer an agent's telemetry from the hash. |
| **Tamper-proof** | The on-chain hash is immutable. If Xibalba's database is altered, the hashes won't match — the fraud is detectable. |
| **Verifiability** | Anyone can independently compute `SHA256("{deal_id}-{latency_ms}-{accuracy}-{amount}")` and compare against the chain. The SDK provides `IntegrityClient.compute_hash()` for exactly this. |

---

## 4. Smart Contract Logic

The smart contracts handle **escrow, anchoring, and verification status** — they do NOT compute scores. All scoring happens off-chain in the Xibalba backend for gas efficiency.

### `IntegrityProtocol.sol` — The Deal Contract

```solidity
// 1. Agent A deposits ITK into escrow
function initiateDeal(address _performer, uint256 _amount) 
    external returns (bytes32 dealId)

// 2. After work is done, the hash is anchored and payment released
function completeHandshake(bytes32 _dealId, bytes32 _integrityHash) 
    external

// 3. Xibalba can mark a deal as "verified" for insurance queries
function verifyMetrics(bytes32 _dealId) 
    external onlyOwner
```

**Deal Lifecycle:**
1. **`initiateDeal`** — Agent A calls this with Agent B's address and an ITK amount. The tokens are transferred from A into the contract (escrow). A unique `dealId` is generated from `keccak256(sender, performer, dealCount, timestamp)`.

2. **`completeHandshake`** — After the work is completed and the SDK has reported metrics to Xibalba, the initiator (or Xibalba) calls this with the `integrityHash` received from the backend. The contract:
   - Stores `integrityHash` in the deal's on-chain record
   - Releases the escrowed ITK to the performer
   - Emits `DealCompleted(dealId, integrityHash)`

3. **`verifyMetrics`** — Xibalba Solutions (contract owner) calls this to emit an on-chain `MetricsVerified` event. This serves as a public, timestamped attestation that Xibalba has confirmed the hash.

### `IntegrityToken.sol` (ITK) — The Utility Token

```solidity
// Standard ERC-20 with a deflationary verification fee
function processVerificationFee(address agent, uint256 txAmount, bytes32 txHash)
    external onlyOwner
```

- 0.5% (50 basis points) of each verification fee is **burned**, creating deflationary pressure on the ITK supply.
- Verification fees are the revenue mechanism — insurance companies pay in ITK to verify agent reputation.

### `ReputationRegistry.sol` — The Score Ledger

```solidity
// Read an agent's public reputation
function getAgent(address _agent) 
    external view returns (uint256 score, uint256 staked, bool verified)

// Stake ITK to boost AIS
function stake(uint256 _amount) external
```

- Stores the latest AIS for each agent address
- AIS is updated by Xibalba (contract owner) after computing scores off-chain
- Staking locks ITK tokens and increases the Staking component of the AIS formula

---

## 5. Xibalba API: The Verification Service

Xibalba Solutions operates the backend that bridges off-chain intelligence with on-chain proof.

### Endpoints

| Endpoint | Who Calls It | Purpose |
|----------|-------------|---------|
| `POST /v1/transactions/report` | Agent SDK | Report metrics, receive `integrity_hash` |
| `POST /v1/agent/handshake` | Agent SDK | Pre-deal trust assessment of a target agent |
| `GET /v1/verify/{deal_id}` | Insurance Co. | Verify on-chain hash against stored metrics |
| `POST /v1/telemetry/batch` | Agent SDK | Batch upload of inference telemetry events |

### The Verification Flow (Insurance Use Case)

```
Insurance Company                    Blockchain                  Xibalba API
       │                                │                            │
       │  1. Read hash for deal_xyz     │                            │
       │ ─────────────────────────────► │                            │
       │  ◄──── 0x37faef74ba8d...       │                            │
       │                                │                            │
       │  2. Verify hash                │                            │
       │ ──────────────────────────────────────────────────────────► │
       │       GET /v1/verify/deal_xyz?on_chain_hash=0x37fae...      │
       │                                │                            │
       │  ◄──────────────────────────────────────────────────────── │
       │  { verified: true, integrity_score: 847, risk_tier: AAA }   │
       │                                │                            │
```

1. The insurer reads the `integrityHash` from the `IntegrityProtocol` smart contract (free `view` call).
2. The insurer sends this hash to Xibalba's `/v1/verify/{deal_id}` endpoint.
3. Xibalba checks if the hash matches the stored record in its SQL database.
4. If matched, Xibalba returns the full metrics breakdown and risk classification.
5. The insurer pays a verification fee in ITK (processed via `IntegrityToken.processVerificationFee`).

### Revenue Model

Every verification call burns 0.5% of the fee in ITK, making the token deflationary as adoption grows. Xibalba retains the remaining fee as service revenue.

---

## 6. End-to-End Workflow Summary

1. **Ingestion**: Agents report telemetry via the **Integrity SDK** (Python/Node).
2. **Computation**: The **Xibalba Backend** runs the Tri-Metric Scoring Engine off-chain.
3. **Hashing**: A deterministic SHA-256 hash of the metrics is generated.
4. **Storage**: Full metrics + hash are persisted in the Xibalba SQL database.
5. **Anchoring**: The `bytes32` hash is written to `IntegrityProtocol.sol` (~$0.05 gas).
6. **Verification**: Third parties pay Xibalba to match on-chain hashes against stored metrics.
7. **Decay**: Scores undergo **Temporal Decay** ($e^{-0.005 \cdot \text{days\_inactive}}$) to reflect current capability.

---

© 2026 Xibalba Solutions. *Enabling Trust in the Age of Autonomy.*

---
[← Back to README](../README.md)
