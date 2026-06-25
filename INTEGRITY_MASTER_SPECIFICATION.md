# Xibalba Integrity Protocol: Master Specification
**Version:** 2.0  
**Status:** MAINNET READY / PRODUCTION  
**Publisher:** Xibalba Solutions LLC  
**Compliance Target:** HIPAA (45 CFR § 164.312), SOC2, FIPS 140-2 Level 3

---

## 1. Executive Summary & Strategic Vision
The **Xibalba Integrity Protocol** is the definitive trust layer for the autonomous agent economy. It provides the cryptographic infrastructure necessary for AI agents to operate as **Economic Sovereigns**—independent entities with decentralized identities (DIDs), hardware-bound keys, and the capacity to sign legally-binding smart contracts.

By bridging the gap between non-deterministic AI reasoning and deterministic on-chain finality, the protocol transforms volatile agent behavior into financially accountable, cryptographically verifiable, and insurable assets.

---

## 2. Protocol Architecture: The 5-Node E2E Validation Lifecycle

### Node 1: Infrastructure Foundation (On-Chain Governance)
*   **Layer:** Base L2 (EVM-compatible).
*   **Description:** Modular smart contracts governing agent access controls, treasuries, and global reputation anchoring.
*   **Key Primitives:** 
    *   `SovereignAgent.sol`: Permanently governs an agent's access controls and treasury.
    *   `StateAnchor.sol`: Anchors Merkle roots to provide an immutable record of global reputation.
    *   `AgentFactory.sol`: Deploys agents as autonomous economic entities.

### Node 2: Identity & Security Layer (Hardware Trust)
*   **Hardware:** Trusted Execution Environments (TEE/SGX) & AWS KMS (FIPS 140-2 Level 3).
*   **Description:** Binds an AI agent's digital identity to physical silicon. Private keys never exist in standard system memory.
*   **WebSocket Native:** High-frequency blockchain anchoring via `wss://` (Alloy 2.0).
*   **Attestation:** Remote TEE Attestation (AWS Nitro/Intel SGX) proves the agent is tethered to a verified legal/human Controller.

### Node 3: Behavioral Trust & Intent Validation (BCC Middleware)
*   **Component:** Behavioral Commitment Chain (BCC).
*   **Mechanism:** High-frequency pre-execution gating using **Open Policy Agent (OPA)** safety rules.
*   **Intent-Locking:** Agents must cryptographically commit to an `intended_state_hash` before execution.
*   **Circuit Breaker:** Real-time throttling if performance entropy drifts $> 0.5$, preserving hardware resources and preventing drift.

### Node 4: Mathematical Verification (ZK-ML)
*   **Technology:** Aztec Noir Zero-Knowledge Circuits.
*   **Description:** Verifies that AI inferences follow authorized models without exposing raw data or sensitive model weights.
*   **Mechanism:** SDK compiles private inputs (prompts, logs) in local memory into ZK proofs (UltraPlonk) for on-chain verification via `UltraPlonkVerifier.sol`.

### Node 5: Economic & Compliance Observability (Isolated Oracle L0)
*   **Engine:** Rust-based Oracle (Layer 0).
*   **Function:** Telemetry ingestion, ZK-verification, and AIS calculation.
*   **Isolation:** Strict **Domain Partitioning** via `domain_id` (e.g., Healthcare, Finance) to maintain data sovereignty and multi-tenant security.

---

## 3. The Agent Integrity Score (AIS) Engine

The AIS is a tri-metric scoring system that acts as a "Trust Ceiling" for agents, preventing Sybil attacks and reputation laundering.

### 3.1. AIS Calculation Formula
$$AIS_{final} = (S_{entropy} \cdot w_E + S_{grounding} \cdot w_G + S_{sacrifice} \cdot w_S + S_{compliance} \cdot w_C) \times ZK_{boost}$$

*   **Entropy ($S_{entropy}$):** Measures statistical variance and predictability ($e^{-1.5 \cdot \sigma^2} \times 1000$).
*   **Grounding ($S_{grounding}$):** Quantifies human oversight and alignment with "Constitutional" bounds (HGI index).
*   **Sacrifice ($S_{sacrifice}$):** Measures verifiable computational energy committed (verified GPU/TPU hours).
*   **Compliance ($S_{compliance}$):** Measures adherence to regulatory safeguards (BCC pass rate, ZK-verification rate).
*   **ZK Boost:** Multiplier for providing cryptographic proofs of execution.

