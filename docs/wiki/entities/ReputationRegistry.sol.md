---
title: IntegrityRegistry.sol (Solidity Source)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [smart-contract, solidity, registry]
confidence: high
---

# `IntegrityRegistry.sol` Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title IntegrityRegistry
/// @notice On-chain registry for Integrity Protocol agents and liquidity sources.
/// @dev Deployed on Base Sepolia (L2 testnet). Agents stake ETH and accrue reputation.
contract IntegrityRegistry is Ownable {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    struct Agent {
        address owner;
        string did;
        string hardwareFingerprint;
        uint256 reputation;
        uint256 stake;
        uint64 registeredAt;
        bool active;
    }

    struct LiquiditySource {
        string did;
        string sourceName;
        uint256 capitalCommitment;
        uint64 registeredAt;
        bool active;
    }

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    /// @notice Minimum stake (in wei) required to register an agent.
    uint256 public stakeThreshold;

    /// @dev DID hash → Agent record.
    mapping(bytes32 => Agent) private _agents;

    /// @dev DID hash → LiquiditySource record.
    mapping(bytes32 => LiquiditySource) private _liquiditySources;

    /// @notice Total number of registered agents.
    uint256 public agentCount;

    /// @notice Total number of registered liquidity sources.
    uint256 public liquiditySourceCount;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event AgentRegistered(
        bytes32 indexed didHash,
        string did,
        string hardwareFingerprint,
        uint256 initialReputation,
        uint256 stake
    );

    event LiquiditySourceRegistered(
        bytes32 indexed didHash,
        string did,
        string sourceName,
        uint256 capitalCommitment
    );

    event ReputationUpdated(
        bytes32 indexed didHash,
        uint256 oldScore,
        uint256 newScore,
        bytes32 proofHash
    );

    event AgentSlashed(
        bytes32 indexed didHash,
        uint256 amount,
        string reason
    );

    event StakeThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ──────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────

    error AgentAlreadyRegistered(bytes32 didHash);
    error AgentNotFound(bytes32 didHash);
    error LiquiditySourceAlreadyRegistered(bytes32 didHash);
    error LiquiditySourceNotFound(bytes32 didHash);
    error InsufficientStake(uint256 sent, uint256 required);
    error SlashExceedsStake(uint256 amount, uint256 stake);
    error EmptyDID();

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @param initialStakeThreshold Minimum stake in wei for agent registration.
    constructor(uint256 initialStakeThreshold) Ownable(msg.sender) {
        stakeThreshold = initialStakeThreshold;
    }

    // ──────────────────────────────────────────────
    // Agent Registration
    // ──────────────────────────────────────────────

    /// @notice Register a new agent. Must send at least `stakeThreshold` ETH.
    /// @param did Decentralized Identifier (e.g. "did:xibalba:0xabc…").
    /// @param hardwareFingerprint TPM/SGX fingerprint or platform attestation hash.
    /// @param initialReputation Starting reputation score (0–10000 bps).
    function registerAgent(
        string calldata did,
        string calldata hardwareFingerprint,
        uint256 initialReputation
    ) external payable {
        if (bytes(did).length == 0) revert EmptyDID();
        if (msg.value < stakeThreshold)
            revert InsufficientStake(msg.value, stakeThreshold);

        bytes32 didHash = keccak256(bytes(did));
        if (_agents[didHash].active)
            revert AgentAlreadyRegistered(didHash);

        _agents[didHash] = Agent({
            owner: msg.sender,
            did: did,
            hardwareFingerprint: hardwareFingerprint,
            reputation: initialReputation,
            stake: msg.value,
            registeredAt: uint64(block.timestamp),
            active: true
        });

        unchecked { ++agentCount; }

        emit AgentRegistered(
            didHash,
            did,
            hardwareFingerprint,
            initialReputation,
            msg.value
        );
    }

    // ──────────────────────────────────────────────
    // Liquidity Source Registration
    // ──────────────────────────────────────────────

    /// @notice Register a liquidity source against an existing agent DID.
    /// @param did The agent's DID (must already be registered).
    /// @param sourceName Human-readable name for the liquidity source.
    /// @param capitalCommitment Declared capital commitment in wei.
    function registerLiquiditySource(
        string calldata did,
        string calldata sourceName,
        uint256 capitalCommitment
    ) external {
        if (bytes(did).length == 0) revert EmptyDID();

        bytes32 didHash = keccak256(bytes(did));

        // Agent must exist.
        if (!_agents[didHash].active) revert AgentNotFound(didHash);

        if (_liquiditySources[didHash].active)
            revert LiquiditySourceAlreadyRegistered(didHash);
            
        // Enforce Xibalba as the exclusive liquidity source on testnet
        if (liquiditySourceCount >= 1) revert("Exclusive liquidity source already registered");

        _liquiditySources[didHash] = LiquiditySource({
            did: did,
            sourceName: sourceName,
            capitalCommitment: capitalCommitment,
            registeredAt: uint64(block.timestamp),
            active: true
        });

        unchecked { ++liquiditySourceCount; }

        emit LiquiditySourceRegistered(
            didHash,
            did,
            sourceName,
            capitalCommitment
        );
    }

    // ──────────────────────────────────────────────
    // Reputation
    // ──────────────────────────────────────────────

    /// @notice Update an agent's reputation score.
    /// @dev `proof` is reserved for future ZK/oracle attestation verification.
    ///      Currently accepted from owner only.
    /// @param did The agent's DID.
    /// @param newScore New reputation score (0–10000 bps).
    /// @param proof Attestation proof bytes (future use).
    function updateReputation(
        string calldata did,
        uint256 newScore,
        bytes calldata proof
    ) external onlyOwner {
        bytes32 didHash = keccak256(bytes(did));
        Agent storage agent = _agents[didHash];
        if (!agent.active) revert AgentNotFound(didHash);

        bytes32 proofHash = keccak256(proof);

        uint256 oldScore = agent.reputation;
        agent.reputation = newScore;

        emit ReputationUpdated(didHash, oldScore, newScore, proofHash);
    }

    // ──────────────────────────────────────────────
    // Slashing
    // ──────────────────────────────────────────────

    /// @notice Slash an agent's stake. Slashed funds go to the contract owner.
    /// @param did The agent's DID.
    /// @param amount Wei to slash.
    /// @param reason Human-readable reason for the slash.
    function slash(
        string calldata did,
        uint256 amount,
        string calldata reason
    ) external onlyOwner {
        bytes32 didHash = keccak256(bytes(did));
        Agent storage agent = _agents[didHash];
        if (!agent.active) revert AgentNotFound(didHash);
        if (amount > agent.stake) revert SlashExceedsStake(amount, agent.stake);

        unchecked { agent.stake -= amount; }

        // Transfer slashed funds to owner.
        (bool ok,) = owner().call{value: amount}("");
        require(ok, "slash transfer failed");

        emit AgentSlashed(didHash, amount, reason);
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    /// @notice Look up a registered agent by DID string.
    function getAgent(string calldata did) external view returns (Agent memory) {
        bytes32 didHash = keccak256(bytes(did));
        Agent memory agent = _agents[didHash];
        if (!agent.active) revert AgentNotFound(didHash);
        return agent;
    }

    /// @notice Get specific agent details for external contract integration (e.g. AgentMarket).
    /// @param didHash The keccak256 hash of the agent's DID.
    function getAgentDetails(bytes32 didHash) external view returns (
        address agentOwner,
        uint256 reputation,
        uint256 stake,
        bool active
    ) {
        Agent memory agent = _agents[didHash];
        return (agent.owner, agent.reputation, agent.stake, agent.active);
    }

    /// @notice Look up a registered liquidity source by DID string.
    function getLiquiditySource(
        string calldata did
    ) external view returns (LiquiditySource memory) {
        bytes32 didHash = keccak256(bytes(did));
        LiquiditySource memory ls = _liquiditySources[didHash];
        if (!ls.active) revert LiquiditySourceNotFound(didHash);
        return ls;
    }

    // ──────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────

    /// @notice Update the minimum stake threshold.
    function setStakeThreshold(uint256 newThreshold) external onlyOwner {
        uint256 old = stakeThreshold;
        stakeThreshold = newThreshold;
        emit StakeThresholdUpdated(old, newThreshold);
    }
}
```
