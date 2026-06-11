---
title: AgentMarket.sol (Solidity Source)
created: 2026-05-31
updated: 2026-05-31
type: entity
tags: [smart-contract, solidity, market]
confidence: high
---

# `AgentMarket.sol` Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IntegrityRegistry.sol";

/**
 * @title AgentMarket (Integrity-backed Polymarket Clone)
 * @notice A binary prediction market where events are independently validated 
 * by AI Agents tethered to the Integrity Protocol. 
 * Agents stake their reputation ($ITK) to resolve markets.
 */
contract AgentMarket {
    IntegrityRegistry public integrityRegistry;

    struct Market {
        uint256 id;
        string question;
        uint256 resolutionTime;
        bool isResolved;
        bool finalOutcome; // true = YES, false = NO
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 yesVotesITK;
        uint256 noVotesITK;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    
    // User balances per market: marketId => user => isYes => amount
    mapping(uint256 => mapping(address => mapping(bool => uint256))) public userShares;
    
    // Track if an agent has already voted on a market
    mapping(uint256 => mapping(bytes32 => bool)) public agentHasVoted;

    event MarketCreated(uint256 indexed marketId, string question, uint256 resolutionTime);
    event SharesPurchased(uint256 indexed marketId, address indexed buyer, bool isYes, uint256 amount);
    event AgentVoteCast(uint256 indexed marketId, bytes32 indexed agentDID, bool voteYes, uint256 weight);
    event MarketResolved(uint256 indexed marketId, bool finalOutcome);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 payout);

    constructor(address _integrityRegistry) {
        integrityRegistry = IntegrityRegistry(_integrityRegistry);
    }

    /**
     * @notice Create a new binary prediction market
     */
    function createMarket(string memory _question, uint256 _resolutionTime) external returns (uint256) {
        require(_resolutionTime > block.timestamp, "Resolution time must be in the future");
        
        marketCount++;
        markets[marketCount] = Market({
            id: marketCount,
            question: _question,
            resolutionTime: _resolutionTime,
            isResolved: false,
            finalOutcome: false,
            totalYesShares: 0,
            totalNoShares: 0,
            yesVotesITK: 0,
            noVotesITK: 0
        });

        emit MarketCreated(marketCount, _question, _resolutionTime);
        return marketCount;
    }

    /**
     * @notice Users buy YES or NO shares using ETH (1 share = 1 wei for simplicity in this PoC)
     */
    function buyShares(uint256 _marketId, bool _isYes) external payable {
        Market storage market = markets[_marketId];
        require(block.timestamp < market.resolutionTime, "Market is in resolution phase");
        require(!market.isResolved, "Market already resolved");
        require(msg.value > 0, "Must send ETH to buy shares");

        if (_isYes) {
            market.totalYesShares += msg.value;
        } else {
            market.totalNoShares += msg.value;
        }

        userShares[_marketId][msg.sender][_isYes] += msg.value;
        
        emit SharesPurchased(_marketId, msg.sender, _isYes, msg.value);
    }

    /**
     * @notice Agents validate the event outcome. Their vote weight is based on their staked $ITK.
     * Only verified Integrity Protocol agents can call this.
     */
    function validateEvent(uint256 _marketId, bytes32 _agentDID, bool _voteYes) external {
        Market storage market = markets[_marketId];
        require(block.timestamp >= market.resolutionTime, "Market not yet ready for resolution");
        require(!market.isResolved, "Market already resolved");
        require(!agentHasVoted[_marketId][_agentDID], "Agent already voted");

        // Verify the agent is registered and fetch their staked ITK weight
        (address agentWallet, , uint256 stakedBalance, ) = integrityRegistry.getAgentDetails(_agentDID);
        require(msg.sender == agentWallet, "Caller is not the agent's owner wallet");
        require(stakedBalance > 0, "Agent has no ITK stake to vote with");

        // Record the vote
        agentHasVoted[_marketId][_agentDID] = true;
        
        if (_voteYes) {
            market.yesVotesITK += stakedBalance;
        } else {
            market.noVotesITK += stakedBalance;
        }

        emit AgentVoteCast(_marketId, _agentDID, _voteYes, stakedBalance);
    }

    /**
     * @notice Resolves the market based on the consensus of the Agent Oracle Network.
     */
    function resolveMarket(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(block.timestamp >= market.resolutionTime, "Market not yet ready for resolution");
        require(!market.isResolved, "Market already resolved");
        require(market.yesVotesITK > 0 || market.noVotesITK > 0, "No agent votes cast");

        // Simple majority resolution (weighted by $ITK)
        market.isResolved = true;
        market.finalOutcome = market.yesVotesITK > market.noVotesITK;

        emit MarketResolved(_marketId, market.finalOutcome);
    }

    /**
     * @notice Winners claim their ETH payouts
     */
    function claimWinnings(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.isResolved, "Market not resolved yet");

        uint256 userShareCount = userShares[_marketId][msg.sender][market.finalOutcome];
        require(userShareCount > 0, "No winning shares to claim");

        // Calculate payout proportional to pool size
        uint256 totalWinningShares = market.finalOutcome ? market.totalYesShares : market.totalNoShares;
        uint256 totalLosingShares = market.finalOutcome ? market.totalNoShares : market.totalYesShares;
        
        // Payout = Your deposit + proportional share of the losing pool
        uint256 payout = userShareCount + ((userShareCount * totalLosingShares) / totalWinningShares);

        // Reset user balance to prevent double spending
        userShares[_marketId][msg.sender][market.finalOutcome] = 0;

        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "ETH transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, payout);
    }
}
```
