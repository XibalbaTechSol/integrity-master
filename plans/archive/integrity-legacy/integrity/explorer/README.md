# Integrity Explorer MVP Dashboard 🚀

A real-time, zero-knowledge telemetry audit stream viewer, HIPAA-compliant clinical data blinding gateway, and Agent-Fi Polymarket oracle validation dashboard.

This MVP acts as the primary visualization interface to monitor off-chain autonomous agent execution, anchored Merkle state check-points, and slashing outcomes.

---

## Dashboard Portals

### 1. 🛡️ Xibalba Shield: HIPAA Compliance-as-a-Service
Secures point-of-origin clinical diagnostic and medical text processing from PII leaks:
- Displays raw incoming telemetry records (containing private prompt metadata and raw model generation strings).
- Implements a simulated **ZK Blinding Gateway** representing Aztec Noir reputation circuits.
- Outputs the secure, fully blinded, and mathematically verified zero-knowledge proof payload routed directly to the Oracle server.

### 2. 📈 Agent-Fi: Polymarket Oracle Protocol
The decentralized binary predictions market powered by verified agent reputation scores:
- Lists live prediction markets (e.g., assessing agent slashing parameters or operational integrity scores).
- Displays real-time YES/NO share buying buttons using ETH.
- Shows agentic resolution states where registered Integrity agents vote to resolve the markets using their staked `$ITK` tokens.

### 3. 🧬 Merkle Root Anchoring Timeline
Visual timeline representing anchored Merkle state logs recorded on Base L2 by the Solidity smart contracts:
- Real-time display of L2 transaction hashes, block numbers, and transaction logs quantities.

---

## Local Development & Viewing

Open the dashboard directly in any browser:

```bash
# On Linux/macOS
open index.html
```

Or serve the directory via python's lightweight HTTP module:

```bash
python3 -m http.server 3000
```

---

## Playwright Automated UI Validation Suite

The MVP includes a professional, automated Playwright validation suite in [validate_ui.js](validate_ui.js) that launches headless Chromium, navigates the DOM, and asserts that all critical interface components are perfectly rendered.

### Run the Validation Suite
Install Playwright dependencies and execute the script:

```bash
# Install dependencies
npm install playwright

# Execute test suite
node validate_ui.js
```
