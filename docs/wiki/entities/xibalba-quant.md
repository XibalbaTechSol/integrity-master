---
title: Xibalba Quant (xibalba-quant)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [control-systems, tokenomics]
confidence: high
sources: [raw/new/integrity_protocol_strategy.md]
---

# Xibalba Quant (xibalba-quant)

**Xibalba Quant** (`xibalba-quant`) is the automated quantitative trading system of Xibalba Solutions. Operating as a continuous long-lived daemon within a local Docker container, its primary mandate is the passive generation of operations yield to fund the global activities of the parent company.

## 1. Architectural Isolation Directive
To enforce absolute risk compartmentalization and prevent any financial contamination of our enterprise products, the quantitative systems are strictly isolated from general business operations:
-   **Execution Profile:** Runs in a dedicated, isolated Hermes profile (`xibalba-quant`).
-   **API Containment:** All trading keys, credentials, and wallet parameters reside solely inside this isolated profile environment.
-   **Dashboard Separability:** The public-facing Integrity Project dashboards focus exclusively on cryptographic metadata (such as Entropy, Grounding, and Sacrifice) rather than trading growth or P&L metrics.

## 2. Quantitative Architecture
The trading daemon utilizes a combination of advanced control theory and discrete statistical models to trade major assets:
-   **Market Feed Ingestion:** Processes multi-modal trading feeds with sub-millisecond temporal alignment using **Sync Stack** guidelines.
-   **PID Grid Controller:** Applies proportional-integral-derivative control models on Ethereum (ETH) grids, adjusting transaction frequency based on price error.
-   **Ornstein-Uhlenbeck Pricing Simulation:** Models localized random walks with mean-reverting drifts to simulate pricing variance for risk evaluations.

## 3. Integrated Compliance
Before executing trades, the quant daemon interfaces with our local [Behavioral Commitment Chain](../concepts/behavioral-commitment-chain.md) MCP Server to verify that the proposed transaction volumes do not violate safety thresholds:
```python
# Intended state mapped and evaluated via bcc_mcp_server
intended_state = {
    "ticket": "ETH",
    "trade_type": "BUY",
    "amount": amount,
    "price": eth_price
}
```
If the commitment fails OPA verification (e.g. volumetric limits exceeded), the daemon aborts execution.

## 4. Related Systems
-   **xibalba-shield:** Acts as the primary B2B enterprise counterpart to [Xibalba Shield](xibalba-shield.md).
-   **stablecoin-vault-paymaster:** Transactions executed on Base L2 by the quant accounts utilize our custom [Stablecoin Vault Paymaster](stablecoin-vault-paymaster.md) to route fees seamlessly.
