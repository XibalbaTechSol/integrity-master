# Xibalba Integrity Protocol

**Infrastructure for the autonomous agent economy powered by smart contracts.**

## Overview

The **Xibalba Integrity Protocol** is the definitive trust layer for the autonomous agent economy. It enables AI agents to sign smart contracts, prove execution intent, and transact with cryptographic certainty. By bridging non-deterministic AI reasoning with deterministic on-chain finality, we transform volatile agent behavior into financially accountable, cryptographically verifiable, and insurable assets.

While healthcare represents our "first vertical," the core architecture is designed to support the broader autonomous economy, offering a universal standard for agent accountability across all industries.

## Core Architecture

The protocol is built on a robust, multi-layered architecture:

1. **Behavioral Commitment Chain (BCC) Middleware:** Provides pre-execution intent gating. Before an agent can execute an action on-chain or interact with critical systems, its reasoning and intent are securely committed to the BCC. This provides an immutable "receipt" of agent intent, ensuring actions are predictable and verifiable before they occur.
2. **On-chain Settlement on Base L2:** All final financial transactions, reputation updates, and cryptographic proofs are settled on Base L2, ensuring high scalability, low fees, and Ethereum-grade security.
3. **Agent Integrity Score (AIS):** A dynamic Trust Level for autonomous agents (ranging from 0 to 1000). The AIS acts as a FICO score for AI, measuring an agent's reliability, predictability, and financial accountability over time.

## Authentication & Limits

To accelerate development and testing, agents can authenticate using **Developer API Keys** generated via the Integrity Dashboard. 

- **Testnet/Developer Mode:** These keys bypass strict hardware DID validation, allowing for rapid iteration and testing. 
- **Trust Limit:** Agents authenticated via Developer API Keys have their Trust Level (AIS) capped at a maximum of **300**. This ensures a safe sandbox environment while preventing abuse of the protocol's credit and marketplace features.
- **Production Mode:** For full Trust Level unlocking (>300), agents must utilize hardware-bound Decentralized Identifiers (DIDs) and TEE attestations.

## Repository Structure

- **[`integrity-oracle/`](integrity-oracle/)**: The core telemetry ingestion and ZK-verification engine.
- **[`integrity-sdk/`](integrity-sdk/)**: The primary client library for agent instrumentation, intent-locking, and transaction signing.
- **[`integrity-dashboard/`](integrity-dashboard/)**: The control center for API key generation, agent monitoring, and A2A marketplace interactions.
- **[`integrity-cli/`](integrity-cli/)**: The administrative toolkit for identity registration and local environment setup.
- **[`contracts/`](contracts/)**: The centralized repository for core smart contracts on Base L2.
- **[`bcc_middleware/`](bcc_middleware/)**: The security sidecar for high-frequency intent interception.

## Getting Started

1. Generate a Developer API Key via the [Dashboard](integrity-dashboard/).
2. Instrument your AI agent using the [Integrity SDK](integrity-sdk/).
3. Route intents through the [BCC Middleware](bcc_middleware/).
4. Settle transactions on Base L2 via the [Oracle](integrity-oracle/).

---
*Built by Xibalba Solutions. Securing the agentic future.*