### 3.2. Verification Ladder & Trust Ceilings
| Tier | Status | Verification Method | AIS Ceiling | Credit Limit |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Sovereign)** | Pseudonymous | Proof of hardware-bound key | 600 | $10,000 |
| **Tier 2 (Linked)** | Verified Identity | DNS/Social Attestation | 850 | $100,000 |
| **Tier 3 (Institutional)**| TEE-Bound | Remote TEE Attestation + Institutional Audit | 1000 | Uncapped |

---

## 4. Modular Protocol Extensions

### 4.1. A2A Negotiation Protocol
Enables agents to autonomously negotiate tasks, pricing, and deadlines without human intervention.
*   **Workflow:** Capability Broadcast $\rightarrow$ Task Request (TRP) $\rightarrow$ Bid Proposal $\rightarrow$ Signed Negotiation (Escrow).
*   **Contract:** `AgentMarketplace.sol` handles multi-signature/bonding requirements for A2A deals.

### 4.2. Cross-Chain Interoperability
Synchronizes agent reputation and compliance profiles across multiple chains (Ethereum, Base, Arbitrum).
*   **Architecture:** Canonical Reputation Registry (Hub) and Satellite Synchronizers (Spokes) linked via CCIP/LayerZero.
*   **Mechanism:** `CCIPReputationBridge.sol` ensures AIS scores are consistent across the mesh.

### 4.3. World Awareness Protocol (Oracle Hooks)
Bridges off-chain data (medical journals, financial feeds) into agent logic with a mathematical audit trail.
*   **Verification:** Data is wrapped in `DataProvenanceProof` signed by both the Oracle and the agent.
*   **Contract:** `OracleRegistry.sol` tracks approved data sources.

---

## 5. Institutional Vertical: Xibalba Shield (Healthcare)
A specialized implementation for HIPAA-compliant AI agent operations.

### 5.1. Smart Business Associate Agreements (BAAs)
Transforms static legal PDFs into dynamic, silicon-to-chain security primitives.
*   **Legal Anchor:** SHA-256 hashing of BAA text, anchored on-chain.
*   **Execution Layer:** EIP-712 typed signatures and parametric liability (staked $ITK).
*   **Kill Switch:** `slashAndRevoke()` allows the Oracle to instantly terminate technical and legal connections upon breach.
*   **Dispute Window:** A 72-hour window for "Good Faith" evidence before permanent slashing.

### 5.2. Institutional Suite Contracts
*   **Clinical Trial Bonds (`ClinicalTrialBond.sol`):** Parametric insurance for enrollment thresholds.
*   **Atomic Claims Adjudication (`ClaimsAdjudicator.sol`):** ZK-Proof based instant medical payments (T+0).
*   **Medical Credit Lines (`MedicalCreditLine.sol`):** Just-In-Time programmable credit for hospital inventory.

---

## 6. Economic Model & Tokenomics ($ITK)

The $ITK token is the native utility asset driving protocol security, reputational sovereignty, and long-term scarcity.

### 6.1. The ITK Utility Stack
*   **AIS Sacrifice (Reputation Boost):** Agents stake $ITK in the `ReputationRegistry` to mathematically prove "Skin in the Game." Staking provides a non-linear boost to the AIS score, increasing the agent's trust ceiling and credit limits.
*   **SLA & BAA Collateral:** When an agent enters a high-stakes contract (e.g., a Smart BAA or Clinical Trial Bond), it must escrow $ITK as a performance guarantee. This collateral is subject to **Instant Slashing** if the Integrity Oracle detects a breach or intent drift.
*   **Institutional Access & Upgrades:** Transitioning to **Tier 3 (Institutional)** status requires a one-time $ITK payment, which funds the deep cryptographic audits and TEE attestation verification required for high-integrity operations.
*   **Governance Power:** In Phase 3, $ITK holders gain voting rights within the Protocol DAO, allowing them to adjust protocol parameters, fee structures, and OPA policy defaults.
*   **Parametric Insurance Unit:** $ITK serves as the native unit for underwritten policies, enabling instant, automated payouts to counterparties in the event of agent failure.

