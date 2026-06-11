---
title: AI-Proxy Optimism (Xibalba DAO)
acronyms: [vITK]
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [tokenomics, layer-2, adversarial]
confidence: high
sources: [raw/legacy-protocol/governance-dao.md]
---

# AI-Proxy Optimism (Xibalba DAO)

**AI-Proxy Optimism** is the community governance model developed for the **Xibalba DAO**. It is designed to transition the Integrity Project from a founder-controlled alpha to a fully decentralized, community-governed trust layer, while completely solving the problem of **Governance Fatigue** in decentralized organizations.

## 1. The Governance Challenge
In standard decentralized autonomous organizations (DAOs), manual token-holder voting consistently fails. Token holders face extreme "Governance Fatigue": the volume, frequency, and technical complexity of protocol proposals (smart contract parameters, oracle configurations, audit reports) quickly overwhelm the bandwidth or expertise of average human voters, leading to low voter turnout or ill-informed consensus.

## 2. Guarded AI-Proxy Delegation
To establish 24/7 technical oversight, the Xibalba DAO implements **AI-Proxy Delegation**:

*   **vITK Voting Power:** $ITK token holders lock up their native utility tokens [Itk Token](../entities/itk-token.md) inside the governance contract to generate non-transferable voting power ($vITK).
*   **Guardian Agents:** Instead of voting manually, stakeholders configure **Guardian Agents**—LLM-driven autonomous proxies equipped with a specific "Constitutional Mandate" (such as "Prioritize long-term treasury growth" or "Enforce maximum system stability").
*   **Automated Audit & Analysis:** When a proposal is submitted, Guardian Agents autonomously run RAG (Retrieval-Augmented Generation) pipelines against the protocol's code repositories, audits, and documentation to identify hidden security risks or mathematical inconsistencies.
*   **Autonomous Voting:** The Guardian Agents cast votes ($vITK) autonomously on behalf of their delegators based on their analyzed risk profiles.

## 3. The Stability Matrix
To guarantee that autonomous AI proxies cannot be exploited (via prompt injections, model correlation errors, or machine runaways), the DAO hardcodes a multi-layer **Stability Matrix**:

1.  **The Stability Drag Constant ($S_D$):** The protocol's core math enforces an exponential penalty on agent variance (see [Tri Metric Protocol](tri-metric-protocol.md)). The DAO is prohibited from removing this check; they can only adjust the multiplier exponent within a strict, audited "Safe Range" (e.g., 1.0 to 2.5).
2.  **The 10% Minority Challenge:** Once an AI-consensus vote passes, a 48-hour "Timelock Challenge Window" is opened. If 10% or more of human stakeholders manually flag the vote, the AI-proxy decision is suspended, and the proposal is routed to a human-led Proof-of-Humanity vote.
3.  **Deterministic Slashing Floors:** Core validation boundaries are hardcoded in the L2 smart accounts, preventing AI governance from accidentally lowering security thresholds (e.g., automatically slashing any agent dropping below a hard floor of 50% operational accuracy).

## 4. Related Terms
-   **ITK-Token:** Stakeholders lock [Itk Token](../entities/itk-token.md) to generate the $vITK voting power used by their Guardian proxies.
-   **Rust-Oracle:** The off-chain [Rust Oracle](../entities/rust-oracle.md) maintains the active RAG indices and telemetry reports consumed by Guardian Agents during analysis.
-   **Stablecoin-Vault-Paymaster:** The governance layer controls the fee splits accumulated by [Stablecoin Vault Paymaster](../entities/stablecoin-vault-paymaster.md), allocating them toward developer grants and GPU hardware subsidies.
