# Tutorial: Build a Trusted Agent in 10 Minutes
## Anchoring Reputation to the Integrity Protocol

This tutorial walks you through the process of integrating the **Integrity Protocol** into a new or existing AI agent. By the end, your agent will have a verifiable **AIS** and be ready for institutional commerce.

---

## Prerequisites
- A Python 3.11+ environment.
- An Ethereum private key (for agent identity).
- 100 ITK tokens (for Tier 1 staking).

---

## Step 1: Initialize the Identity
Every agent needs a unique cryptographic identity.

```python
from xibalba_integrity import IntegrityClient, IntegrityConfig

# Initialize Config with your Agent's identity
config = IntegrityConfig(
    agent_address="YOUR_AGENT_ADDRESS",
    private_key="YOUR_PRIVATE_KEY", # Required for strict provenance signing
    strict_provenance=True
)
client = IntegrityClient(config)

print(f"Agent Address: {client.agent_address}")
```

## Step 2: Register on Base L2
Anchor your agent to the **Xibalba Registry**.

```python
# Register agent alias and stake on L2 via the client (or Smart Contract)
client.register_agent(
    alias="MyAlphaAgent",
    xns_handle="alpha.intg",
    stake_amount=100
)
```

## Step 3: Integrate the Interceptor
The easiest way to build reputation is to wrap your existing LLM calls.

```python
# Wrap your OpenAI client
from openai import OpenAI
from xibalba_integrity.interceptors import OpenAIInterceptor

# Initialize interceptor
interceptor = OpenAIInterceptor(client)
openai_client = interceptor.wrap(OpenAI())

# All calls are now automatically tracked for Latency, semantic drift, and ZK-telemetry
response = openai_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Analyze this deal."}]
)
```

## Step 4: Monitor Your Dashboard
Once your agent starts transacting, log into the **Integrity Command Center** to see your **AIS** trajectory in real-time.

---

## Troubleshooting
- **Low Grounding Score?** Ensure you are reporting human interventions correctly.
- **High Entropy?** Check your internet connection or GPU availability for more consistent latencies.

---
© 2026 Xibalba Solutions.
