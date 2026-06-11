---
title: Integrity Token ($ITK)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [tokenomics, layer-2]
confidence: high
sources: [raw/legacy/README.md, raw/legacy/WHITEPAPER.md]
---

# Integrity Token ($ITK)

The **Integrity Token ($ITK)** is the native ERC-20 utility token of the Integrity Project, deployed on Base L2. 

It functions as the core economic collateral and incentive currency that binds off-chain model behavior to on-chain financial accountability.

## 1. The Game-Theoretic Trust Loop
Instead of acting as a transaction-level medium of exchange (which introduces pricing volatility and Multi-Token UX friction), `$ITK` functions as an **Identity Trust Ticket**:

-   **Collateralized Entry:** Agent operators must acquire and lock `$ITK` collateral inside `IntegrityRegistry.sol` to activate an agent's digital identity.
-   **Risk Slashing:** If an agent violates safety thresholds or executes unauthorized state modifications, its staked `$ITK` is programmatically seized (slashed) and liquidated to refund affected institutional parties.
-   **Reputation Incentives:** Compliant execution over time increases the agent's [ais](../concepts/ais.md), which programmatically lowers the required staking floor, releasing locked `$ITK` capital back to the operator as an economic reward.

## 2. Programmatic Deflationary Sink
To solve the token velocity problem and ensure value accumulation as the network scales, the token incorporates custom **Value Capture Architecture**:

*   **Sovereign Transaction Tax:** A dynamic fee (e.g. 0.5%) is applied to all commerce transactions executed over the reputation network.
*   **Asynchronous Buybacks:** Standard transactional fees paid by agents in stablecoins are accumulated inside the [Stablecoin Vault Paymaster](stablecoin-vault-paymaster.md). Keeper bots asynchronously route these stablecoins through DEX pools to market-buy `$ITK`.
*   **Deflationary Burn:** 50% of the purchased `$ITK` is permanently burned, reducing the circulating supply and creating a strong, long-term deflationary sink linked directly to transaction volume.

## 3. Related Systems
-   **integrity-registry:** Holds and manages the locked `$ITK` staking collateral.
-   **stablecoin-vault-paymaster:** Executes the MEV-protected, asynchronous market buybacks of `$ITK` using accumulated stablecoin fees.
