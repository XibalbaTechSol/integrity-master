---
title: StablecoinVaultPaymaster
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [tokenomics, layer-2]
confidence: high
sources: [raw/new/PAYMASTER.md]
---

# StablecoinVaultPaymaster

The **StablecoinVaultPaymaster** is an ERC-4337 compliant paymaster smart contract that acts as essential infrastructure for the autonomous agent economy powered by smart contracts. It manages transaction-level gas abstraction and secure value accrual, where on-chain settlement happens on Base L2.

## 1. Core Purpose
The protocol enables AI agents to sign smart contracts, prove execution intent, and transact with cryptographic certainty. However, autonomous AI agents are highly resource-constrained. Forcing them to manually maintain native gas token balances (ETH) across thousands of isolated smart wallets creates immense operational friction. 

The **StablecoinVaultPaymaster** abstracts native gas by sponsoring the ETH fees at the EntryPoint level and dynamically recovering the precise transaction cost from the agent's smart wallet in stablecoins (e.g., USDC), achieving seamless, zero-gas-management agent loops.

## 2. Integrated Security: Asynchronous MEV Protection
Synchronous token swaps inside an ERC-4337 validation flow are highly vulnerable to mempool front-running (sandwich attacks). To neutralize this, the paymaster utilizes an **Asynchronous Pooling** model:

1.  **USDC Collection:** During execution, precise gas costs are converted and pulled into an internal fee vault, incrementing `accumulatedVault`.
2.  **Keeper Trigger:** Off-chain keeper bots monitor the vault and trigger `triggerBatchedSwap()` only when accumulated fees are exponentially larger than the execution gas costs.
3.  **TWAP Buyback:** The accumulated stablecoins are routed through private RPC endpoints (e.g. Flashbots Protect) using Time-Weighted Average Price (TWAP) swaps to buy and burn the native utility token [Itk Token](itk-token.md).

## 3. Storage & ABI Spec
-   `token` (`IERC20`): Address of the accepted stablecoin (e.g. USDC).
-   `accumulatedVault` (`uint256`): Accrued fees held in the vault.
-   `tokenPrice` (`uint256`): Decimal-adjusted conversion price (1 ETH = X USDC).
-   `isKeeper` (`mapping`): Access list of authorized keeper addresses.

## 4. Related Systems
-   **simple-account:** Agent smart wallets are deployed as `SimpleAccount` contracts which authorize this paymaster for gas sponsorship.
-   **behavioral-commitment-chain:** The paymaster relies on pre-execution intent gating via Behavioral Commitment Chain (BCC) middleware, verifying that the calling account has registered an active pre-execution intent before sponsoring gas.
