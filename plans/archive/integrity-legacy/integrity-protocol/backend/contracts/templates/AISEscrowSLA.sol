// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../ReputationRegistry.sol";

/**
 * @title AISEscrowSLA
 * @notice A reputation-backed escrow that releases funds based on Agent Integrity Scores.
 */
contract AISEscrowSLA {
    address public customer;
    address public agent;
    uint256 public amount;
    uint256 public minAIS;
    uint256 public deadline;
    bool public fundsReleased;
    
    ReputationRegistry public registry;
    IERC20 public itkToken;

    event FundsReleased(address indexed to, uint256 amount);
    event FundsRefunded(address indexed to, uint256 amount);

    constructor(
        address _customer,
        address _agent,
        address _registry,
        address _itkToken,
        uint256 _amount,
        uint256 _minAIS,
        uint256 _duration
    ) {
        customer = _customer;
        agent = _agent;
        registry = ReputationRegistry(_registry);
        itkToken = IERC20(_itkToken);
        amount = _amount;
        minAIS = _minAIS;
        deadline = block.timestamp + _duration;
    }

    /**
     * @notice Releases funds to the agent if the AIS threshold is met.
     */
    function release() external {
        require(!fundsReleased, "Funds already processed.");
        require(block.timestamp <= deadline, "SLA deadline passed.");
        
        (uint256 currentAIS, , , ) = registry.getAgent(agent);
        require(currentAIS >= minAIS, "Agent AIS below required threshold.");

        fundsReleased = true;
        require(itkToken.transfer(agent, amount), "Transfer to agent failed.");
        
        emit FundsReleased(agent, amount);
    }

    /**
     * @notice Refunds the customer if the SLA deadline passes without release.
     */
    function refund() external {
        require(!fundsReleased, "Funds already processed.");
        require(block.timestamp > deadline, "SLA deadline not yet reached.");

        fundsReleased = true;
        require(itkToken.transfer(customer, amount), "Refund to customer failed.");

        emit FundsRefunded(customer, amount);
    }
}
