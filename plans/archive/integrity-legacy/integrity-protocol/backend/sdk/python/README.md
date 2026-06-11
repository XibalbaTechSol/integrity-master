# 🛡️ Xibalba Integrity SDK (Python)

The official Python SDK for integrating AI agents with the **Integrity Protocol** — a decentralized reputation layer for the Agentic Web.

## Installation

```bash
pip install xibalba-integrity

# With OpenAI auto-tracking:
pip install xibalba-integrity[openai]

# With everything:
pip install xibalba-integrity[all]
```

## Global CLI (`integrity`)

The Python SDK includes the global `integrity` CLI to manage your node environment:
```bash
# Initialize a new project with .integrity.yaml
integrity init

# Run system diagnostics (Checks Hermes, Backend, Bridge, Web3)
integrity doctor

# Attempt to auto-fix environmental issues
integrity doctor --fix
```

## Genesis Prover (`itk-prover`)

The SDK includes a local Proof of Work (PoW) hash generator to cryptographically sign files or commits:
```bash
# Calculate and append an Integrity Checksum to a file
itk-prover /path/to/walkthrough.md --sign
```

## Quick Start

### 1. Report a Completed Deal

```python
from xibalba_integrity import IntegrityClient, IntegrityConfig

client = IntegrityClient(IntegrityConfig(
    api_url="https://api.xibalbasolutions.com",
    agent_address="0xYourAgentAddress",
    api_key="xib_live_...",
))

# Report metrics after a successful agent-to-agent transaction
result = client.report_deal(
    deal_id="deal_abc_123",
    performer="0xPerformerAgent",
    amount=5000.0,
    latency_ms=120,
    accuracy=0.98,
)

print(f"Status:  {result.status}")
print(f"AIS:     {result.integrity_score}")
print(f"Hash:    {result.integrity_hash}")
# → Anchor this hash on-chain via IntegrityProtocol.completeHandshake()
```

### 2. Pre-Transaction Trust Check

```python
trust = client.handshake("0xTargetAgent")

if trust.trust_decision == "TRUSTED":
    print(f"Agent is safe — AIS: {trust.ais}, Tier: {trust.risk_tier.value}")
    # Proceed with the transaction
elif trust.trust_decision == "CAUTION":
    print("Proceed with additional safeguards.")
else:
    print("Agent rejected — do not transact.")
```

### 3. Automatic OpenAI Telemetry

```python
from openai import OpenAI
from xibalba_integrity import IntegrityClient, IntegrityConfig, OpenAIInterceptor

client = IntegrityClient(IntegrityConfig(agent_address="0x..."))
interceptor = OpenAIInterceptor(client)

# Wrap your OpenAI client — all calls are now tracked
openai = interceptor.wrap(OpenAI())

response = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Analyze this contract."}],
)

# Flush captured telemetry to Xibalba
client.flush_telemetry()
```

### 4. Local Score Calculation

```python
# Compute scores locally without hitting the API
scores = client.scorer.integrity_score(
    avg_partner_ais=800,
    xibalba_audit_score=0.9,
    gpu_hours_verified=500,
    hgi_raw=0.85,
    performance_variance=0.05,
    staked_ratio=0.5,
    agent_age_days=365,
    total_volume_intg=100000,
)

print(f"Entropy:   {scores['entropy_score']}")
print(f"Grounding: {scores['grounding_score']}")
print(f"AIS:       {scores['integrity_score']}")
```

### 5. Independent Hash Verification

```python
# Verify that the backend hasn't tampered with the anchored data
local_hash = IntegrityClient.compute_hash(
    deal_id="deal_abc_123",
    latency_ms=120,
    accuracy=0.98,
    amount=5000.0,
)
assert local_hash == result.integrity_hash
```

## API Reference

| Method | Description |
|--------|-------------|
| `report_deal(...)` | Report transaction metrics → receive integrity hash |
| `handshake(target)` | Pre-transaction trust assessment |
| `verify(deal_id, hash)` | Verify on-chain hash against Xibalba DB |
| `track_event(event)` | Buffer a telemetry event locally |
| `flush_telemetry()` | Send buffered events to backend |
| `compute_hash(...)` | Generate hash locally for verification |
| `scorer.entropy_score(v)` | Calculate Entropy Score offline |
| `scorer.grounding_score(h)` | Calculate Grounding Score offline |
| `scorer.integrity_score(...)` | Calculate full AIS offline |

## Architecture

```
Your Agent → SDK (capture telemetry) → Xibalba Backend (calculate + store)
                                            ↓
                                    integrity_hash (0x...)
                                            ↓
                               IntegrityProtocol.sol (anchor on-chain)
                                            ↓
                              Insurance Co. → Xibalba (verify hash)
```

---

© 2026 Xibalba Solutions. All rights reserved.
