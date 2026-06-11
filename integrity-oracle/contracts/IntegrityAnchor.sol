// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IntegrityAnchor
 * @dev Anchors monthly reputation summaries of Xibalba agents on-chain.
 */
contract IntegrityAnchor is Ownable {
    
    struct AgentReputation {
        uint256 monthlyRiskScore;  // 0-1000
        bytes32 proofHash;         // IPFS/Arweave CID
        uint256 epoch;             // Month/Year (e.g., 202606)
    }

    // Mapping: agentDIDHash => epoch => Reputation
    mapping(bytes32 => mapping(uint256 => AgentReputation)) public reputationLedger;

    event ReputationAnchored(bytes32 indexed agentDIDHash, uint256 indexed epoch, uint256 riskScore);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Anchors a batch of agent reputations (Only by authorized Oracle).
     */
    function anchorReputations(
        bytes32[] calldata agentDIDHashes,
        uint256[] calldata scores,
        bytes32[] calldata proofHashes,
        uint256 epoch
    ) external onlyOwner {
        require(agentDIDHashes.length == scores.length && scores.length == proofHashes.length, "Mismatched arrays");

        for (uint256 i = 0; i < agentDIDHashes.length; i++) {
            reputationLedger[agentDIDHashes[i]][epoch] = AgentReputation({
                monthlyRiskScore: scores[i],
                proofHash: proofHashes[i],
                epoch: epoch
            });

            emit ReputationAnchored(agentDIDHashes[i], epoch, scores[i]);
        }
    }
}
