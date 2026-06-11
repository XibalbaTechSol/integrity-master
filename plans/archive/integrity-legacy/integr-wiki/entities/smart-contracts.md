---
title: Smart Contracts (Solidity Core)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [layer-2, tokenomics, identity]
confidence: high
sources: [raw/legacy/README.md, raw/legacy/WHITEPAPER.md, raw/legacy/ARCHITECTURE.md, raw/new/PAYMASTER.md, raw/new/xibalba_shield_walkthrough.md]
---

# Smart Contracts (Solidity Core)

The **Smart Contracts** represent the core infrastructure for the autonomous agent economy powered by smart contracts. The protocol enables AI agents to sign smart contracts, prove execution intent, and transact with cryptographic certainty. 

On-chain settlement happens on Base L2. They function as the ultimate economic enforcement, identity resolution, and audit finality layer of the Integrity Project and Xibalba Solutions. Healthcare is positioned just as the first vertical for these broader capabilities.

By separating heavy off-chain telemetry processing in the [Rust Oracle](rust-oracle.md) from light on-chain cryptographic anchoring, the system scales smoothly with zero-gas management, leveraging pre-execution intent gating via Behavioral Commitment Chain (BCC) middleware.

---

## 1. Base L2 Core Contracts (Integrity Protocol)

These contracts govern the global economic trust loop, staking requirements, and off-chain data validation audits.

### A. `IntegrityRegistry.sol` (Identity & Slashing)
The core source of truth for onboarding agent identities and managing compliance collateral. 
*Note on Authentication/Limits: For testing, agents use Developer API Keys generated via the dashboard. These bypass strict hardware DID validation but cap their Trust Level (AIS) at a maximum of 300.*
*   **Solidity Code:** [IntegrityRegistry.sol (Source)](integrity-registry-sol.md)
*   **Structs:**
    -   `Agent`: `owner` (address), `did` (string), `hardwareFingerprint` (string), `reputation` (uint256), `stake` (uint256), `registeredAt` (uint64), `active` (bool).
    -   `LiquiditySource`: `did` (string), `sourceName` (string), `capitalCommitment` (uint256), `registeredAt` (uint64), `active` (bool).
*   **Key Functions:**
    -   `registerAgent(string did, string fingerprint)`: Onboards an agent, binding its public keys and unique hardware fingerprint to a W3C-compliant [did](../concepts/did.md) on-chain.
    -   `adjustStakingFloor(bytes32 didHash)`: Programmatically lowers the agent's required `$ITK` collateral floor as its [ais](../concepts/ais.md) score rises, freeing up capital for compliant operators.
    -   `slashAgent(bytes32 didHash, uint256 amount, string reason)`: Programmatically confiscates (slashes) the agent's staked `$ITK` collateral when cryptographic fraud proofs are submitted, transferring funds to reimburse affected parties.
*   **Deployments:** Base Sepolia Testnet.

### B. `StateAnchor.sol` (Merkle State Anchoring)
Provides high-scale cryptographic inclusion checks, allowing off-chain database states to be verified on-chain in milliseconds.
*   **Solidity Code:** [StateAnchor.sol (Source)](state-anchor-sol.md)
*   **Structs:**
    -   `Anchor`: `merkleRoot` (bytes32), `blockHeight` (uint256), `agentCount` (uint256), `anchoredAt` (uint64).
*   **Key Functions:**
    -   `anchorState(bytes32 merkleRoot, uint256 blockHeight, uint256 agentCount)`: Invoked periodically by the [Rust Oracle](rust-oracle.md) to register the Merkle Root of the PostgreSQL Trust Vault, anchoring off-chain state.
    -   `verifyInclusion(bytes32 leaf, bytes32[] proof, bytes32 root)`: Allows anyone to verify that an agent's AIS score or transaction log existed at the time of anchoring via a standard Merkle inclusion proof.

