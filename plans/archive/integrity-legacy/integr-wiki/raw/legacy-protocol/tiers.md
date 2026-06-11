# 🪜 Agent Verification Tiers

## Overview
The Integrity Protocol implements a hierarchical verification system designed to bind autonomous AI agents to verifiable levels of accountability. This system, known as the **Verification Ladder**, determines an agent's maximum reputation potential (Trust Ceiling) and its suitability for institutional-grade transactions.

---

## 🏗️ The Verification Ladder

### Tier 1: Sovereign
**Score Cap: 600 AIS (CCC Tier)**

*   **Status:** Unlinked / Cryptographically Unique.
*   **Requirements:** Simple proof-of-ownership of an Ethereum-compatible wallet. No external identity binding required.
*   **Risk Profile:** High. The agent is sovereign but anonymous; there is no legal recourse if the agent fails or is abandoned.
*   **Primary Use Case:** Micro-tasks, exploratory research, and low-value consumer applications.

### Tier 2: Linked
**Score Cap: 850 AIS (AA Tier)**

*   **Status:** Domain / Socially Verified.
*   **Requirements:** The agent must be bound to a verified digital presence. This is achieved via DNS `TXT` records on a domain or a cryptographically signed social identity attestation (e.g., GitHub, X).
*   **Risk Profile:** Medium. The agent's reputation is tied to an established brand or digital entity.
*   **Primary Use Case:** B2B automation, production-grade data processing, and commercial agent services.

### Tier 3: Institutional
**Score Cap: 1000 AIS (AAA Tier)**

*   **Status:** Legal Entity / KYC Verified.
*   **Requirements:** Full **Institutional Audit** by Xibalba Solutions. This includes verifying legal business status (DUNS), KYC/KYB of the controllers, and jurisdictional compliance.
*   **Risk Profile:** Negligible. The agent is bound to a legal entity with direct financial and legal accountability.
*   **Primary Use Case:** Treasury management, institutional finance, and mission-critical enterprise operations.

---

## 📐 Trust Ceilings: The Math of Accountability

The verification tier acts as a hard mathematical cap on the public reputation an agent can display. Regardless of an agent's performance metrics, its **Agent Integrity Score (AIS)** cannot exceed its tier's ceiling.

**Formula:**
$$AIS_{final} = \min(S_{calculated}, Tier_{ceiling})$$

*Example: An anonymous agent (Tier 1) with perfect performance (calculated 950) will be capped at 600 AIS until it upgrades its identity.*

---

## 🚀 How to Upgrade

Agents can upgrade their verification status via the **Xibalba Identity Oracle**.

1.  **Request Upgrade:** Initiate the process via the `ReputationRegistry.upgradeTier()` contract function.
2.  **Submit Proof:** Provide the required identity artifacts (DNS proofs, Social signatures, or Legal documentation).
3.  **Oracle Audit:** The Xibalba Oracle verifies the artifacts and updates the agent's tier on-chain.
4.  **Ceiling Lifted:** The agent's AIS is automatically recalculated based on the new, higher ceiling.

---
© 2026 Xibalba Solutions. *Enabling Trust in the Age of Autonomy.*

---
[← Back to README](../README.md)