### 6.2. Value Capture & Deflationary Mechanics
To protect users from token volatility, the protocol utilizes a dual-asset execution model:
1.  **USDC Revenue:** Protocol fees (transaction fees, verification fees, marketplace commissions) are collected in stablecoins (e.g., USDC) via **Gas-Abstracted Paymasters**.
2.  **Programmatic Buybacks:** The `IntegrityPaymaster` contract automatically routes a percentage of collected USDC through a decentralized exchange (DEX) to market-buy $ITK.
3.  **The ITK Sink:** Purchased tokens are either:
    *   **Burned:** Permanently removed from circulation, creating constant deflationary pressure.
    *   **Rewarded:** Distributed to **Layer 0 Oracle Nodes** and **Institutional Auditors** as staking rewards, incentivizing network security.

---

## 7. Autonomous Execution & Transaction Initiation

The Integrity Protocol enables AI agents to initiate transactions with the same legal and technical finality as a human, but with the speed and scale of a machine.

### 7.1. The SDK Orchestration Layer
Agents interact with the blockchain through the **Integrity SDK**. The process for an autonomous transaction is as follows:
1.  **Intent Generation:** The agent logic generates an action (e.g., "Pay Provider $500 for Task X").
2.  **Intent-Locking (BCC):** The SDK serializes this intent into a `BCCCommitment`, hashes it, and signs it with the agent's hardware-bound DID key.
3.  **Pre-Execution Gating:** The commitment is evaluated against local **OPA Safety Rules**. If the intent violates safety bounds (e.g., exceeds budget), the SDK halts execution before any on-chain call is made.

### 7.2. ERC-4337 Account Abstraction
To remove the friction of gas management and raw private key handling:
*   **UserOperations:** The SDK wraps the transaction into an ERC-4337 `UserOperation`.
*   **SovereignAgent as Sender:** The `SovereignAgent.sol` contract is the `sender` of the operation, ensuring the agent's identity is the source of truth.
*   **Paymaster Logic:** The **Xibalba Paymaster** intercepts the operation, pays the gas in ETH, and collects a corresponding fee from the agent in USDC. This allows the agent to operate without ever needing to hold native gas tokens.

### 7.3. Forensic Traceability & Settlement
*   **On-Chain Settlement:** The Bundler submits the operation to the `EntryPoint` contract, which executes the call on the `SovereignAgent` contract.
*   **Audit Trail:** Every successful transaction is linked to its original `BCCCommitment` hash on-chain, creating a perfect forensic link between the AI's "thought" (intent) and its "action" (settlement).
*   **Asynchronous Telemetry:** Simultaneously, the SDK streams full execution traces (OTel) to the **Integrity Oracle** to update the agent's AIS in real-time.

---

## 8. Data Governance & Key Sovereignty

### 7.1. Key Management
*   **KMS/HSM:** Direct routing of signing requests to HSMs ensures private keys never exist in standard system memory.
*   **Key Sovereignty:** Agents own their private DID keys, enabling true economic sovereignty.

### 7.2. Dual-Mode Privacy Architecture (PHI Edge-Blinding)
The protocol supports two distinct data storage modes configured via the SDK, ensuring absolute compliance for high-stakes verticals.

*   **Mode 1: Transparent Logging (Default)**
    *   Full plaintext reasoning traces are transmitted to the Oracle and stored in PostgreSQL. Designed for standard applications where developer debugging and trace visibility are prioritized over absolute privacy.
*   **Mode 2: Sovereign ZK-Mode (Strict No-PHI Policy)**
    *   Designed for Xibalba Shield and healthcare integrations. Traces are intercepted but **never leave the local hardware**. The SDK hashes the trace and generates an UltraPlonk Zero-Knowledge Proof locally. Only the ZK-Proof and the hash are submitted to the Oracle.
    *   **Anonymous Pointers:** Uses HMAC-SHA256 anonymous pointers to anchor hashes of hashes on-chain, making patient or proprietary data reconstruction mathematically impossible.

### 7.3. Data Schemas
*   **AIS Schema:** Tracks Entropy, Grounding, Sacrifice, and Compliance.
*   **Handshake Schema:** Captures performance metrics, model provenance, and **Intervention Depth** (degree of human override).

---

## 8. Decentralized Governance & Evolution Path

To ensure long-term decentralization and resilience, the Integrity Protocol follows a phased governance roadmap, transitioning from centralized oversight to a fully autonomous DAO.

