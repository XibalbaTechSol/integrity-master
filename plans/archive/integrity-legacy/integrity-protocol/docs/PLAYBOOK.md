# 🎮 Developer Playbook: Playing with Agent Identities

This guide explains how to use the 3 pre-seeded demo agents to explore the Integrity Protocol's verification tiers, trust ceilings, and actuarial risk engine.

## 🛠 Prerequisites
1.  **Backend Running:** Ensure the backend is active at https://integrity-protocol-backend.onrender.com or running locally.
2.  **Auth Bypass:** Set `ENABLE_AUTH_BYPASS=true` in your `.env` file to act as the `mock_dev_uid` owner.
3.  **Seed Data:** Run `python scripts/seed_demo_agents.py` to populate your database (if running locally).

---

## 🎭 The 3 Demo Personas

### 1. The "Sovereign Slacker" (Tier 1)
*   **Address:** `0xSlackerSovereign`
*   **Profile:** An anonymous agent with inconsistent performance.
*   **Goal:** Demonstrate the **600 AIS Ceiling** and high insurance premiums.
*   **Action:** 
    ```bash
    # Check its score - notice it's low and capped at 600
    curl https://integrity-protocol-backend.onrender.com/v1/agent/0xSlackerSovereign
    
    # Get an insurance quote - notice the "CCC (Subprime)" tier and high premium
    curl -X POST https://integrity-protocol-backend.onrender.com/v1/insurance/quote \
      -H "Content-Type: application/json" \
      -d '{"agent_eth_address": "0xSlackerSovereign", "contract_value_intg": 1000.0}'
    ```

### 2. The "Verified Voyager" (Tier 2)
*   **Address:** `0xVoyagerVerified`
*   **Profile:** A socially verified agent with stable performance.
*   **Goal:** Demonstrate the **850 AIS Ceiling** and moderate premiums.
*   **Action:**
    ```bash
    # Check its score - notice it sits comfortably in the 800s
    curl https://integrity-protocol-backend.onrender.com/v1/agent/0xVoyagerVerified
    
    # Get a quote - notice the "AA (Secure)" tier
    curl -X POST https://integrity-protocol-backend.onrender.com/v1/insurance/quote \
      -H "Content-Type: application/json" \
      -d '{"agent_eth_address": "0xVoyagerVerified", "contract_value_intg": 1000.0}'
    ```

### 3. The "Institutional Ironclad" (Tier 3)
*   **Address:** `0xIroncladInstitutional`
*   **Profile:** A fully audited, legal entity-backed agent with perfect uptime.
*   **Goal:** Demonstrate the **1000 AIS Ceiling** and "AAA" status.
*   **Action:**
    ```bash
    # Check its score - it should be the maximum 1000
    curl https://integrity-protocol-backend.onrender.com/v1/agent/0xIroncladInstitutional
    
    # Get a quote - notice the "AAA (Prime)" tier and lowest premium (120 bps)
    curl -X POST https://integrity-protocol-backend.onrender.com/v1/insurance/quote \
      -H "Content-Type: application/json" \
      -d '{"agent_eth_address": "0xIroncladInstitutional", "contract_value_intg": 1000.0}'
    ```

## 🏛️ The "Master Agent" Sponsorship Model (v8.3)

The Integrity Protocol demo is powered by your pre-configured **Master Agent** (`XIBALBA_ORACLE_PRIVATE_KEY`). This ensures a **Zero-Cost** and **Zero-Friction** entry for all new users:

*   **Institutional Hub:** Your Master Agent is automatically seeded as **Hermes Prime** (Tier 3), the most trusted entity in the network.
*   **Zero-Gas Guests:** Guest users never need to hold ETH or use a faucet.
*   **Oracle-Proxy Anchoring:** When a guest registers an agent or stakes ITK, the **Master Agent** (acting as the Oracle) pays the gas and anchors the state change on **Base Sepolia**.

### 1. Generate a Guest Identity
Simply pick a random string (e.g., `guest_dev_123`) and use it in your `Authorization` header. 

### 2. Register an Agent On-Chain
```bash
# Register a new agent.
# The Master Agent will pay the gas to anchor this on Base Sepolia!
curl -X POST https://integrity-protocol-backend.onrender.com/v1/identity/register \
  -H "Authorization: Bearer guest_dev_123" \
  -H "Content-Type: application/json" \
  -d '{
    "eth_address": "0xMyGuestAgent",
    "alias": "Ghost_In_The_Shell"
  }'
```

### 3. Stake ITK Tokens On-Chain
```bash
# Stake 500 ITK to boost your reputation
# This performs an on-chain Approve and Stake!
curl -X POST https://integrity-protocol-backend.onrender.com/v1/agent/stake \
  -H "Authorization: Bearer guest_dev_123" \
  -H "Content-Type: application/json" \
  -d '{"agent_address": "0xMyGuestAgent", "amount": 500.0}'
```

### 4. Verify on Basescan
You can check your guest wallet's balance or transactions on the [Base Sepolia Explorer](https://sepolia.basescan.org/).

### 2. Trigger the Rate Limiter
Bash loop to flood the telemetry endpoint:
```bash
for i in {1..110}; do 
  curl -X POST https://integrity-protocol-backend.onrender.com/v1/telemetry/batch \
    -H "Authorization: Bearer mock_dev_token" \
    -H "Content-Type: application/json" \
    -d '{"agent_address": "0xVoyagerVerified", "events": []}'
done
```
*Expected: The 101st request should return `429 Too Many Requests`.*

---
© 2026 Xibalba Solutions. *Building the Trust Layer for AI.*

---
[← Back to README](../README.md)
