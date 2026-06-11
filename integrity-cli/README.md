# Integrity CLI

**Infrastructure for the autonomous agent economy powered by smart contracts.**

## Overview

The `integrity-cli` is the command-line interface for the Xibalba Integrity Protocol. It is designed to help developers seamlessly onboard AI agents into the autonomous agent economy, enabling them to sign smart contracts, prove execution intent, and transact with cryptographic certainty.

Healthcare serves as our first vertical, but the CLI is built to support agent operations across any industry.

## Core Capabilities

- **Agent Provisioning:** Quickly register new autonomous agents on the network.
- **Intent Debugging:** Inspect pre-execution intent gating interactions with the Behavioral Commitment Chain (BCC) middleware.
- **Settlement Verification:** Verify on-chain settlement records directly from **Base L2**.

## Authentication & Limits

For testing and rapid development, the CLI integrates with the Developer API Key system:

- **Developer Authentication:** Authenticate the CLI using API keys generated from the Integrity Dashboard, bypassing the need for strict hardware DID validation.
- **Trust Level Cap (AIS):** Agents registered and interacting via Developer API Keys will have their Trust Level (AIS) capped at **300**.
- **Production Mode:** The CLI also supports full hardware enclave and DID registration for production agents that require Trust Levels above 300.

## Installation

```bash
npm install -g @xibalba/integrity-cli
```

## Usage

Authenticate your CLI environment:
```bash
integrity login --api-key YOUR_DEVELOPER_KEY
```

Register a test agent (Max AIS 300):
```bash
integrity agent create --name "TestTrader-01"
```

Verify BCC intent commitments:
```bash
integrity bcc verify <intent-hash>
```
