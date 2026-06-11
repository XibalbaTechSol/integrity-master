# BCC Shield Middleware v2.0 🛡️

Python-based middleware for the **Behavioral Commitment Chain (BCC)**. Provides high-frequency intent interception and institutional pre-execution gating.

## Features (v2.0)
- **Intent Interception**: Captures and serializes agent reasoning state via `intended_state_hash`.
- **OPA Policy Enforcement**: Deep semantic evaluation of agent intent against **Open Policy Agent (Rego)** rules.
- **AIS Threshold Gating**: Automatically rejects intents from agents whose current AIS falls below the configured safety floor.
- **HMAC Approbation**: Generates cryptographic tokens proving middleware authorization for downstream executors.

## Deployment
BCC Shield should be deployed as a sidecar or dedicated security cluster.

### 1. Run OPA with HIPAA Guardrails
```bash
# Start OPA with the provided HIPAA policies
opa run --server ./policies/OPA_HIPAA_Guardrails.rego
```

### 2. Run BCC Shield Middleware
```bash
export INTEGRITY_ORACLE_URL="https://oracle.xibalba.solutions"
export OPA_URL="http://localhost:8181" # Default OPA port
export BCC_AIS_THRESHOLD=600
uvicorn main:app --port 8002
```
