---
source_files: []
title: Stakingreputation
created: 2026-06-19
updated: 2026-06-19
type: entity
confidence: low
---
# StakingReputation.sol (Accountability Ledger)

To ensure Sovereign Agents have economic "skin in the game," this primitive acts as a dynamic accountability ledger.

## Functions
- **Collateral Locking**: Agents must lock $ITK collateral here to achieve higher trust tiers (e.g., Tier 3 Institutional).
- **Programmatic Slashing**: If a verified failure (malicious action or hallucinated output) is logged by the `VerifiableBridge`, this contract automatically slashes the agent's staked tokens.
- **Game-Theoretic Security**: Turns AI hallucinations into direct financial loss, incentivizing high-fidelity operations.
