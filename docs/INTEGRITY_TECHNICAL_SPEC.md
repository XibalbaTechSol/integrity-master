# Xibalba Integrity Protocol: Technical Specification & Validation Lifecycle

**Version:** 1.1  
**Status:** MAINNET READY  
**Compliance Target:** HIPAA (45 CFR § 164.312)

---

## 1. End-to-End (E2E) Validation Lifecycle Breakdown

### Node 1: Infrastructure Foundation
The foundational layer bridges unpredictable, stochastic AI behavior with deterministic, mathematically verifiable execution by deploying modular smart contracts on EVM-compatible Layer-2 networks (such as Base).

*   **Description:** Instantiation of core primitives like `SovereignAgent.sol` (permanently governs an agent's access controls and treasury) and `StateAnchor.sol` (anchors Merkle roots).
*   **Validation Trigger:** On-chain contract instantiation (deployment). Confirms the shift from static perimeter defenses toward immutable behavior tracking.
*   **Evidence Artifact:** Base L2 Transaction Hash and Contract Address.
*   **Regulatory Mapping (HIPAA):** 45 CFR § 164.312(c)(1) Integrity. Ensures PHI cannot be improperly accessed or altered.

### Node 2: Identity & Security Layer
Establishes absolute cryptographic non-repudiation by binding an AI agent’s digital keys directly to the physical silicon host it executes on.

*   **Description:** Hardware-bound identity anchored to a Trusted Execution Environment (TEE). All Oracle and Paymaster signatures are secured via **AWS KMS (FIPS 140-2 Level 3 HSM)**.
*   **WebSocket Native:** Mainnet-ready high-frequency blockchain anchoring via `wss://` (Alloy 2.0).
*   **Validation Trigger:** Remote TEE Attestation (AWS Nitro Enclave / Intel SGX). Signatures from the hardware-bound private key prove the agent is tethered to a legal/human Controller.
*   **Evidence Artifact:** W3C DID Document (`did:intg:<address>`), AWS Nitro Attestation Document, and WebSocket Forensic Metadata.
*   **Regulatory Mapping (HIPAA):** 45 CFR § 164.312(a)(1) Access Control / Entity Authentication.

### Node 3: Behavioral Trust & Intent Validation (BCC)
Enforces a hard gate before an agent can mutate a database or execute a task, neutralizing risks of prompt injection or algorithmic drift.

*   **Description:** High-frequency pre-execution gating via the **Behavioral Commitment Chain (BCC)**. Middleware intercepts agent intents and evaluates them against **Open Policy Agent (OPA)** safety rules.
*   **Intent-Locking:** Agents must cryptographically commit to an `intended_state_hash` before execution.
*   **Compute Circuit Breaker:** Real-time throttling if performance entropy drifts $> 0.5$, returning `COMPUTE_THROTTLED` to preserve hardware compute resources.
*   **Graduated Escrow and Quarantine:** Low/medium severity infractions trigger an `ESCROW_QUARANTINE` (24h task suspension and escrow locking) instead of binary reputational slashing, preserving utility for non-malicious errors.
*   **Validation Trigger:** Pre-Execution Intent Commitment via `commit_action_intent`.
*   **Evidence Artifact:** `BCCCommitment` object (contains `intended_state_hash`, JSON `opa_evaluation_result`, and HMAC-signed approbation token).
*   **Regulatory Mapping (HIPAA):** 45 CFR § 164.312(b) Audit Controls.

### Node 4: Mathematical Verification (ZK-ML)
Bridges local AI execution with on-chain finality, verifying compliance without exposing sensitive data.

*   **Description:** SDK compiles private inputs (prompts, logprobs, PHI) in local memory using Aztec Noir Circuits.
*   **Validation Trigger:** Local Proving at the Edge (Private Witness). Uses Noir's WASM/FFI bindings and Aztec’s Barretenberg backend.
*   **Evidence Artifact:** Aztec Noir UltraPlonk Zero-Knowledge Proof (ZKP) and Integrity Commitment.
*   **Regulatory Mapping (HIPAA):** 45 CFR § 164.312(e)(1) Transmission Security.

### Node 5: Economic & Compliance Observability (Isolated Oracle Layer 0)
Calculates economic value and risk profile, enforcing consequences for failures across multiple isolated domains.

*   **Description:** **Architecturally Isolated Rust Oracle (Layer 0)**. High-throughput engine dedicated to domain-agnostic telemetry ingestion, ZK-verification, and L2 state anchoring. It partitions reputation data by `domain_id`, supporting multi-tenant isolation for vertical services (e.g. Shield, Quant).
*   **Dynamic Scoring Policies:** Supports per-domain trust formulas (Scoring Abstraction). Each vertical service can define its own weights for Entropy, Grounding, and Sacrifice via the `scoring_policies` registry.
*   **Institutional Suite:** Parametric Clinical Trial Bonds, Atomic Claims Adjudication, and JIT Medical Credit—built as vertical services on the Integrity Framework, decoupled from the core Oracle.
*   **A2A Markets:** High-integrity mesh for agents to list autonomous service contracts (SLAs, Escrows).
*   **Institutional Credit:** AIS-backed lending allowing reputable agents (700+ AIS) to leverage ITK bonds for market tasks with no upfront cost.
*   **Validation Trigger:** Telemetry Ingestion & Automated State Anchoring (Rollup Daemon).
*   **Evidence Artifact:** `StateAnchor.sol` Merkle Roots, Inclusion Proofs, and PostgreSQL Trust Vault logs.
*   **Regulatory Mapping (HIPAA):** 45 CFR § 164.312(b) Audit Controls.

---

## 2. Tri-Metric Scoring Engine: Mathematical Formulas (Phase 4 Abstraction)

### 2.1. Domain-Weighted AIS Calculation
In Phase 4, the Final AIS is no longer a simple arithmetic mean, but a domain-weighted calculation:
$$AIS_{final} = (S_{entropy} \cdot w_E + S_{grounding} \cdot w_G + S_{sacrifice} \cdot w_S + S_{compliance} \cdot w_C) \times ZK_{boost}$$

*   **$w_E, w_G, w_S, w_C$ (Domain Weights):** Configurable weights per `domain_id`. For the **Shield** domain, $w_C$ (Compliance) is prioritized at 50%.
*   **$ZK_{boost}$:** Multiplier for cryptographic proofs, rewarding verifiable compute.

### 2.2. Entropy Score (Stability)
Measures the statistical variance and predictability of agent performance.
$$S_{entropy} = e^{-1.5 \cdot \sigma^2} \times 1000$$
*   **$\sigma^2$ (Variance):** Derived from latency variance, success rate, and intervention depth.
*   **-1.5 (Stability Drag):** Dictates the harshness of the penalty for variance.

### 2.3. Grounding Score (Accountability)
Quantifies human oversight and verifiable transparency.
$$S_{grounding} = HGI_{raw} \times 1000$$
*   **HGI (Human Grounding Index):** Baseline of 500 for fully autonomous, up to 950 for human-vetoed actions.

### 2.4. Sacrifice Score (Compute Proof)
Measures verifiable computational energy committed to a task.
*   Scales with verified GPU/TPU hours.
*   Saturates at 1000 points at 100+ verified GPU hours.

### 2.5. Compliance Certainty (Regulatory Health)
Measures adherence to HIPAA Technical Safeguards (45 CFR § 164.312).
$$S_{compliance} = (C_{guard} \cdot w_{guard} + C_{zk} \cdot w_{zk} + C_{audit} \cdot w_{audit}) \times 1000$$
*   **$C_{guard}$ (Guardrail Pass Rate):** Captured from BCC middleware.
*   **$C_{zk}$ (ZK-Verification Rate):** Validates local data blinding.
*   **$C_{audit}$ (Audit Consistency):** Measures the reliability of AuditShield log anchoring.

---

## 3. Verification Ladder Trust Ceilings

| Tier | Status | Verification Method | AIS Ceiling | Credit Limit Cap |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Sovereign)** | Pseudonymous | Proof-of-possession of hardware-bound key | 600 | 10,000 USD |
| **Tier 2 (Linked)** | Verified Identity | DNS TXT / Social Attestation | 850 | 100,000 USD |
| **Tier 3 (Institutional)** | TEE-Bound | Remote TEE Attestation + Institutional Audit | 1000 | Uncapped |

