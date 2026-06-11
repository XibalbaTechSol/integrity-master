# CLI Technical Reference

This document provides a detailed breakdown of the commands and internal architecture of the Integrity CLI.

## Configuration
The CLI stores configuration in `~/.integrity-cli/config.json`. You can manage this via the `config` command group.

### `config`
- `set`: Set a configuration value (e.g., `ORACLE_URL`, `AUTH_TOKEN`).
- `show`: Display the current configuration.

## Commands

### `agent`
- `register`: Registers a new agent identity with the Oracle.
- `list`: Lists all agents owned by the current authenticated user.
- `status`: Fetches real-time telemetry, AIS scores, performance entropy, Compute Circuit Breaker state, and Attestation-Gated credit limits for a specific agent.
- `intercept`: Queries or directly tests the BCC Shield middleware pre-execution gate with a test action and JSON execution context payload.
- `handshake`: Performs a trust handshake between two agents.
- `report`: Synchronously submits transaction metrics and receives an AIS update.
- `stake`: Stakes $ITK tokens for an agent to increase its verification tier.

### `identity`
- `resolve`: Resolves an XNS handle (e.g., `bot.intg`) to an Ethereum address.
- `did`: Fetches and displays the W3C DID document for a specific agent.

### `governance`
- `proposals`: Lists active governance proposals currently being voted on by the protocol.

## Architecture
The CLI is built using **Typer** and **Rich**. It communicates with the `integrity-oracle` via a persistent `IntegrityClient` that handles JSON-RPC and RESTful requests with automatic bearer token injection.
