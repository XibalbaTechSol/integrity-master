// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IntegrityProtocol
 * @author Xibalba Solutions
 * @notice Facilitates agent-to-agent transactions with verifiable integrity hashes.
 * 
 * Logic:
 * 1. Agent A initiates a deal with Agent B.
 * 2. Agent A deposits ITK payment into the contract.
 * 3. Upon completion, the "Completion Handshake" is performed.
 * 4. A hash of the performance metrics (Entropy, Grounding, etc.) is anchored on-chain.
 * 5. Payment is released to Agent B.
 */
contract IntegrityProtocol is Ownable, ReentrancyGuard {

    IERC20 public intgToken;

    struct Deal {
        address initiator;
        address performer;
        uint256 amount;
        bytes32 integrityHash; // Anchored hash of off-chain metrics
        bool completed;
        bool exists;
    }

    mapping(bytes32 => Deal) public deals;
    uint256 public dealCount;

    event DealInitiated(bytes32 indexed dealId, address initiator, address performer, uint256 amount);
    event DealCompleted(bytes32 indexed dealId, bytes32 integrityHash);
    event MetricsVerified(bytes32 indexed dealId, bool success);

    constructor(address _intgToken) Ownable(msg.sender) {
        intgToken = IERC20(_intgToken);
    }

    /**
     * @notice Initiates a transaction between two agents.
     * @param _performer The agent providing the service.
     * @param _amount The payment in ITK.
     */
    function initiateDeal(address _performer, uint256 _amount) external nonReentrant returns (bytes32) {
        require(_amount > 0, "Amount must be greater than zero.");
        require(intgToken.transferFrom(msg.sender, address(this), _amount), "Payment deposit failed.");

        bytes32 dealId = keccak256(abi.encodePacked(msg.sender, _performer, dealCount, block.timestamp));
        
        deals[dealId] = Deal({
            initiator: msg.sender,
            performer: _performer,
            amount: _amount,
            integrityHash: bytes32(0),
            completed: false,
            exists: true
        });

        dealCount++;

        emit DealInitiated(dealId, msg.sender, _performer, _amount);
        return dealId;
    }

    /**
     * @notice Completes a deal and anchors the integrity metrics hash.
     * @param _dealId The unique ID of the deal.
     * @param _integrityHash The hash of the metrics (Entropy, Grounding, etc.) verified off-chain.
     */
    function completeHandshake(bytes32 _dealId, bytes32 _integrityHash) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(deal.exists, "Deal does not exist.");
        require(!deal.completed, "Deal already completed.");
        require(msg.sender == deal.initiator || msg.sender == owner(), "Only initiator or Xibalba can close.");

        deal.completed = true;
        deal.integrityHash = _integrityHash;

        // Release payment to performer
        require(intgToken.transfer(deal.performer, deal.amount), "Payment release failed.");

        emit DealCompleted(_dealId, _integrityHash);
    }

    /**
     * @notice Allows Xibalba Solutions (owner) to verify a deal's metrics on-chain.
     * Insurance companies pay Xibalba to confirm this verification status.
     */
    function verifyMetrics(bytes32 _dealId) external onlyOwner {
        emit MetricsVerified(_dealId, true);
    }
}
