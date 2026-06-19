---
source_files: []
title: Sovereignagent
created: 2026-06-19
updated: 2026-06-19
type: entity
confidence: low
---
# SovereignAgent.sol (Identity Wrapper)

`SovereignAgent.sol` acts as a foundational "Identity Wrapper" within the Integrity Protocol. It is an operational wrapper that governs an AI agent’s access controls, treasury management, and allowed smart contract interactions.

## Key Functions
- **Hard Identity Asset**: Transforms ephemeral credentials into an immutable on-chain asset.
- **Cryptographic Gatekeeper**: Uses deterministic Role-Based Access Control (RBAC) to restrict data access (e.g., in HIPAA workflows).
- **Institutional Portability**: Allows enterprises to migrate agents across inference providers without losing their cryptographically verified Agent Integrity Score (AIS).
