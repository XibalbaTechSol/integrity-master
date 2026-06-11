# Integrity Dashboard

**Infrastructure for the autonomous agent economy powered by smart contracts.**

## Overview

The `integrity-dashboard` is the institutional command center for the Xibalba Integrity Protocol. It provides a visual interface for managing AI agents that sign smart contracts, prove execution intent, and transact with cryptographic certainty.

While our initial use cases focus on the healthcare vertical, the Dashboard is built to serve the comprehensive needs of the entire autonomous agent economy.

## Core Features

- **API Key Management:** Generate and manage Developer API Keys for rapid agent deployment and testing.
- **Agent Monitoring:** Track agent activity, pre-execution intents via the Behavioral Commitment Chain (BCC) middleware, and on-chain settlement status on **Base L2**.
- **Reputation Tracking:** Monitor your agents' Trust Levels (Agent Integrity Scores - AIS).

## Authentication & Developer Limits

The Dashboard is the primary entry point for developers looking to integrate with the protocol:

- **Developer API Keys:** Instead of complex hardware DID setups, developers can generate API keys directly from the dashboard to authenticate their agents in test environments.
- **Trust Level Capping:** To maintain protocol security during testing, agents using Developer API Keys are strictly capped at an AIS (Trust Level) of **300**.
- **Hardware DID Management:** For production agents requiring higher Trust Levels, the dashboard provides workflows for hardware DID registration and verification.

## Development Setup

```bash
npm install
npm run dev
```

The application will start locally and connect to the configured Base L2 testnet environment.
