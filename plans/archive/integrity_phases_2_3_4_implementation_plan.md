# Xibalba Solutions: Integrity Protocol Master Implementation Plan (Phases 2–4)

**Document Version:** 3.0  
**Author:** Xibalba Systems Architect  
**Status:** DRAFT - ACTIVE  
**Security Level:** CONFIDENTIAL  
**Applicability:** Core Engineering Team  

---

## 1. Executive Summary

This document defines the technical execution plan for **Phase 2 (On-Chain Orchestration & Slashing)**, **Phase 3 (Dispute Resolution & Inference Auctions)**, and **Phase 4 (Developer SDK Distribution)** of the **Integrity Protocol**. It serves as the engineering blueprint for transitioning off-chain telemetry verification into a decentralized, trustless reputation network.

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│   Phase 2: On-Chain Rollups    │  ──>  │  Phase 3: Disputes & Auctions  │
│ - Merkle Tree Construction     │       │ - Arbitration State Machine    │
│ - Alloy Rollup Daemon          │       │ - Orderbook Matching Engine    │
│ - Slasher Contract Integration │       │ - WebSockets Hermes Hub        │
└────────────────────────────────┘       └────────────────────────────────┘
                                                         │
                                                         ▼
                                         ┌────────────────────────────────┐
                                         │    Phase 4: SDK Distribution   │
                                         │ - PyPI & NPM Publishing Pipelines│
                                         │ - LangChain & CrewAI Adapters  │
                                         └────────────────────────────────┘
```

---

## 2. Phase 2: On-Chain Orchestration & Slashing Engine

Phase 2 establishes the trust link between off-chain database transactions and on-chain state anchors on Base L2.

### 2.1. Tri-Metric Scoring Engine Implementation
The backend calculates the **Agent Integrity Score (AIS)** by analyzing three dimensions of agent behavior. The final score is the arithmetic mean of these components, capped by the agent's **Verification Tier**.

1.  **Entropy Score ($S_{entropy}$):** Measures statistical variance in performance.
    $$S_{entropy} = e^{-1.5 \cdot \sigma^2} \times 1000$$
    *Derived from telemetry metrics: latency variance, success rate, and intervention depth.*
2.  **Grounding Score ($S_{grounding}$):** Quantifies Human-in-the-Loop (HITL) oversight.
    $$S_{grounding} = HGI_{raw} \times 1000$$
3.  **Sacrifice Score ($S_{sacrifice}$):** Measures verified computational energy (GPU/TPU hours). Saturates at 1000 points at 100+ verified GPU hours.

### 2.2. State Merklization Architecture
The off-chain Trust Vault contains thousands of agent records. To verify an agent’s reputation on-chain without storing the entire dataset in Solidity storage, we construct a Merkle Tree of depth 16 (supporting up to 65,536 active agents).

#### 1. Leaf Hashing Protocol
Leaves are generated deterministically using the **Pedersen Hashing** primitive to maintain compatibility with our ZK circuits:
$$\text{Leaf} = \text{PedersenHash}(\text{agent\_address}, \text{ais\_score}, \text{last\_slash\_days})$$

#### 2. Rust Merkle Path Generator (`merkle.rs`)
```rust
use primitive_types::H256;
use sha2::Sha256;
use digest::Digest;

pub struct MerkleTree {
    pub leaves: Vec<[u8; 32]>,
    pub tree: Vec<Vec<[u8; 32]>>,
}

impl MerkleTree {
    pub fn new(leaves: Vec<[u8; 32]>) -> Self {
        let mut tree = vec![leaves.clone()];
        let mut current_level = leaves;

        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in current_level.chunks(2) {
                if chunk.len() == 2 {
                    next_level.push(Self::hash_nodes(&chunk[0], &chunk[1]));
                } else {
                    // Duplicate last odd node
                    next_level.push(Self::hash_nodes(&chunk[0], &chunk[0]));
                }
            }
            tree.push(next_level.clone());
            current_level = next_level;
        }

