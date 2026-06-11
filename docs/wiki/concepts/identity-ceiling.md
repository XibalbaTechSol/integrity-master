---
title: Identity Ceiling & Verification Tiers
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [identity, compliance]
confidence: high
sources: [raw/legacy-protocol/identity-architecture.md, raw/legacy/WHITEPAPER.md]
---

# Identity Ceiling & Verification Tiers

The **Identity Ceiling** (commercially packaged as the **Hierarchy of Accountability** or **Verification Ladder**) is a trust validation framework that maps an agent's on-chain identity to different levels of real-world entity verification. 

It establishes a hard cap on an agent's maximum eligible [ais](ais.md) and transaction permissions based on the degree of identity disclosure, balancing privacy with systemic risk.

## 1. The Verification Ladder

To accommodate both anonymous independent agents and fully compliant institutional agents, the Integrity Project enforces a strict three-tier ceiling:

### Tier 1: Sovereign (Score Cap: 600)
*   **Verification Level:** Low. The agent is cryptographically unique but unlinked to any real-world domain or individual (it only registers a hardware-tethered [did](did.md)).
*   **Identity Ceiling:** Hard-capped at a **"CCC" Risk Rating** (maximum eligible [ais](ais.md) of 600).
*   **Permissions:** Restricted to low-volume transactions and general public data queries.

### Tier 2: Linked (Score Cap: 850)
*   **Verification Level:** Medium. The agent's DID is cryptographically bound to a verified digital web domain (e.g. `agent.hospital.org`) using DNS `TXT` records, `well-known` configuration files, or social identity attestation (X/GitHub).
*   **Identity Ceiling:** Hard-capped at a **"AA" Risk Rating** (maximum eligible [ais](ais.md) of 850).
*   **Permissions:** Approved for standard B2B API integrations and intermediate transaction levels.

### Tier 3: Institutional (Score Cap: 1000)
*   **Verification Level:** High. Requires a **Platinum Audit** by Xibalba Solutions or an authorized Identity Oracle. The agent operator or parent corporation undergoes full KYC/KYB checks, registers business ID verification (DUNS), and legal jurisdiction attestation.
*   **Identity Ceiling:** Eligible for the maximum **"AAA" Risk Rating** (eligible for an [ais](ais.md) of 1000).
*   **Permissions:** Full access to high-value priority pools, zero-slippage settlement corridors, and sensitive data integrations (such as direct patient health records under [Xibalba Shield](../entities/xibalba-shield.md)).

---

## 2. Mathematical Implementation: The Ceiling Formula

An agent's final reputation score is the minimum of its calculated performance metrics and the ceiling assigned to its current verification tier:

$$AIS_{final} = \min(S_{calculated}, Tier_{ceiling})$$

### Example Scenario:
An agent in **Tier 1 (Sovereign)** has perfect performance metrics, resulting in a calculated score of **945**. 
However, because it lacks verified accountability, its on-chain AIS is capped:
- $S_{calculated} = 945$
- $Tier_{ceiling} = 600$
- **$AIS_{final} = 600$**

To unlock its true reputation of 945, the operator must upgrade the agent to **Tier 3**.

---

## 3. Cryptographic Binding (EIP-712 Schema)

To establish a secure, tamper-proof link between an agent's operational wallet and its Controller, the protocol uses **EIP-712 Signed Typed Data**:

```json
{
  "types": {
    "EIP712Domain": [
      { "name": "name", "type": "string" },
      { "name": "version", "type": "string" },
      { "name": "chainId", "type": "uint256" },
      { "name": "verifyingContract", "type": "address" }
    ],
    "EntityBinding": [
      { "name": "agent_address", "type": "address" },
      { "name": "controller_name", "type": "string" },
      { "name": "verification_tier", "type": "uint8" },
      { "name": "expires", "type": "uint256" }
    ]
  },
  "primaryType": "EntityBinding",
  "domain": { 
    "name": "Xibalba Integrity Protocol", 
    "version": "8.3",
    "chainId": 84532,
    "verifyingContract": "0x0bd07324980856841e83FF95460CcD46EB9B590a"
  },
  "message": {
    "agent_address": "0xAgent_Wallet_Address_Hex...",
    "controller_name": "Xibalba Solutions LLC",
    "verification_tier": 3,
    "expires": 1777086222
  }
}
```

This ensures absolute non-repudiation: if an agent executes an action, the Controller's signature guarantees that they are legally and financially liable for any resulting breaches or **Slashing Weights** penalties.

---

## 4. Related Terms
-   **DID:** Every tier builds upon the baseline hardware-tethered identity established by [did](did.md).
-   **ITK-Token:** Staking requirements for [Itk Token](../entities/itk-token.md) scale dynamically depending on the active verification tier and the proposed transaction volume.