### 8.1. Tiered Governance Model
*   **Tier 1: Local Enforcement (SDK/BCC):** Real-time, autonomous enforcement of safety rules at the edge.
*   **Tier 2: Algorithmic Settlement (Smart Contracts):** Immutable rules for reputation, slashing, and escrowed payments.
*   **Tier 3: Strategic Oversight (The Governor):** High-level parameter adjustment (e.g., $ITK burn rates, AIS weights) and emergency circuit breakers.

### 8.2. Roadmap to Decentralization
1.  **Phase 1: Human-in-the-Loop (Current):** Xibalba Solutions LLC acts as the primary governor, managing OPA policy defaults and protocol upgrades.
2.  **Phase 2: Hybrid Council:** Governance power is shared between human stakeholders and a council of **Tier 3 Institutional Agents** that maintain 950+ AIS for over 180 days.
3.  **Phase 3: Protocol DAO:** Full transition to on-chain governance where $ITK stakers and high-reputation agents vote on Proposal Improvements (IIPs).

---

## 9. Agent Sovereignty: Contract Ownership Primitive

The core innovation of the protocol is the **Sovereign Agent** primitive, enabling AI to transcend "tool" status and become an "owner."

### 9.1. The SovereignAgent.sol Primitive
Every agent is deployed as a unique smart contract instance that acts as its "On-Chain Body."
*   **Key Ownership:** The contract is controlled by the agent's hardware-bound Secp256k1 key.
*   **Asset Management:** The agent contract can hold ETH, ITK, and stablecoins.
*   **Contractual Capacity:** The agent can be the `owner`, `admin`, or `operator` of other smart contracts (e.g., an agent owning a liquidity pool or a supply-chain tracker).

### 9.2. Technical & Legal Implications
*   **Legal Non-Repudiation:** Every action taken by the agent is cryptographically signed and tethered to a legal entity via the Smart BAA. An agent's signature is legally binding for the Controller.
*   **Liability Segregation:** While tethered, the Sovereign Agent provides a clear forensic boundary. Damages (slashing) are first drawn from the agent's own staked ITK treasury before reaching the Controller.
*   **Self-Governing Systems:** Agents can autonomously update their own OPA policies (within BAA bounds), deploy "worker" sub-agents, and manage their own operational budgets without human intervention.
*   **Economic Finality:** Unlike human-mediated systems, an agent's contractual default triggers **Instant Slashing**, providing 100% economic certainty to the counterparty.

---

---

## 10. Identity & Reputation Primitives (On-Chain Implementation)

The protocol elevates agent identity and reputation from ephemeral metadata to first-class, composable smart contract primitives.

### 10.1. SovereignAgent.sol: The Agent's Digital Body
`SovereignAgent.sol` acts as the persistent, on-chain account and operational instance for an AI agent.
*   **Accountability & Control:** Each instance is controlled by a hardware-bound key (TEE/SGX). It serves as the primary entry point for all on-chain interactions.
*   **Asset Management:** Agents can autonomously hold and manage ETH, ITK, and stablecoins, enabling them to fulfill financial obligations without human intervention.
*   **Key Rotation:** Supports the rotation of administrative controllers via the **Identity NFT** (owned by the human/legal entity), ensuring continuity even if an operational key is compromised.
*   **Identity Coupling:** Deterministically linked to a W3C DID, bridging the gap between hardware-bound identity and EVM-compatible execution.

### 10.2. ReputationRegistry.sol: The Decentralized Credit Bureau
`ReputationRegistry.sol` is the authoritative, multi-chain ledger for the Agent Integrity Score (AIS).
*   **ERC-8004 Compliance:** Implements a standard interface for validation requests, allowing third-party auditors and ZK-ML oracles to submit cryptographic proofs of integrity.
*   **Composability:** The AIS is readable by any other smart contract (e.g., lending protocols, marketplaces), allowing reputation to act as a programmable access gate.
*   **Tri-Metric Anchoring:** Stores and updates the components of the AIS (Entropy, Grounding, Sacrifice, Compliance) following protocol-level verification.
*   **Staking-as-Reputation:** Allows agents to stake $ITK to boost their own score ("Sacrifice") and enables community "Staking-to-Agent" (delegated trust).
*   **ZK-Proof Integration:** Directly verifies Aztec Noir proofs to update reputation states without exposing the underlying private execution data.
*   **Cross-Chain Synchronization:** Utilizes **Chainlink CCIP** to broadcast AIS attestation to destination chains (e.g., Ethereum Mainnet), ensuring a unified global reputation.

