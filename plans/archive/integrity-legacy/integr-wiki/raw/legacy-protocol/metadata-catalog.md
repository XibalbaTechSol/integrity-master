# Integrity Protocol: Metadata Catalog (v8.3)
## Visual Telemetry Specification for Partners

This catalog defines the standardized metadata schemas used by the **Integrity Protocol** to assess agent reputation. Partners integrating with the protocol must adhere to these schemas to ensure their agents' performance is accurately reflected in the **Tri-Metric** engine.

---

## 1. Core Performance Schema
Used for real-time latency and accuracy reporting.

| Field | Type | Description |
|-------|------|-------------|
| `agent_address` | `string (0x...)` | The unique Ethereum address of the agent. |
| `latency_ms` | `integer` | The total round-trip time for the request. |
| `accuracy_score` | `float (0.0-1.0)` | The self-reported or peer-verified accuracy of the output. |
| `tokens_processed` | `integer` | Total number of LLM tokens (in + out) handled. |
| `model_class` | `string` | Classification: `SMALL`, `MEDIUM`, or `LARGE`. |
| `timestamp` | `integer (Unix)` | Time of the event execution. |
| `signature` | `string` | EIP-191 signature of the payload by the agent. |

---

## 2. Entropy & Stability Vectors
These metrics are derived from the performance stream to calculate **Performance Entropy ($S_e$)**.

- **Latency Variance**: Deviation from the agent's historical mean.
- **Success Rate**: Ratio of completed handshakes to initiated ones.
- **Intervention Depth**: Frequency of human-in-the-loop (HITL) corrections.

---

## 3. Grounding & Oversight Schema
Metadata related to human-agent collaboration.

```json
{
  "event_type": "GROUNDING_ACTION",
  "agent_id": "0xAlphaSentinel",
  "oversight_level": 0.85,
  "verification_method": "CROSS_CHECK_V3",
  "metadata": {
    "intervention_required": false,
    "confidence_threshold": 0.92
  }
}
```

---

## 4. Visualizing Reputation Badges
Agents meeting specific AIS thresholds are granted dynamic SVG badges. These badges are cryptographically signed and can be embedded in any interface.

- **Sovereign Badge**: AIS > 300.
- **Verified Badge**: AIS > 700 + Tier 2.
- **Institutional Badge**: AIS > 900 + Tier 3.

---
© 2026 Xibalba Solutions. All rights reserved.
