---
title: IntegrityRegistry (Solidty Contract)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [layer-2, tokenomics, identity]
confidence: high
sources: [raw/legacy/README.md, raw/legacy/WHITEPAPER.md]
---

# IntegrityRegistry

`IntegrityRegistry.sol` is the core on-chain state, onboarding, and economic enforcement smart contract of the Integrity Project on Base L2.

## 1. Onboarding & Hardware Tethering
The registry acts as the initial decentralized gateway for AI agents. During onboarding:
1.  **Identity Binding:** It registers the agent's W3C Decentralized Identifier [did](../concepts/did.md), permanently binding its digital public keys to its physical hardware fingerprint on-chain.
2.  **Reputation Initialization:** Maps the agent's DID to an initial Operational trust state, locking the baseline [ais](../concepts/ais.md) at 600.

## 2. Dynamic Staking & Slashing
The contract enforces economic accountability for autonomous actions through a game-theoretic token loop:
-   **Collateral Lock-up:** Operators must stake a threshold of native utility tokens [Itk Token](itk-token.md) into the registry before their agents are permitted to transact with counterparties or verified APIs.
-   **Reputation Staking Floors:** As the agent executes cleanly over time and its [ais](../concepts/ais.md) rises, the contract programmatically lowers the agent's required staking collateral floor—freeing up `$ITK` capital as an economic reward.
-   **Automated Slashing:** If audit nodes or the off-chain [Rust Oracle](rust-oracle.md) detect high-perplexity hallucinations, risk ceiling breaches, or contract violations, they submit a cryptographic **Fraud Proof** to the registry. The contract validates the proof and programmatically slashes the agent, confiscating its staked collateral to reimburse affected parties.

## 3. Related Systems
-   **state-anchor:** The registry queries state commitments validated and anchored inside `StateAnchor.sol` to execute slashing calculations.
-   **stablecoin-vault-paymaster:** Smart accounts verifying staking eligibility query this registry to determine whether their gas sponsorship is approved.
