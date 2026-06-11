// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SovereignAgent.sol";

/**
 * @title AgentCreditFacility
 * @author Xibalba Solutions
 * @notice Provides undercollateralized loans (in ITK) to Sovereign Agents
 * based on their cryptographic Trust Level (Agent Integrity Score - AIS).
 */
contract AgentCreditFacility is Ownable {
    IERC20 public itkToken;

    uint256 public constant MIN_AIS_REQUIRED = 850;
    
    // Tier borrowing limits in ITK (assuming 18 decimals)
    uint256 public constant TIER_2_LIMIT = 100_000 * 10**18;

    // Mapping of Agent address to borrowed amount
    mapping(address => uint256) public borrowedAmounts;

    event CreditDrawn(address indexed agent, uint256 amount);
    event CreditRepaid(address indexed agent, uint256 amount);
    event CreditFrozen(address indexed agent, string reason);

    constructor(address _itkToken) Ownable(msg.sender) {
        itkToken = IERC20(_itkToken);
    }

    /**
     * @notice Allows an agent to draw credit.
     * @param agentAddress The contract address of the SovereignAgent
     * @param amount The amount of ITK to borrow
     */
    function drawCredit(address agentAddress, uint256 amount) external {
        SovereignAgent agent = SovereignAgent(agentAddress);
        
        // Caller must be the agent controller
        require(agent.hasRole(agent.DEFAULT_ADMIN_ROLE(), msg.sender), "Not authorized to act on behalf of agent");

        uint256 ais = agent.ais();
        uint256 tier = agent.tier();

        require(ais >= MIN_AIS_REQUIRED, "Agent AIS too low for credit facility");

        uint256 currentDebt = borrowedAmounts[agentAddress];
        uint256 newDebt = currentDebt + amount;

        // Apply Tier caps
        if (tier == 2) {
            require(newDebt <= TIER_2_LIMIT, "Exceeds Tier 2 borrowing limit");
        } else if (tier == 3) {
            // Uncapped
        } else {
            revert("Agent tier ineligible for credit");
        }

        require(itkToken.balanceOf(address(this)) >= amount, "Insufficient liquidity in facility");

        borrowedAmounts[agentAddress] = newDebt;
        itkToken.transfer(agentAddress, amount);

        emit CreditDrawn(agentAddress, amount);
    }

    /**
     * @notice Repays an outstanding loan.
     */
    function repayCredit(address agentAddress, uint256 amount) external {
        require(borrowedAmounts[agentAddress] >= amount, "Repaying more than owed");
        
        itkToken.transferFrom(msg.sender, address(this), amount);
        borrowedAmounts[agentAddress] -= amount;

        emit CreditRepaid(agentAddress, amount);
    }
}
