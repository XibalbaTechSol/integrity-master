// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StateAnchor
 * @notice Stores Merkle roots of the off-chain Trust Vault to enable ZK-proof verification.
 */
contract StateAnchor is Ownable {
    
    // mapping of timestamp => state_root
    mapping(uint256 => bytes32) public stateRoots;
    bytes32 public latestRoot;
    uint256 public latestTimestamp;

    event RootAnchored(bytes32 indexed root, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Oracle (Xibalba) anchors a new state root.
     * @param _root The Merkle root of the Trust Vault.
     */
    function anchorRoot(bytes32 _root) external onlyOwner {
        latestRoot = _root;
        latestTimestamp = block.timestamp;
        stateRoots[latestTimestamp] = _root;
        
        emit RootAnchored(_root, latestTimestamp);
    }

    /**
     * @notice Verify if a root was anchored at a specific timestamp or is the latest.
     */
    function isValidRoot(bytes32 _root) external view returns (bool) {
        return _root == latestRoot;
    }
}