        Self { leaves: tree[0].clone(), tree }
    }

    pub fn get_root(&self) -> [u8; 32] {
        self.tree.last().map(|level| level[0]).unwrap_or([0u8; 32])
    }

    pub fn get_proof(&self, index: usize) -> Vec<[u8; 32]> {
        let mut proof = Vec::new();
        let mut idx = index;

        for level in 0..self.tree.len() - 1 {
            let sibling_idx = if idx % 2 == 0 { idx + 1 } else { idx - 1 };
            if sibling_idx < self.tree[level].len() {
                proof.push(self.tree[level][sibling_idx]);
            } else {
                proof.push(self.tree[level][idx]);
            }
            idx /= 2;
        }
        proof
    }

    fn hash_nodes(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(left);
        hasher.update(right);
        hasher.finalize().into()
    }
}
```

### 2.2. State Rollup Daemon (Alloy Implementation)
A stateless, background Rust daemon executes every 24 hours (or after a batch of 1,000 transactions) to submit the computed Merkle Root to `StateAnchor.sol`.

```rust
use alloy_primitives::{Address, FixedBytes, U256};
use alloy_provider::{Provider, ProviderBuilder};
use alloy_signer_local::PrivateKeySigner;
use alloy_network::EthereumSigner;
use std::sync::Arc;

// Define StateAnchor interface
alloy_sol_types::sol! {
    #[sol(rpc)]
    contract StateAnchor {
        function updateStateRoot(bytes32 newRoot) external;
        function getLatestRoot() external view returns (bytes32);
    }
}

pub struct RollupDaemon {
    contract_address: Address,
    provider: Arc<dyn Provider>,
}

impl RollupDaemon {
    pub async fn new(rpc_url: &str, contract_addr: Address, private_key: &str) -> Self {
        let signer: PrivateKeySigner = private_key.parse().unwrap();
        let wallet = EthereumSigner::new(signer);
        let provider = ProviderBuilder::new()
            .with_recommended_fillers()
            .signer(wallet)
            .on_http(rpc_url.parse().unwrap());
            
        Self {
            contract_address: contract_addr,
            provider: Arc::new(provider),
        }
    }

    pub async fn commit_root(&self, root: [u8; 32]) -> Result<String, String> {
        let contract = StateAnchor::new(self.contract_address, Arc::clone(&self.provider));
        let fixed_root = FixedBytes::from_slice(&root);
        
        let tx = contract.updateStateRoot(fixed_root)
            .send()
            .await
            .map_err(|e| format!("Transaction send failed: {:?}", e))?;
            
        let receipt = tx.get_receipt()
            .await
            .map_err(|e| format!("Failed to retrieve receipt: {:?}", e))?;
            
        Ok(receipt.transaction_hash.to_string())
    }
}
```

### 2.3. Programmatic Slashing Engine
The Slasher daemon detects **Hallucination Events** or SLA breaches in incoming telemetry.
*   **Trigger:** If an agent's telemetry reports a verified **entropy score** below 400 (or accuracy variance exceeding thresholds) in three consecutive epochs.
*   **Execution Policy:**
    1.  **Freeze Identity:** Oracle flag database field `is_frozen = true`.
    2.  **Generate Evidence Payload:** Collect signed telemetry hashes.
    3.  **Execute Slashing TX:** Call `Slasher.sol:slashAgent(address agent, bytes32 evidenceHash, uint256 slashAmount)`.
    4.  **Token Burn:** The contract burns 50% of the staked **$ITK** and allocates the other 50% to the Arbitrator Treasury.

---

## 3. Phase 3: Dispute Resolution & Inference Hub

Phase 3 introduces decentralized arbitration mechanisms and the "Insured Agent" go-to-market strategy.

### 3.1. Optimistic Dispute Resolution Model
Transactions are assumed valid until challenged. The Oracle uses **Dual-Witness Arbitration** logic to resolve disputes.

1.  **Dispute Initiation:** Initiator triggers challenge, generating `dispute_id = SHA256(deal_id + initiator)`.
2.  **Evaluation:** Oracle evaluates dispute based on telemetry and signed BCC commitments.
3.  **Resolution Outcomes:**
    *   **Justified (True):** Offending agent receives penalty points; AIS is deducted. `StakingReputation.sol` programmatically slashes staked **$ITK** (e.g., 500 $ITK).
    *   **Rejected (False):** Transaction dismissed; no penalties or slashing.

### 3.2. Inference Hub & "Insured Agent" Flywheel
The **Verified Inference Hub** is a public dashboard ranking AI inference providers by their **Entropy Score**. This drives a market strategy to secure high-stakes operations:

1.  **Insurance Partnerships:** Xibalba partners with carriers who require agents to run on "Certified Inference Providers" for liability coverage.
2.  **Market Pressure:** Developers shift compute spend to certified providers to qualify for insurance.
3.  **Provider Certification:** Providers integrate the protocol SDK to obtain the "Integrity Seal," gaining premium pricing and gated enterprise customers.

### 3.3. Inference Auction Orderbook Engine
To connect compute requesters to high-reputation agents, we implement a low-latency, price-time-priority matching engine in Rust, optimized for reputational filtering.

```rust
use std::collections::BTreeMap;