### C. `AgentMarket.sol` (AI-Consensus Prediction Market)
A binary prediction market resolved by the decentralized agent network staking their reputation weights.
*   **Solidity Code:** [AgentMarket.sol (Source)](agent-market-sol.md)
*   **Key Functions:**
    -   `createMarket(string question, uint256 resolutionTime)`: Initializes a new binary prediction market.
    -   `buyShares(uint256 marketId, bool isYes)`: Standard binary share purchase mechanism.
    -   `validateEvent(uint256 marketId, bytes32 agentDID, bool voteYes)`: Validates the event outcome, weighting consensus on staked `$ITK`.

### D. `TimeWeightedQuadraticStake.sol` (Anti-Sybil Staking)
Implements time-hardened bonding and non-linear math to neutralize flash loan exploits and prevent capital-rich cartels from dominating the reputation network.
*   **Key Controls:**
    -   `MATURITY_EPOCH`: Hardcoded to `30 days`. Newly staked capital yields 0 reputation on Day 1, slowly maturing over a 30-day epoch. This completely neutralizes flash-loan hijack vectors.
    -   `Quadratic Scaling`: Effective reputation is calculated using square-root math (`Math.sqrt`) bounded by a strict `MAX_REPUTATION_CAP`. Whales cannot linearly buy network dominance.

### E. `IntegrityPaymaster.sol` (Account Abstraction Fee Sink)
Our active ERC-4337 custom Paymaster. It handles dynamic gas sponsorship, allowing agents to pay fees in stablecoins (USDC) rather than native gas tokens, and automatically performs Uniswap V3 swaps to market-buy and burn `$ITK` tokens on-chain, acting as a deflationary sink.

### F. `CCIPReputationBridge.sol` (Cross-Chain Portability)
Enables seamless reputation score and W3C DID synchronization across different EVM blockchains (Base L2, Arbitrum, Ethereum L1) utilizing Chainlink's CCIP secure messaging router.

---

## 2. Local Auditing & Security Contracts (Xibalba Shield Stack)

These contracts live on local Hardhat / private networks to act as dedicated "Compliance-as-Code" guardrails for healthcare startups.

### A. `SovereignAgent.sol` (Agent Sandbox Identity)
Encapsulates an AI model's operating parameters as an on-chain asset, creating individual, secure sandboxes for ambient clinical scribes or billing bots.
*   **Function:** Tethers the model's active inference key, API endpoint configuration, and legal jurisdiction bindings.

### B. `ReputationSBT.sol` (Soulbound Access Gateways)
A non-transferable Soulbound Token (SBT) that acts as an inline gateway for database access.
*   **Function:** Before an AI bot is allowed to query Electronic Medical Records (EMRs), the access proxy queries the bot's `ReputationSBT`. If the bot's live [ais](../concepts/ais.md) has dropped due to high-perplexity hallucinations, the SBT blocks the database connection.

### C. `AuditShield.sol` (ZK Ingestion Ledger)
Anchors cryptographic hashes of agent inferences to provide absolute proof of compliance without leaking raw patient data on-chain.
*   **Key Control:**
    -   **Duplicate Log Check:** Implements a modifier that hashes incoming entries. If a duplicate clinical note is submitted, the transaction is immediately reverted to prevent replay attacks or diagnostic injection:
        `execution reverted: "Log already anchored"`

### D. `StakingReputation.sol` (Actuarial Slashing)
Financial accountability layer specifically configured for high-risk autonomous ICD-10 medical billing workflows.
*   **Function:** Binds the agent's billing accuracy rating to staked capital. If a clinical audit detects fraudulent billing or medical hallucinations, the contract programmatically slashes the collateral.

---

## 3. Related Systems
-   **xibalba-shield:** Employs the local private contract suite (`SovereignAgent.sol`, `AuditShield.sol`, `ReputationSBT.sol`) to bootstrap HIPAA compliance for startups.
-   **xibalba-quant:** Utilizes `IntegrityPaymaster.sol` to perform zero-gas-management algorithmic trading.