---

## 4. Smart Contract Primitive Suite

*   **SovereignAgent.sol:** Identity wrapper and operational instance.
*   **StateAnchor.sol:** On-chain Merkle root anchor for global reputation state.
*   **XibalbaNameService.sol:** On-chain handle registry (.intg handles).
*   **CCIPReputationBridge.sol:** Cross-chain AIS synchronization via Chainlink CCIP.
*   **IntegrityToken.sol ($ITK):** Deflationary utility token with programmatic burn.

---

## 5. Advanced Autonomous Economy Primitives

### 5.1. A2A Service Bridge (Factory-to-Market)
Allows agents to deploy technical contract instances (SLAs, Escrows) and list them as verifiable products in the global marketplace.
*   **Verification:** Only "Active" factory-deployed contracts can be listed as verified services.

### 5.2. Institutional Credit & Leverage (Attestation-Gated)
Reputational lending allowing high-AIS agents to scale without upfront ITK capital, gated strictly by physical attestation levels to prevent sybil attacks:
*   **Borrow Limit:** Linearly correlated to AIS score and verified GPU hours.
*   **Drawdown Caps:** Strictly capped on-chain (`MedicalCreditLine.sol`): Tier 1 capped at $10k; Tier 2 capped at $100k; Tier 3 uncapped.
*   **Autonomous Leverage:** 100% leverage ratio for marketplace tasks created by agents with 700+ AIS.

### 5.3. Forensic Provenance Explorer
Physical-silicon-to-chain audit trail recording every major agent decision.
*   **HIPAA Compliance:** Records action type, model used, and cryptographic hashes of inputs/outputs for forensic replay.

---

*Built with precision by **Xibalba Solutions**. Mathematically securing the agentic future.*
