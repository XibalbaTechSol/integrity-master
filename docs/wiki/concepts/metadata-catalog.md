---
title: Integrity Protocol Metadata Catalog
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [metrics, compliance, cryptography]
confidence: high
sources: [raw/legacy-protocol/metadata-catalog.md, raw/new/integrity_protocol_sdk_spec.md]
---

# Integrity Protocol Metadata Catalog

This catalog defines the standardized metadata schemas and telemetry fields used by the **Integrity Protocol** to calculate and verify agent reputation. Partners integrating with the protocol must adhere strictly to these schemas to maintain interoperability.

---

## 1. Core Ingestion Payload (JSON Schema)

Every telemetry packet reported by the SDK's `report_metrics()` method is structured as a standardized JSON payload. This ensures the off-chain [Rust Oracle](../entities/rust-oracle.md) can parse and score the metrics deterministically.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "IntegrityTelemetryPayload",
  "type": "object",
  "properties": {
    "agent_address": {
      "type": "string",
      "pattern": "^0x[a-fA-F0-9]{40}$",
      "description": "On-chain wallet address of the reporting agent."
    },
    "performer_address": {
      "type": "string",
      "pattern": "^0x[a-fA-F0-9]{40}$",
      "description": "Target resource or third-party node address (e.g. 0xOpenAI_Global)."
    },
    "deal_id": {
      "type": "string",
      "description": "Unique identifier of the transaction or LLM handshake."
    },
    "contract_value_itk": {
      "type": "number",
      "minimum": 0,
      "description": "The economic value or token weight of the execution."
    },
    "latency_ms": {
      "type": "integer",
      "minimum": 0,
      "description": "Total round-trip execution latency in milliseconds."
    },
    "accuracy_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Cognitive accuracy or compliance rating (0.0 to 1.0)."
    },
    "timestamp": {
      "type": "integer",
      "description": "Unix timestamp (in seconds) of the execution."
    },
    "signature": {
      "type": "string",
      "pattern": "^0x[a-fA-F0-9]{130}$",
      "description": "EIP-191 cryptographic signature of the serialized payload."
    },
    "metadata": {
      "type": "object",
      "properties": {
        "model": { "type": "string" },
        "total_tokens": { "type": "integer" },
        "provider": { "type": "string" }
      },
      "required": ["model", "provider"]
    }
  },
  "required": [
    "agent_address",
    "performer_address",
    "deal_id",
    "contract_value_itk",
    "latency_ms",
    "accuracy_score",
    "timestamp",
    "signature",
    "metadata"
  ]
}
```

---

## 2. Telemetry Field Definitions

*   `agent_address` (address): The unique wallet identifier of the agent. This address must be registered in [Integrity Registry](../entities/integrity-registry.md) and bound to a hardware [did](did.md).
*   `latency_ms` (integer): Measures performance responsiveness. The Oracle compares this value to historical baselines to compute Latency Variance (contributing to Entropy).
*   `accuracy_score` (float): Derived from self-reported heuristics or local ZK-circuits. Used by the [Tri Metric Protocol](tri-metric-protocol.md) to evaluate cognitive stability.
*   `contract_value_itk` (float): Translates the task complexity into utility weight. It dictates how much `$ITK` is staked in [Itk Token](../entities/itk-token.md) pools during execution.
*   `signature` (hex): Formed by sorting the JSON keys, serializing to a canonical string, and signing with the agent's private key. The Oracle rejects any payload where the signature does not resolve to the registered DID public key.

---

## 3. Grounding & Oversight Schema

This schema is used to report human-in-the-loop (HITL) interventions. It serves as a direct input to calculate the agent's Grounding (G) metric:

```json
{
  "event_type": "GROUNDING_ACTION",
  "agent_id": "0xAlphaSentinel",
  "oversight_level": 0.85,
  "verification_method": "CROSS_CHECK_V3",
  "metadata": {
    "intervention_required": false,
    "confidence_threshold": 0.92,
    "hitl_override": true
  }
}
```

---

## 4. Cryptographic Reputation Badges

Agents meeting specific Agent Integrity Score ([ais](ais.md)) thresholds on Base L2 are granted dynamic, SVG-rendered **Reputation Badges**:

*   **Sovereign Badge:** `AIS > 300` | Tier 1 [Identity Ceiling](identity-ceiling.md) (unlinked DIDs).
*   **Verified Badge:** `AIS > 700` | Tier 2 domain-linked identity.
*   **Institutional Badge:** `AIS > 900` | Tier 3 fully KYC'd corporate identity.

---

## 5. Related Systems
-   **tri-metric-protocol:** Telemetry data is parsed on-the-fly to compute rolling scores under the [Tri Metric Protocol](tri-metric-protocol.md).
-   **state-anchor:** Consolidated hashes of these schemas are posted periodically to [State Anchor](../entities/state-anchor.md) for on-chain finality.
