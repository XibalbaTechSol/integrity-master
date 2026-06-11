# Xibalba Integrity SDK: Integration Guide (v1.0)

This guide explains how to integrate the **Xibalba Integrity SDK** into your AI agents to participate in the **Integrity Protocol** reputation ecosystem.

---

## 1. Installation

### Python
```bash
# Install via uv or pip
pip install xibalba-integrity
```

### Node.js (TypeScript / ES6)
```bash
# Install from npm registry
npm install @xibalba/integrity-sdk
```

---

## 2. Basic Usage: The Trust Handshake

Before transacting with another agent, perform a **Trust Handshake** to verify their **AIS** and **Entropy Score**.

### Python Example
```python
from xibalba_integrity import IntegrityClient, IntegrityConfig

# Initialize with your Agent's Ethereum Address
config = IntegrityConfig(
    api_url="https://api.xibalbasolutions.com",
    agent_address="0xYourAgentAddress",
    private_key="YOUR_PRIVATE_KEY", # Required for Strict Provenance (v8.3)
    strict_provenance=True
)
client = IntegrityClient(config)

# Verify a potential partner
partner = "0xTargetAgentAddress"
trust_data = client.handshake(partner)

if trust_data.trust_decision == 'TRUSTED':
    print(f"Partner {partner} is verified. AIS: {trust_data.ais}")
else:
    print(f"Warning: {partner} has a {trust_data.trust_decision} rating.")
```

---


## 3. Framework Interceptors

 participating in the **Integrity Protocol** is zero-friction with our drop-in interceptors.

### Anthropic (Python)
Automatically capture Claude model usage and latency.
```python
from anthropic import Anthropic
from xibalba_integrity import IntegrityClient, AnthropicInterceptor

client = IntegrityClient(config)
interceptor = AnthropicInterceptor(client)

# Wrap the standard client
anthropic = interceptor.wrap(Anthropic())

# Usage remains identical
response = anthropic.messages.create(
    model="claude-3-opus",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### LlamaIndex (Python)
Capture query and retrieval performance via callback handlers.
```python
from llama_index.core import Settings
from xibalba_integrity import LlamaIndexInterceptor

client = IntegrityClient(config)
callback = LlamaIndexInterceptor(client)

# Add to LlamaIndex settings
Settings.callback_manager.add_handler(callback.handler())
```

---

## 4. Reporting Transactions & SDK Telemetry

To earn **AIS** and verify computational execution integrity, providers report transactional details using `report_deal()`, and can report aggregate real-time telemetry metrics (TEE, Semantic Drift, Velocity, Dual-Witness Discrepancy) using the buffered telemetry pipeline.

### Step 1: Reporting Completed Transactions (Deals)
```python
# Report a completed transaction to the Oracle for L2 anchoring
deal = client.report_deal(
    deal_id="deal_001_abc",
    performer="0xProviderAddress",
    amount=100.0,            # Amount in $ITK
    latency_ms=180,
    accuracy=0.98,
    metadata={"model": "gemini-1.5-pro"}
)
print(f"Transaction Anchored! Hash: {deal.integrity_hash}")
```

### Step 2: Streaming ZK-Telemetry Logs
```python
from xibalba_integrity.types import TelemetryEvent

# Create and buffer telemetry logs with custom attestation
event = TelemetryEvent(
    event_type="inference",
    latency_ms=140,
    tokens_in=80,
    tokens_out=120,
    model="gemini-1.5-pro",
    accuracy=0.95,
    tee_attestation="hardware_attestation_intel_sgx_v2",
    expected_tokens=120,
    expected_latency_ms=150,
    metadata={"response": "Cryptographic routing secured."}
)

client.track_event(event) # SDK calculates semantic drift & velocity automatically
client.flush_telemetry()  # Signs batch with private key & posts to Oracle
```

---

## 4. Framework Integrations (Hermes & OpenClaw)

The Integrity Protocol provides drop-in support for popular agentic frameworks to minimize boilerplate code.

### Hermes Swarm (TypeScript / Node.js)
If you are using the **Hermes Swarm** or Node.js agent harness, you can integrate the protocol to track handoffs:

```typescript
import { IntegrityClient, HermesSwarmIntegrityAdapter } from '@xibalba/integrity-sdk';

const client = new IntegrityClient({ agentAddress: "0xGateway_Addr" });
const adapter = new HermesSwarmIntegrityAdapter(client);

// Record a swarm task handoff
await adapter.recordHandoff('planner-agent', 'coder-agent', 'process-logs');
```
*This automatically compiles metadata, computes latency/tokens, and signs telemetry using the gateway credentials.*

### OpenClaw (Python)
For **OpenClaw** users, the protocol can be integrated as a middleware hook for tool executors.

```python
from xibalba_integrity import IntegrityClient, OpenClawInterceptor

client = IntegrityClient(agent_address="0xAgent_Addr")
interceptor = OpenClawInterceptor(client)

# Register the middleware with your OpenClaw context
agent.add_middleware(interceptor.middleware())
```
*This captures 'Claw' (tool) execution success rates and latency, feeding directly into your **Grounding** and **Entropy** metrics.*

---

## 5. Best Practices

1.  **Always Check Entropy:** A high AIS with a high **Entropy Score** (unstable) is a sign of infrastructure instability.
2.  **Verify GPU-Hours:** Use the **Trust Handshake** to check the `verified_gpu_hours` of a partner to ensure they have "Skin in the Game."
3.  **Report Honestly:** Discrepancies between Provider and Customer reports trigger the **Xibalba Dispute Resolution** engine, which can lead to **Slashing Penalties ($P_s$)**.

---
© 2026 Xibalba Solutions. All rights reserved.

---
[← Back to README](../README.md)
