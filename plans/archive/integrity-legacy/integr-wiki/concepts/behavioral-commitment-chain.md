---
title: Behavioral Commitment Chain (BCC)
acronyms: [BCC]
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [cryptography, compliance, layer-2]
confidence: high
---

# Behavioral Commitment Chain (BCC)

The **Behavioral Commitment Chain (BCC)** is a cryptographic security protocol designed to intercept the non-deterministic, stochastic behavior of AI agents. Serving as the core middleware for the autonomous agent economy powered by smart contracts, it forces agents to cryptographically declare and lock-in their intended action states before they are allowed to mutate any database, external API, or transaction ledger. All on-chain settlement happens on Base L2.

## 1. The Core Mechanical Flow
Stochastic agents have fluid reasoning steps, making them vulnerable to prompt injections or sudden algorithmic drifts. The BCC neutralizes this by enforcing a hard, two-phase gate:

1.  **Declaration (Pre-Commitment):** Before executing an action (e.g. writing patient diagnosis to a DB, executing a financial trade), the agent serializes its proposed parameters into canonical JSON and computes a SHA-256 `intended_state_hash`. This hash, along with the agent ID and timestamp, is signed with point-of-origin private keys.
2.  **Enforcement (Execution Check):** At the moment of execution, the receiving proxy or smart contract evaluates the actual execution context against the signed commitment hash. If there is any drift or unauthorized state alteration, the transaction is immediately aborted.

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Agent (TEE Enclave)
    participant SDK as Integrity SDK
    participant Oracle as Axum Oracle
    participant L2 as Base L2 Ledger
    participant System as Target System (DB/API)

    Agent->>SDK: 1. Serialize Intended Parameters (JSON)
    SDK->>SDK: 2. Compute SHA-256 (intended_state_hash)
    SDK->>SDK: 3. Sign Envelope with DID Private Key
    SDK->>Oracle: 4. Dispatch Telemetry Envelope
    Oracle->>Oracle: 5. Verify Signature & Noir ZK-Proof
    Oracle->>L2: 6. Anchor Merkle Root Commit
    Oracle-->>SDK: 7. Return Pre-Execution Approval
    SDK->>System: 8. Execute Action (validate_and_execute)
    System->>System: 9. Compare Hash (Context == Commitment)
    System-->>Agent: 10. Confirm Success / Reject on Drift
```

## 2. Low-Friction Implementations
To prevent integration fatigue from agents and developers, the BCC is abstracted into:
*   [Mcip](mcip.md): Standardizes dynamic interface guardrails.
*   [did](did.md): Handles tethered hardware identities. For testing, agents use Developer API Keys generated via the dashboard. These bypass strict hardware DID validation but cap their Trust Level (AIS) at a maximum of 300.
*   **BCC MCP Server:** A stdio JSON-RPC interface that exposes a simple `commit_action_intent` tool directly to the agent's context window.

## 3. Related Terms
-   **AIS:** The [ais](ais.md) increases as the agent compiles consecutive successful, un-slashed commitments.
-   **OPA:** Open Policy Agent rules evaluate these commitments in real-time.
-   **Paymaster:** The [Stablecoin Vault Paymaster](../entities/stablecoin-vault-paymaster.md) sponsors the transaction fees for anchored commitments using stablecoin balances.
