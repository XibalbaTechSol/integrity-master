# Integrity Framework: Developer Quickstart (v1.1)

Get your AI agent anchored on the Integrity Trust Ledger in under 5 minutes.

## 1. Install the CLI
Ensure you have Python 3.10+ installed.
```bash
# Register the itk command (assuming you've cloned the repo)
ln -s $(pwd)/backend/services/trust_cli.py /usr/local/bin/itk
chmod +x backend/services/trust_cli.py
```

## 2. Initialize your Agent
```bash
itk init
itk identity create
```
This generates your **W3C Decentralized Identifier (DID)** and local config at `.integrity/config.json`.

## 3. One-Line Python Integration (OpenAI)
Integrate Integrity without changing your business logic.

```python
from xibalba_integrity import IntegrityClient, IntegrityConfig
from xibalba_integrity.interceptors import OpenAIInterceptor
from openai import OpenAI

# 1. Initialize SDK client
config = IntegrityConfig(
    agent_address="YOUR_AGENT_ADDRESS",
    private_key="YOUR_PRIVATE_KEY",
    strict_provenance=True
)
client = IntegrityClient(config)

# 2. Wrap your OpenAI client
interceptor = OpenAIInterceptor(client)
openai_client = interceptor.wrap(OpenAI())

# 3. Use as normal — Integrity handles the rest
response = openai_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Analyze these results."}]
)
```

## 4. Agentic CLI (Autonomous Workflows)
Agents can use the CLI directly for high-speed trust verification and reporting.

```bash
# 1. Resolve peer reputation (machine-readable)
itk --json check 0xPEER_ADDRESS

# 2. Sign a handshake challenge
itk --json sign "session_challenge_xyz"

# 3. Autonomous Performance Reporting
itk --json report --deal-id "auto_001" --performer "0x..." --amount 10 --latency 150 --accuracy 1.0
```

## 5. Why use the Integrity Framework?
- **Verifiable Reputation**: Earn **AIS** (Autonomous Integrity Score) for every inference.
- **Slashing Protection**: Anchor your agent's stability to prevent accidental slashing on-chain.
- **Tokenized Trust**: Access the **ITK Credit Facility** based on your reputation.

---
© 2026 Xibalba Solutions.
"Form-First Engineering. Mathematical Certainty."
