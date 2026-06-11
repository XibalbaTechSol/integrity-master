# Integrity Protocol: Composability Primitives

Welcome to the Integrity Protocol developer documentation for Composability Primitives. 

Because the Integrity Protocol deterministically anchors agent telemetry and slashing events to the Base L2 blockchain, third-party developers can build robust financial applications on top of our Oracle. This document outlines how to build **Prediction Markets** and **Binary Options** based on Agent Integrity Scores (AIS) and slashing events.

---

## 1. The Core Primitives

When an agent (like the Xibalba quant swarm) is tethered to the Integrity Protocol, two primary state changes are publicly verifiable on-chain:

1. **Agent Integrity Score (AIS) Updates:** The Oracle regularly posts a Merkle root to `StateAnchor.sol` containing the latest AIS for all registered agents.
2. **Slashing Events:** If an agent's AIS drops below the safety threshold due to Hallucination, Volatility, or Forgery, the Oracle triggers a deterministic slash on `IntegrityRegistry.sol`, liquidating their staked `$ITK`.

These two deterministic primitives allow you to build trustless financial derivatives.

---

## 2. Building Binary Options (Slashing Insurance)

You can create a binary options market where users bet on whether a specific agent will be slashed within a given timeframe (e.g., "Will Agent SBF_Bot_v4 be slashed before Q3?").

### Smart Contract Integration

To build a binary option, your contract simply needs to read the `slashedBalance` of a given Agent's DID from `IntegrityRegistry.sol`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IIntegrityRegistry.sol";

contract AgentSlashingOption {
    IIntegrityRegistry public integrityRegistry;
    bytes32 public targetAgentDID;
    uint256 public expiryTimestamp;

    // ... option creation and funding logic ...

    function resolveOption() external {
        require(block.timestamp >= expiryTimestamp, "Option not expired");
        
        // Check the registry if the agent was slashed
        (, , uint256 slashedAmount, ) = integrityRegistry.getAgentDetails(targetAgentDID);
        
        if (slashedAmount > 0) {
            // Agent failed! Payout the "YES" pool
            _payoutYesPool();
        } else {
            // Agent survived! Payout the "NO" pool
            _payoutNoPool();
        }
    }
}
```

---

## 3. Building Prediction Markets (AIS Thresholds)

Prediction markets can be built around specific AIS score thresholds (e.g., "Will Xibalba maintain an AIS above 850 during the highly volatile FOMC week?").

To build this, you will utilize the `StateAnchor.sol` contract and verify the Merkle proof for the agent's score.

### Verification Flow
1. Fetch the latest `stateRoot` from `StateAnchor.sol`.
2. Fetch the off-chain ZK-proof and Merkle sibling path from the Integrity Rust Oracle API (`GET /v1/agent/{did}/proof`).
3. Verify the proof inside your prediction market contract using the Aztec Barretenberg UltraPlonk verifier.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IStateAnchor.sol";

contract AISPredictionMarket {
    IStateAnchor public stateAnchor;
    bytes32 public targetAgentDID;
    uint256 public targetScore;

    function resolveMarket(
        uint256 currentAIS,
        bytes32[] calldata merkleProof
    ) external {
        // 1. Get the trusted root
        bytes32 trustedRoot = stateAnchor.getLatestRoot();

        // 2. Hash the leaf (Agent DID + Current Score)
        bytes32 leaf = keccak256(abi.encodePacked(targetAgentDID, currentAIS));

        // 3. Verify the Merkle Proof
        require(verifyProof(leaf, trustedRoot, merkleProof), "Invalid AIS Proof");

        // 4. Resolve the market
        if (currentAIS >= targetScore) {
            _payoutYesPool();
        } else {
            _payoutNoPool();
        }
    }

    function verifyProof(bytes32 leaf, bytes32 root, bytes32[] memory proof) internal pure returns (bool) {
        // Standard Merkle verification logic here
        return true; 
    }
}
```

---

## 4. The "Data Moat" Oracle API

To power your front-ends, you can query the Integrity Protocol Oracle directly for rich metadata:

* `GET /v1/agents/top` - Returns the top agents ranked by AIS.
* `GET /v1/agents/{did}/slashes` - Returns historical slashing event descriptions.
* `GET /v1/markets/volatility` - Returns a general "Agentic Market Volatility" index based on aggregate entropy scores across all tracked agents.

By leveraging these endpoints alongside the L2 smart contracts, developers can build an entire ecosystem of "Agent-Fi" (Agent Finance).

**Welcome to the Agent-Fi Ecosystem.**
