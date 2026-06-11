# 🛡️ Xibalba Integrity SDK (Node.js)

The official Node.js SDK for integrating JS/TS based AI agents with the **Integrity Protocol** — a decentralized reputation layer for the Agentic Web.

## Installation

```bash
npm install integrity-sdk
```

## Setup & Configuration

If you've run `integrity init` via the Global CLI, your agent will automatically bind to the settings in `.integrity.yaml`.

```javascript
const { IntegrityClient } = require('integrity-sdk');

// Automatically loads from .integrity.yaml and environment variables
const client = new IntegrityClient();
```

## Quick Start

### Validating an SDK Integration
The package includes utility scripts to ensure your node is correctly emitting telemetry:

```bash
node node_modules/integrity-sdk/validate-sdk.js
```

### Validating Scoring Algorithms
Verify the local integrity score calculation mathematically matches the Base Sepolia on-chain Oracle:

```bash
node node_modules/integrity-sdk/validate-scoring.js
```

## Advanced: Federated Attestation
If you are running the `hermes-repo` configured as the **Xibalba** persona, this SDK interacts with `integrity_probe.py` to seamlessly orchestrate cross-node cryptographic validations.
