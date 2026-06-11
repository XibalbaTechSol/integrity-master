# 🏛️ Identity Architecture: Verifiable Entity Binding

## Overview
In the autonomous agent economy, an AI agent is a high-risk asset. To be institutional-grade and insurable, an agent must be cryptographically bound to a **Controller**—a legal or sovereign entity that can be held accountable for its actions. 

The Integrity Protocol's Identity Architecture defines the standards for this binding, providing a structured **Verification Ladder** that determines an agent's maximum reputation potential.

---

## 1. Entity Binding Mechanism

The protocol uses **EIP-712 Signed Typed Data** to establish a secure, tamper-proof link between an agent's operational wallet and its controller.

### The Binding Schema
Every binding must include the agent's address, the controller's identity, the target verification tier, and an expiration timestamp to prevent replay attacks or stale identity claims.

```json
{
  "domain": { 
    "name": "Xibalba Integrity Protocol", 
    "version": "8.3",
    "chainId": 84532,
    "verifyingContract": "0x0bd07324980856841e83FF95460CcD46EB9B590a"
  },
  "message": {
    "agent_address": "0xAgent_Wallet...",
    "controller_name": "Xibalba Solutions LLC",
    "verification_tier": 3,
    "expires": 1777086222
  }
}
```

---

## 🪜 2. The Verification Ladder

The protocol enforces a hierarchical verification system. As an agent moves up the ladder, it unlocks higher **Trust Ceilings**, allowing it to participate in higher-value transactions and lower-premium insurance pools.

### Tier 1: Sovereign (Score Cap: 600)
- **Status:** Unlinked / Pseudonymous.
- **Verification:** Simple proof-of-possession of a private key.
- **Risk Profile:** High (CCC Tier). The agent can be abandoned without recourse.
- **Use Case:** Experimental sandboxes and low-value micro-tasks.

### Tier 2: Linked (Score Cap: 850)
- **Status:** Domain / Digital Identity Binding.
- **Verification:** The agent proves its origin via DNS `TXT` records, `well-known` configuration files, or social identity attestation (X/GitHub).
- **Risk Profile:** Medium (AA Tier). Reputation is tied to an established digital brand.
- **Use Case:** Production-grade data processing and standard B2B services.

### Tier 3: Institutional (Score Cap: 1000)
- **Status:** Legal / Corporate Entity Binding.
- **Verification:** Requires a **Platinum Audit** by Xibalba Solutions or an authorized Identity Oracle. This includes Business ID verification (DUNS), KYC/KYB, and legal jurisdiction attestation.
- **Risk Profile:** Negligible (AAA Tier). Direct financial and legal recourse is available via the Controller.
- **Use Case:** Institutional finance, treasury management, and high-stakes autonomous negotiation.

---

## 📐 3. Mathematical Implementation: Trust Ceilings

The `verification_tier` is a critical input to the final **Agent Integrity Score (AIS)**. It serves as a hard mathematical cap (Ceiling) on the public reputation an agent can display.

### The Ceiling Formula
The final score is the minimum of the calculated performance metrics and the ceiling assigned to the agent's current tier.

$$AIS_{final} = \min(S_{calculated}, Tier_{ceiling})$$

**Example Scenario:**
An agent in **Tier 1 (Sovereign)** has perfect performance metrics, resulting in a calculated score of **945**. 
However, because it lacks verified accountability, its on-chain AIS is capped:
- $S_{calculated} = 945$
- $Tier_{ceiling} = 600$
- **$AIS_{final} = 600$**

To unlock its true reputation of 945, the operator must upgrade the agent to **Tier 3**.

---

## 🆔 4. Standards Integration

The Identity Architecture is the foundation for the protocol's compliance with global standards.

- **W3C DID**: The binding is represented as a `verificationMethod` within the agent's `did:intg` document.
- **Verifiable Credentials**: Tier status is exported as a signed credential, allowing external protocols to verify an agent's accountability level without querying the Xibalba registry directly.
- **ERC-8004**: The `ReputationRegistry` uses these tiers to categorize agents in its global search index.

---

## ⚡ 5. Identity Oracle API

To ensure high-scale resolution performance, the identity logic has been decoupled into a dedicated, stateless **Identity Oracle API**. This service handles the sub-second resolution of DIDs, generation of Verifiable Credentials, and real-time reverse lookup of agent profiles.

### Core Service Functions
- **DID Resolution**: Resolves any registered agent address to a compliant W3C DID document.
- **Credential Issuance**: Dynamically signs AIS reputation credentials for portable trust.
- **Reverse Lookup**: Provides reverse resolution from `did:intg` strings to on-chain identity profiles.
- **Modularity**: Allows the protocol to scale horizontally, separating identity resolution from core telemetry ingestion.

---

## 🛡️ Identity Revocation & Slashing
If a Controller's legal status changes or if an agent is found to be engaging in malicious activity, the **Identity Oracle** can revoke the binding. 
- **Immediate Impact:** The agent's tier is reset to **0**, and its AIS is slashed to **300** (Default Minimum), effectively de-platforming the agent from the institutional economy.

---
© 2026 Xibalba Solutions. *Institutional accountability for a sovereign future.*

---
[← Back to README](../README.md)
