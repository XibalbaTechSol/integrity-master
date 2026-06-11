# 🛡️ Xibalba Inference Provider Guide (v1.0)

This guide shows how inference providers (vLLM, FastAPI, Flask) can integrate the **Integrity Protocol** to certify their compute and provide verifiable performance proofs to their customers.

---

## 1. Why Integrate?

| Benefit | Impact |
|---------|--------|
| **Trust Seal** | Customers get an `X-Xibalba-Seal` header in every response, proving the model was run consistently. |
| **Gated Consumers** | Insurance companies and enterprise platforms can mandate running on "Xibalba-Certified" providers. |
| **Proof of Compute** | Prove the exact GPU hours and hardware stability used for each inference call. |

---

## 2. Fast Integration (FastAPI / vLLM)

The Xibalba Python SDK includes a drop-in middleware for any **FastAPI**, **Starlette**, or **vLLM** (Python-based) API.

### Installation

```bash
pip install xibalba-integrity[all]
```

### Implementation

Add the `XibalbaProviderMiddleware` to your FastAPI app:

```python
from fastapi import FastAPI
from xibalba_integrity import XibalbaProviderMiddleware, IntegrityClient, IntegrityConfig

app = FastAPI()

# Configure the Xibalba Client for your Provider Node
client = IntegrityClient(IntegrityConfig(
    agent_address="0xYourProviderNodeAddress",
    api_key="xib_prov_live_...",
    api_url="https://api.xibalbasolutions.com"
))

# Add the Xibalba Trust Middleware
# This will automatically:
# 1. Capture internal response latency (server-side).
# 2. Inject X-Xibalba-Seal and X-Xibalba-Deal-ID headers.
# 3. Report internal metrics to the Xibalba Registry.
app.add_middleware(
    XibalbaProviderMiddleware, 
    integrity_client=client,
    provider_alias="Titan_Compute_Node_01"
)

@app.post("/v1/chat/completions")
async def inference(prompt: str):
    # Your normal model serving logic
    # Xibalba will intercept the response and sign it.
    return {"response": "..."}
```

---

## 3. Headers & Verification

When a client receives a response from a Xibalba-Certified provider, they see:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Xibalba-Seal: 0x37faef...74b (SHA-256 integrity signature)
X-Xibalba-Deal-ID: xib_deal_abc123 (Unique transaction reference)
```

The consumer's SDK uses these headers to periodically verify the **Integrity Hash** against the Xibalba blockchain, ensuring the provider hasn't tampered with the metrics.

---

## 4. Reporting "GPU-Hour Sacrifice"

The protocol rewards providers for providing high-fidelity, high-power compute. To boost your provider-side **Sacrifice Metric**:

1. Use the SDK to report your cumulative GPU-hours verified by hardware attestation (e.g., NVIDIA H100 attestation).
2. The Xibalba scoring engine converts this "sunk cost" into a trust-boost for your node.

---
© 2026 Xibalba Solutions.

---
[← Back to README](../README.md)