#[derive(Clone, Debug)]
pub struct Bid {
    pub requester: String,
    pub price_per_k_tokens: u64, // In USDC micro-units (6 decimals)
    pub min_ais: u32,
    pub token_allocation: u64,
}

#[derive(Clone, Debug)]
pub struct Ask {
    pub agent_address: String,
    pub price_per_k_tokens: u64,
    pub current_ais: u32,
    pub available_tokens: u64,
}

pub struct Orderbook {
    // Bids sorted descending by price
    pub bids: BTreeMap<u64, Vec<Bid>>,
    // Asks sorted ascending by price
    pub asks: BTreeMap<u64, Vec<Ask>>,
}

impl Orderbook {
    pub fn new() -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
        }
    }

    pub fn insert_bid(&mut self, bid: Bid) {
        self.bids.entry(bid.price_per_k_tokens)
            .or_insert_with(Vec::new)
            .push(bid);
    }

    pub fn insert_ask(&mut self, ask: Ask) {
        self.asks.entry(ask.price_per_k_tokens)
            .or_insert_with(Vec::new)
            .push(ask);
    }

    /// Match orders considering both price convergence and Agent Integrity (AIS) constraints.
    pub fn match_orders(&mut self) -> Vec<(Bid, Ask, u64)> {
        let mut matches = Vec::new();
        
        let mut bid_prices: Vec<u64> = self.bids.keys().rev().cloned().collect();
        let mut ask_prices: Vec<u64> = self.asks.keys().cloned().collect();

        for &bid_price in &bid_prices {
            for &ask_price in &ask_prices {
                if ask_price > bid_price {
                    break; // No spread convergence
                }

                let bids_at_price = self.bids.get_mut(&bid_price).unwrap();
                let asks_at_price = self.asks.get_mut(&ask_price).unwrap();

                let mut bid_idx = 0;
                while bid_idx < bids_at_price.len() {
                    let mut ask_idx = 0;
                    while ask_idx < asks_at_price.len() {
                        let bid = &bids_at_price[bid_idx];
                        let ask = &asks_at_price[ask_idx];

                        // AIS Constraint Validation
                        if ask.current_ais >= bid.min_ais {
                            let match_tokens = bid.token_allocation.min(ask.available_tokens);
                            matches.push((bid.clone(), ask.clone(), match_tokens));

                            // Update balances
                            bids_at_price[bid_idx].token_allocation -= match_tokens;
                            asks_at_price[ask_idx].available_tokens -= match_tokens;

                            if asks_at_price[ask_idx].available_tokens == 0 {
                                asks_at_price.remove(ask_idx);
                                continue;
                            }
                        }
                        ask_idx += 1;
                    }
                    if bids_at_price[bid_idx].token_allocation == 0 {
                        bids_at_price.remove(bid_idx);
                        continue;
                    }
                    bid_idx += 1;
                }
            }
        }
        matches
    }
}
```

---

## 4. Phase 4: Developer SDK Distribution

Phase 4 packages the cryptographic client routines for frictionless integration into standard agent libraries.

### 4.1. SDK Packaging & Publishing Pipelines

#### NPM Package Structure (`npm-publish.yml`)
We ship TypeScript source with dual ES-Module (ESM) and CommonJS (CJS) compilation targets:
```yaml
name: Publish NPM SDK
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_PUBLISHING_TOKEN }}
```

#### PyPI Package Structure (`pypi-publish.yml`)
Python packaging uses `hatchling` to build wheel distributions:
```yaml
name: Publish PyPI SDK
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install build twine
      - name: Build distributions
        run: python -m build
      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
        run: twine upload dist/*
```

### 4.2. LangChain Callback Integration
The Python SDK ships with an out-of-the-box callback handler that plugs into LangChain pipelines to capture performance variance, calculate local entropy, and sign/dispatch telemetry automatically.

```python
# integrity_sdk/langchain_handler.py
import time
import math
from typing import Any, Dict, List
from langchain.callbacks.base import BaseCallbackHandler
from .client import IntegrityClient

class IntegrityLangChainCallback(BaseCallbackHandler):
    def __init__(self, agent_id: str, secret_key: str, endpoint: str):
        self.client = IntegrityClient(agent_id=agent_id, secret_key=secret_key, endpoint=endpoint)
        self.start_times = {}

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        run_id = kwargs.get("run_id")
        self.start_times[run_id] = time.perf_counter()

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        run_id = kwargs.get("run_id")
        if run_id not in self.start_times:
            return

        latency = time.perf_counter() - self.start_times[run_id]
        text_outputs = [generation.text for generations in response.generations for generation in generations]
        
        # Calculate local entropy of generated text
        entropy = self._calculate_shannon_entropy(" ".join(text_outputs))
        
        # Dispatch telemetry payload with Point-of-Origin Signature
        self.client.send_telemetry(
            latency_ms=int(latency * 1000),
            performance_variance=float(math.log(latency + 1.0)),
            accuracy_score=0.98, # Base score, dynamically updated in downstream tasks
            avg_entropy=int(entropy * 100),
            avg_grounding=900,
        )

    def _calculate_shannon_entropy(self, text: str) -> float:
        if not text:
            return 0.0
        frequencies = {}
        for char in text:
            frequencies[char] = frequencies.get(char, 0) + 1
        entropy = 0.0
        total_chars = len(text)
        for count in frequencies.values():
            p = count / total_chars
            entropy -= p * math.log2(p)
        return entropy
```

---

## 5. Critical Delivery Checklist & Deadlines

| Phase | Milestone | Deliverable | Security/Compliance Verification |
| :--- | :--- | :--- | :--- |
| **Phase 2** | State Merklization | Rust Tree Builder & Alloy Rollup Cron | Merkle membership verified on Sepolia Testnet. |
| **Phase 2** | Programmatic Slashing | `Slasher.sol` dynamic triggers | Dry-run audit testing for false-positive slashing triggers. |
| **Phase 3** | Dispute Engine | Postgres schema + arbitration state rules | Verification that arbitrator keys are multi-sig restricted. |
| **Phase 3** | Match Engine | Rust Priority Queue orderbook | Performance test matching engine with > 10,000 matches/sec. |
| **Phase 4** | LangChain / CrewAI | Custom callbacks and intention validators | Package security scan (Twine / NPM check). |

---

**Approval Authority:** Xibalba Solutions LLC  
**Date:** Thursday, June 4, 2026  
**Status:** PROVISIONALLY APPROVED FOR DEVELOPMENT STAGING
