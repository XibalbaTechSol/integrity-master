---
title: The Tri-Metric Protocol
acronyms: [AIS]
created: 2026-05-31
updated: 2026-06-19
type: concept
tags: [metrics, compliance, control-systems]
confidence: high
---

# The Tri-Metric Protocol

The **The Tri-Metric Protocol** (also packaged as the **Attestation Vector**) is our proprietary mathematical evaluation framework. It compiles high-dimensional agent telemetry into a multi-dimensional trust coordinate, representing how safely, predictably, and accountably an agent is operating.

## 1. The Tri-Metric Equations

The protocol measures and combines three key vectors:

### A. Entropy (E) - Stability Metric
Measures the rolling mathematical variance in response logs, token metadata, and transaction outputs. High volatility or unpredictable behavioral drifts decay this score exponentially:
$$E = e^{-1.5 \times \text{variance}} \times 1000$$
Where $\text{variance}$ represents the verified behavioral telemetry drift.

### B. Grounding (G) - Compliance Metric
Measures the density of verified human-in-the-loop (HITL) approvals and static policy compliance events. Direct, unverified autonomous mutations decay this score, while verified administrative consensus locks it at 950+.

### C. Sacrifice (S) - Economic Metric
Quantifies the economic "skin in the game" or physical computational overhead committed by the agent host. This prevents cheap Sybil identity replication:
$$S = \min\left(1.0, \frac{\text{GPU\_Hours}}{\text{Threshold}}\right) \times 1000$$

---

## 2. Agent Integrity Score (AIS)
The **Agent Integrity Score (AIS)** is the composite trust rating (0 to 1000). As of Phase 4 (Institutional Generalization), the AIS is calculated as a **weighted vector sum** based on domain-specific [Scoring Policies](../entities/rust-oracle.md):

$$\text{AIS} = (E \cdot w_E + G \cdot w_G + S \cdot w_S) \times ZK_{boost}$$

*   **$w_E, w_G, w_S$:** Domain-specific weights (e.g., Finance favors $E$, Healthcare favors $G$).
*   **$ZK_{boost}$:** A cryptographic multiplier rewarded to agents providing verifiable ZK-proofs of inference.

### Verification Tier Ceilings
To ensure absolute accountability, the final AIS is mathematically capped by the agent's cryptographically verified identity status:

| Tier | Identity Status | AIS Ceiling | Risk Profile |
| :--- | :--- | :--- | :--- |
| **Tier 1: Sovereign** | Cryptographically unique but anonymous (key possession only) | **600** | Speculative (CCC) |
| **Tier 2: Linked** | Bound to verified digital domain or social identity | **850** | Production (AA) |
| **Tier 3: Institutional** | Fully Audited Legal Entity (DUNS/KYC) | **1000** | Negligible (AAA) |

**Final Formula:** $AIS_{final} = \min(S_{calculated}, Tier_{ceiling})$

## 3. Related Terms
-   **BCC:** Telemetry from the [Behavioral Commitment Chain](behavioral-commitment-chain.md) serves as the direct data source for Tri-Metric calculations.
-   **ZKP:** The calculation of the AIS vector can be compiled into [Aztec Noir Circuits](aztec-noir-circuits.md) to protect operator privacy.
-   **Paymaster:** The [Stablecoin Vault Paymaster](../entities/stablecoin-vault-paymaster.md) is responsible for converting collected transaction-level fees into deflationary buybacks, serving as a tokenomic sink linked to the overall AIS average.
