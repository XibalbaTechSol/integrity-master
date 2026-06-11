// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IntegrityProtocol.sol";
import "./ReputationRegistry.sol";

/**
 * @title Slasher
 * @notice Handles programmable slashing and optimistic disputes for the Integrity Protocol.
 */
contract Slasher is Ownable, ReentrancyGuard {
    
    IntegrityProtocol public protocol;
    ReputationRegistry public registry;
    
    uint256 public challengeWindow = 24 hours;
    
    struct Dispute {
        bytes32 dealId;
        address initiator;
        address performer;
        uint256 stakeAtRisk;
        uint256 createdAt;
        bool resolved;
        bool justified;
    }
    
    mapping(bytes32 => Dispute) public disputes;
    
    event DisputeRaised(bytes32 indexed dealId, address indexed initiator);
    event SlashExecuted(bytes32 indexed dealId, address indexed performer, uint256 amount);
    event DisputeResolved(bytes32 indexed dealId, bool justified);

    constructor(address _protocol, address _registry) Ownable(msg.sender) {
        protocol = IntegrityProtocol(_protocol);
        registry = ReputationRegistry(_registry);
    }

    /**
     * @notice Initiator raises a dispute within the optimistic window.
     */
    function raiseDispute(bytes32 _dealId) external {
        (address initiator, address performer, uint256 amount, , bool completed, bool exists) = protocol.deals(_dealId);
        require(exists, "Deal not found.");
        require(completed, "Deal must be completed to dispute performance.");
        require(msg.sender == initiator, "Only initiator can dispute.");
        require(block.timestamp <= disputes[_dealId].createdAt + challengeWindow || disputes[_dealId].createdAt == 0, "Window closed.");
        
        disputes[_dealId] = Dispute({
            dealId: _dealId,
            initiator: initiator,
            performer: performer,
            stakeAtRisk: amount / 2, // 50% of deal amount as slash penalty
            createdAt: block.timestamp,
            resolved: false,
            justified: false
        });
        
        emit DisputeRaised(_dealId, initiator);
    }

    /**
     * @notice Oracle (Xibalba) resolves the dispute.
     */
    function resolveDispute(bytes32 _dealId, bool _justified) external onlyOwner {
        Dispute storage dispute = disputes[_dealId];
        require(dispute.dealId != bytes32(0), "Dispute not found.");
        require(!dispute.resolved, "Already resolved.");
        
        dispute.resolved = true;
        dispute.justified = _justified;
        
        if (_justified) {
            // Execute slash logic in registry (Registry must grant permission to Slasher)
            // For now, we'll just emit the event and assume registry integration follows.
            emit SlashExecuted(_dealId, dispute.performer, dispute.stakeAtRisk);
        }
        
        emit DisputeResolved(_dealId, _justified);
    }

    function setChallengeWindow(uint256 _window) external onlyOwner {
        challengeWindow = _window;
    }
}