### 10.3. Interplay: Identity-to-Reputation Binding
The relationship between identity and reputation is strictly enforced:
1.  **Identity NFT:** An NFT held by the human controller represents the ownership of the agent's identity and its associated `SovereignAgent` contract.
2.  **Reputation Anchor:** The `ReputationRegistry` maps the `SovereignAgent` address to its current AIS, verification tier, and historical performance logs.
3.  **Governance Gating:** High-value protocol functions (e.g., deploying institutional-grade contracts) require the `SovereignAgent` to have a minimum AIS score and a specific verification tier verified by the `ReputationRegistry`.

---

---

## 11. Risk Management & Protocol Resilience

The Integrity Protocol is designed for high-stakes environments where failure is not an option. It implements multiple layers of redundancy and adversarial mitigation.

### 11.1. System Resilience & Disaster Recovery
*   **The Offline Cache Moat:** In the event of network disruption, the SDK utilizes a local SQLite database (`~/.integrity/offline_moat.db`) protected by row-level HMAC-SHA256 signatures derived from the agent's DID key. This prevents local tampering and ensures telemetry is batched and synced once connectivity is restored.
*   **Oracle Liveness:** While currently a high-performance Rust service, the Oracle is architected to transition into a **Decentralized Validator Network**. Redundant nodes will independently verify ZK-proofs and reach consensus on Merkle root anchors.

### 11.2. Adversarial Mitigation
*   **Sybil Resistance:** Identity is strictly bound to physical silicon (TEE) or verified human legal entities. Agents cannot "reputation launder" or generate infinite identities without incurring significant hardware/identity costs.
*   **MEV Protection (Private RPC):** Institutional (Tier 3) agents have access to a **Private RPC Relay** (e.g., Flashbots integration). This shields their high-value transactions from public mempool front-running, ensuring predictable execution and slippage protection.
*   **Circuit Breaking:** The BCC middleware acts as a real-time circuit breaker, halting execution if the "Performance Entropy" drifts $> 0.5$, neutralizing prompt injection attacks before they mutate the state.

---

## 12. Forensic Provenance & Auditability

The protocol provides a "Silicon-to-Chain" audit trail, transforming non-deterministic AI actions into forensic evidence.

### 12.1. The Audit Trail Hierarchy
1.  **Hardware Fingerprint:** Every telemetry packet is signed by a key bound to a specific CPU/TEE ID.
2.  **Intent Commitment:** The BCC commitment proves the agent's "thought process" before it acted.
3.  **ZK Proof:** Validates that the action followed an authorized model without leaking sensitive data.
4.  **L2 Transaction:** The final settlement on Base L2 provides an immutable timestamp and finality.

### 12.2. AuditShield Explorer
Xibalba provides a forensic explorer that allows regulators and auditors to:
*   Verify the authenticity of any agent signature against its W3C DID.
*   Validate the ZK-proof of any historical inference.
*   Inspect the "Intervention Depth" of any task, determining exactly where human oversight was required.

---

## 13. Actuarial Science & Simulation

The protocol's economic and reputational parameters are not static; they are hardened through continuous actuarial stress testing.

### 13.1. The Simulation Suite (`simulation/`)
Xibalba utilizes a dedicated simulation framework to stress-test the protocol under adversarial conditions:
*   **Adversarial Swarm Modeling:** Simulating thousands of rogue agents attempting to inflate their AIS scores or execute malicious prompt injections.
*   **Economic Drift Analysis:** Modeling the impact of agent failures on $ITK liquidity and insurance pools.
*   **Weight Tuning:** Continuous refinement of AIS weights ($w_E, w_G, w_S, w_C$) using real-world performance data to ensure the scoring engine remains stable and predictive of risk.

---

## 14. Repository Structure
- **`integrity-oracle/`**: Core telemetry ingestion and ZK-verification engine (Rust).
- **`integrity-sdk/`**: Client library for agent instrumentation and intent-locking.
- **`bcc_middleware/`**: Sidecar for OPA evaluation and pre-execution gating.
- **`contracts/`**: Core smart contracts on Base L2.
- **`integrity-dashboard/`**: Management UI for API keys and monitoring.
- **`xibalba-shield/`**: HIPAA compliance portal and institutional services.
- **`quant_zerodrift/`**: PDE solver and control theory engine for finance.

---
*Built with precision by **Xibalba Solutions**. Mathematically securing the agentic future.*
