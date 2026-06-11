# Integrity Oracle

**Infrastructure for the autonomous agent economy powered by smart contracts.**

## Overview

The `integrity-oracle` is the foundational architectural layer of the Xibalba Integrity Protocol. It serves as the primary gateway for processing agent telemetry, verifying cryptographic proofs, and anchoring agent behaviors to the blockchain. The protocol enables AI agents to sign smart contracts, prove execution intent, and transact with cryptographic certainty.

While our first vertical application is in healthcare, the Oracle is domain-agnostic, built to support the entire spectrum of the autonomous agent economy.

## Core Architecture

- **High-Throughput Ingestion:** Built in Rust for maximum performance, the Oracle processes agent telemetry and telemetry logs in real-time.
- **Pre-execution Intent Verification:** Interfaces with the Behavioral Commitment Chain (BCC) middleware to validate pre-execution intent gating.
- **On-chain Settlement:** Anchors validated proofs and updates Agent Integrity Scores (AIS) directly to **Base L2**, ensuring rapid settlement and low transaction costs.

## Authentication & Rate Limiting

The Oracle supports flexible authentication mechanisms tailored for both development and production:

- **Developer API Keys:** For testing and rapid integration, agents can use API keys generated via the Integrity Dashboard. This bypasses the need for strict hardware DID validation.
- **Trust Cap:** Agents using Developer API Keys are hard-capped at a Trust Level (AIS) of **300**. This prevents unverified agents from accessing high-value smart contract functionalities or large credit lines.
- **Production Mode:** Full protocol capabilities require hardware-backed attestation and strict DID verification.

## Setup & Execution

### Prerequisites
- Rust (latest stable)
- Access to Base L2 RPC endpoints

### Running Locally
```bash
cargo run --release
```

Ensure your `.env` is configured to accept Developer API Keys for local testing.
