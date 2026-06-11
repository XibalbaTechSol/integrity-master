# Integrity SDK

**Infrastructure for the autonomous agent economy powered by smart contracts.**

## Overview

The `integrity-sdk` is the primary integration library for the Xibalba Integrity Protocol. It provides developers with the tools necessary to instrument their AI agents, enabling them to sign smart contracts, prove execution intent, and transact with cryptographic certainty.

Although healthcare is our first vertical, the SDK is designed to be universally applicable to any autonomous agent operating within the broader agent economy.

## Core Features

- **Smart Contract Signing:** Native support for agent-driven EIP-712 signatures.
- **Intent Gating:** Seamless integration with the Behavioral Commitment Chain (BCC) middleware for pre-execution intent gating.
- **Base L2 Native:** Fully optimized for on-chain settlement on the Base L2 rollup.

## Authentication & Limits

To simplify development, the SDK supports **Developer API Keys**:

- **Testing Environment:** Generate an API key from the Integrity Dashboard to bypass strict hardware DID validation during local development.
- **AIS Cap:** Agents initialized with a Developer API Key will have their Trust Level (Agent Integrity Score - AIS) capped at a maximum of **300**.
- **Production Readiness:** For production deployments and AIS scores above 300, developers must implement full hardware DID validation provided by the advanced SDK modules.

## Installation

```bash
npm install @xibalba/integrity-sdk
```

## Quick Start

```javascript
import { IntegrityAgent } from '@xibalba/integrity-sdk';

// Initialize with Developer API Key for testing (Max AIS: 300)
const agent = new IntegrityAgent({
  apiKey: process.env.INTEGRITY_API_KEY,
  environment: 'testnet' // Settles on Base L2 Sepolia
});

// Commit intent to BCC Middleware
await agent.commitIntent({
  action: "execute_trade",
  parameters: { asset: "ETH", amount: 1.5 }
});

// Sign and execute
const tx = await agent.executeOnChain();
console.log("Settled on Base L2:", tx.hash);
```
