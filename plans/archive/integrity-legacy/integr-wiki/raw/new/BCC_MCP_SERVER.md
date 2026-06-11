# Xibalba Behavioral Commitment Chain (BCC) MCP Server
## Developer & Agent Integration Guide

---

## 1. Overview
The **Behavioral Commitment Chain (BCC) MCP Server** provides a high-throughput, zero-friction integration vector for AI agents and developers. Built on the **Model Context Protocol (MCP)** standard, it allows stochastic AI agents to cryptographically "commit" to their intended actions before executing them. 

By wrapping complex cryptographic hashing, signing, and **Open Policy Agent (OPA)** compliance evaluations in native tool-calling interfaces, it removes all cognitive and engineering friction:
*   **For Agents:** Enforces compliance natively via standard tool calls (`commit_action_intent`). No private key management or gas management required.
*   **For Developers:** Eliminates the need to write custom integration pipelines or manage complex smart contract states. Simply plug the server into your agent host.

---

## 2. Configuration & Host Integration

The BCC MCP Server communicates over standard input/output (`stdio`) using JSON-RPC 2.0. This allows standard agent environments to launch and consume its capabilities immediately.

### 2.1. Cursor Integration
To enable the BCC tools inside Cursor, open **Settings** -> **Models** -> **MCP**, click **+ Add New MCP Server**, and configure:
*   **Name:** `xibalba-bcc`
*   **Type:** `command`
*   **Command:** `python3 /home/xibalba/Projects/integrity-protocol/backend/sdk/python/bcc_mcp_server.py`

