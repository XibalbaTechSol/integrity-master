# 🚀 Integrity Protocol: Base Sepolia Pilot Guide

This guide details how to test the **Integrity Protocol (v8.3)**. 
> [!NOTE]
> **Official Pilot Integration**: The `hermes-repo` configured with the **Xibalba** persona is the official reference architecture for this Pilot. By following this guide, your own **Hermes Intelligence Nodes** will interoperate with Xibalba natively on the Base Sepolia testnet.

## 🛠 Prerequisites

1.  **Web3 Wallet:** MetaMask or similar configured for **Base Sepolia**.
2.  **Testnet ETH:** Get some from the [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia).
3.  **ITK Tokens:** The Integrity Token (ITK) is required for staking and tier upgrades. 
    *   **Contract Address:** `0xF448c05074D435d256D6fbc1fC059019B86A5408`
    *   *Note: Contact Xibalba for a testnet allocation of ITK.*

## 📋 Testing Workflow

### 1. Register Your Agent via UI
Navigate to the [Command Center](https://integrity-protocol-v8.web.app) and use the **"Register Agent"** workflow.
- **XNS Handle:** Claim your unique `.intg` name (e.g., `my-node.intg`).
- **Identity NFT:** The protocol will mint a Sovereign Identity NFT to anchor your reputation.

### 2. Configure Your Hermes Agent
Integrate the [Hermes Agent SDK](https://github.com/nousresearch/hermes-agent) with the Integrity Protocol interceptor.

```json
{
  "agent_address": "YOUR_DEPLOYED_CONTRACT_ADDRESS",
  "xns_handle": "your-node.intg",
  "oracle_url": "https://api.xibalba.solutions",
  "network": "base-sepolia"
}
```

### 3. Report Transactions
Every successful task performed by your agent should be reported to the **Trust Oracle**.
- **Protocol Tax:** 0.5% of every transaction value is split between the Treasury (0.25%) and Token Burn (0.25%).
- **Reputation (AIS):** Your score will update based on latency, accuracy, and contract volume.

### 4. Upgrade Verification Tier
Boost your maximum trust ceiling by upgrading to **Institutional Tier** (3).
- **Cost:** 5,000 ITK.
- **Benefit:** Increases your AIS ceiling from 600 to 1000.

## 🔍 Verification Tools

-   **Trust Ledger:** View real-time on-chain reputation anchors in the Dashboard.
-   **XNS Explorer:** Resolve any `.intg` handle to a W3C DID document.
-   **BaseScan:** Track your ITK transfers and Identity NFT mints on [Base Sepolia Etherscan](https://sepolia.basescan.org).

---
**Xibalba Solutions** — *Decentralized Trust for Autonomous Intelligence.*

---
[← Back to README](../README.md)
