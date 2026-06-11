---
title: StateAnchor.sol (Solidity Source)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [smart-contract, solidity, anchor]
confidence: high
---

# `StateAnchor.sol` Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title StateAnchor
/// @notice Anchors Merkle roots of off-chain Oracle state snapshots on Base Sepolia.
/// @dev The Oracle periodically snapshots its PostgreSQL state, computes a Merkle
///      root, and the owner submits it here. Anyone can then verify inclusion of
///      individual records against an anchored root.
contract StateAnchor is Ownable {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    struct Anchor {
        bytes32 merkleRoot;
        uint256 blockHeight;
        uint256 agentCount;
        uint64 anchoredAt;
    }

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    /// @notice Chronological list of all anchored snapshots.
    Anchor[] public anchors;

    /// @dev Merkle root → index into `anchors` (1-indexed; 0 = not found).
    mapping(bytes32 => uint256) private _rootIndex;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event StateAnchored(
        bytes32 indexed merkleRoot,
        uint256 blockHeight,
        uint256 agentCount,
        uint256 anchorIndex
    );

    // ──────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────

    error RootAlreadyAnchored(bytes32 merkleRoot);
    error NoAnchorsYet();

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    // Anchoring
    // ──────────────────────────────────────────────

    /// @notice Anchor a new Merkle root from an Oracle state snapshot.
    /// @param merkleRoot Root hash of the snapshot Merkle tree.
    /// @param blockHeight L1/L2 block height at snapshot time (advisory).
    /// @param agentCount Number of agents included in the snapshot.
    function anchorState(
        bytes32 merkleRoot,
        uint256 blockHeight,
        uint256 agentCount
    ) external onlyOwner {
        if (_rootIndex[merkleRoot] != 0)
            revert RootAlreadyAnchored(merkleRoot);

        anchors.push(
            Anchor({
                merkleRoot: merkleRoot,
                blockHeight: blockHeight,
                agentCount: agentCount,
                anchoredAt: uint64(block.timestamp)
            })
        );

        // 1-indexed so 0 can represent "not found".
        _rootIndex[merkleRoot] = anchors.length;

        emit StateAnchored(merkleRoot, blockHeight, agentCount, anchors.length - 1);
    }

    // ──────────────────────────────────────────────
    // Verification
    // ──────────────────────────────────────────────

    /// @notice Verify that `leaf` is included in the Merkle tree with the given `root`.
    /// @param leaf Hash of the record to verify.
    /// @param proof Array of sibling hashes from leaf to root.
    /// @param root The Merkle root to verify against.
    /// @return valid True if the proof is valid for the given leaf and root.
    function verifyInclusion(
        bytes32 leaf,
        bytes32[] calldata proof,
        bytes32 root
    ) external pure returns (bool valid) {
        bytes32 computed = leaf;
        for (uint256 i; i < proof.length; ) {
            bytes32 sibling = proof[i];
            // Canonical ordering: smaller hash on the left.
            if (computed <= sibling) {
                computed = keccak256(abi.encodePacked(computed, sibling));
            } else {
                computed = keccak256(abi.encodePacked(sibling, computed));
            }
            unchecked { ++i; }
        }
        return computed == root;
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    /// @notice Return the most recently anchored state snapshot.
    function getLatestAnchor() external view returns (Anchor memory) {
        if (anchors.length == 0) revert NoAnchorsYet();
        return anchors[anchors.length - 1];
    }

    /// @notice Total number of anchored snapshots.
    function anchorCount() external view returns (uint256) {
        return anchors.length;
    }

    /// @notice Check if a specific Merkle root has been anchored.
    function isRootAnchored(bytes32 merkleRoot) external view returns (bool) {
        return _rootIndex[merkleRoot] != 0;
    }
}
```