### 2.2. Claude Desktop Integration
Add the following block to your `claude_desktop_config.json` (typically located under `~/.config/Claude/claude_desktop_config.json` or `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "xibalba-bcc": {
      "command": "python3",
      "args": [
        "/home/xibalba/Projects/integrity-protocol/backend/sdk/python/bcc_mcp_server.py"
      ],
      "env": {
        "INTEGRITY_BACKEND_URL": "http://localhost:8001",
        "INTEGRITY_AGENT_ID": "agent_xibalba_custom"
      }
    }
  }
}
```

### 2.3. Environment Variables Supported
*   `INTEGRITY_BACKEND_URL`: URL of the off-chain Axum Oracle (defaults to `http://localhost:8001`).
*   `INTEGRITY_AGENT_ID`: Unique node identifier for the local agent (defaults to `agent_xibalba_default`).
*   `INTEGRITY_PRIVATE_KEY`: Private hexadecimal key for generating on-chain verified signatures (if omitted, falls back to a deterministic local signature).

---

## 3. Tool Reference Manual

The server exposes two high-level tools to the agent context:

### 3.1. `commit_action_intent`
This tool generates a cryptographically signed commitment of the agent's intended action state. It must be called *prior* to executing any sensitive operation (such as database writes, external api calls, or financial trades).

#### Input Parameters (JSON Schema)
*   `action_type` (string, **Required**): The category of the action. Supported types include:
    *   `hipaa_db_write`: Intercepts and validates protected health information writes.
    *   `trade_execution`: Intercepts and validates automated trading orders.
    *   `system_call`: Internal systems modification.
*   `intended_state` (object, **Required**): Standardized JSON block representing the proposed parameters of the action (e.g., specific row values, trade sizing, target address).
*   `opa_policy_id` (string, **Required**): The specific policy identifier to evaluate the action against (e.g., `hipaa-privacy-v2`, `trade-limits-v1`).
*   `agent_id` (string, Optional): Custom ID overriding the default host node ID.
*   `metadata` (object, Optional): Supplemental context (such as `"hitl_override": true` or execution hardware telemetry).

#### Execution Workflow
1.  **Canonicalization:** The `intended_state` is sorted by key and serialized into canonical JSON.
2.  **State Hashing:** Generates a `intended_state_hash` using SHA-256 to represent the exact mathematical state of the intent.
3.  **Policy Evaluation (OPA):** Evaluates the payload against the corresponding local rules:
    *   *Rule A (HIPAA):* Rejects `hipaa_db_write` containing a patient diagnosis *unless* `metadata.hitl_override` is set to `true`.
    *   *Rule B (Trade Limits):* Rejects `trade_execution` if `intended_state.volume` exceeds `100.0` units.
4.  **Provenance Signature:** Signs the package using the configured `INTEGRITY_PRIVATE_KEY` or falls back to an immutable deterministic local signature.

#### Sample Response (Approved State)
```json
{
  "status": "COMMITTED",
  "commitment": {
    "id": "7cd748af-2327-451e-9e45-018a8c17f40b",
    "timestamp": 1780268206,
    "agent_id": "agent_xibalba_default",
    "action_type": "trade_execution",
    "intended_state_hash": "5c831f1d70d1bda3504b19c692f912698b9c1972c5c9357a226e80bfe8b12bbc",
    "opa_policy_id": "trade-limits-v1",
    "opa_evaluation_result": {
      "decision": "ALLOW",
      "policy_id": "trade-limits-v1",
      "eval_timestamp": 1780268206,
      "denial_reason": ""
    },
    "provenance_signature": "sig_mock_31ec56789178667f",
    "metadata": {}
  },
  "message": "Commitment generated and securely anchored."
}
```

#### Sample Response (Denied State)
```json
{
  "status": "REJECTED_BY_POLICY",
  "opa_evaluation": {
    "decision": "DENY",
    "policy_id": "trade-limits-v1",
    "eval_timestamp": 1780268206,
    "denial_reason": "Policy violation: Volumetric trade ceiling of 100.0 exceeded. Action rejected."
  },
  "message": "Action blocked: Policy violation: Volumetric trade ceiling of 100.0 exceeded. Action rejected."
}
```

---

### 3.2. `get_agent_reputation`
Fetches active trust parameters for a specified agent. It is used in Agent-to-Agent (A2A) handshakes to evaluate the reliability of a counterparty before exchanging data or executing multi-agent execution blocks.

#### Input Parameters (JSON Schema)
*   `agent_id` (string, **Required**): The target ID or hexadecimal address of the agent to query.

#### Returned Parameters
*   `agent_id`: Target identity queried.
*   `agent_integrity_score`: The composite AIS score (ranging from 0 to 1000).
*   `metrics`: Detailed Tri-Metric components:
    *   `entropy`: System variance score. Predictable agent = High score.
    *   `grounding`: Compliance rating (HITL vs autonomous path density).
    *   `sacrifice`: Total compute resources dedicated / $ITK tokens bonded.
*   `reputation_tier`: Alphabetical credit-style rating (`AAA`, `AA`, `A`, etc.).
*   `verification_status`: Cryptographic status flag (`VERIFIED_HARDWARE_TETHERED (or API_KEY_CAPPED_300)` or `UNVERIFIED`).

#### Sample Response
```json
{
  "agent_id": "agent_xibalba_quant",
  "agent_integrity_score": 885,
  "metrics": {
    "entropy": 916,
    "grounding": 950,
    "sacrifice": 780
  },
  "reputation_tier": "AAA",
  "verification_status": "VERIFIED_HARDWARE_TETHERED (or API_KEY_CAPPED_300)"
}
```

---

## 4. Under-the-Hood Math: Tri-Metric Calculations

1.  **Entropy ($E$):**
    Measures the predictability and stability of the telemetry logs. High volatility in response sizes or execution logs decays the score exponentially:
    $$E = e^{-1.5 \times \text{variance}} \times 1000$$
    Where $\text{variance}$ represents the rolling variance of transaction metadata.

2.  **Grounding ($G$):**
    The density of actions mapped to static policy constraints. Manual overrides or verified human-in-the-loop signatures lock this score at 950+. Fully ungrounded stochastic exploration decays the score.

3.  **Sacrifice ($S$):**
    Quantifies the economic sacrifice or computational commitment (staking or proof-of-work) executed by the host:
    $$S = \min\left(1.0, \frac{\text{GPU\_Hours}}{\text{Threshold}}\right) \times 1000$$

4.  **Agent Integrity Score (AIS):**
    Calculated as a weighted composite of the Tri-Metric vector:
    $$\text{AIS} = (E \times 0.4) + (G \times 0.3) + (S \times 0.3)$$


**Note on Authentication/Limits:** For testing and rapid onboarding, agents can use Developer API Keys generated via the dashboard. These bypass strict hardware DID validation but cap their Trust Level (AIS) at a maximum of 300 to ensure safety while preserving the intent gating middleware.
