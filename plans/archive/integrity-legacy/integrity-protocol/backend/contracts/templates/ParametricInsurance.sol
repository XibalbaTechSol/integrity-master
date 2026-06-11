// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../ReputationRegistry.sol";

/**
 * @title ParametricInsurance
 * @notice Automatically pays out coverage if an agent's AIS drops below a threshold.
 */
contract ParametricInsurance {
    address public underwriter;
    address public beneficiary;
    address public targetAgent;
    uint256 public payoutAmount;
    uint256 public triggerAIS;
    uint256 public expiry;
    bool public isClaimed;
    
    ReputationRegistry public registry;
    IERC20 public itkToken;

    event PayoutTriggered(address indexed beneficiary, uint256 amount);
    event FundsReclaimed(address indexed underwriter, uint256 amount);

    constructor(
        address _underwriter,
        address _beneficiary,
        address _targetAgent,
        address _registry,
        address _itkToken,
        uint256 _payoutAmount,
        uint256 _triggerAIS,
        uint256 _duration
    ) {
        underwriter = _underwriter;
        beneficiary = _beneficiary;
        targetAgent = _targetAgent;
        registry = ReputationRegistry(_registry);
        itkToken = IERC20(_itkToken);
        payoutAmount = _payoutAmount;
        triggerAIS = _triggerAIS;
        expiry = block.timestamp + _duration;
    }

    /**
     * @notice Triggers the parametric payout if the agent's AIS drops below the threshold.
     */
    function triggerPayout() external {
        require(!isClaimed, "Claim already processed.");
        require(block.timestamp <= expiry, "Policy expired.");
        
        (uint256 currentAIS, , , ) = registry.getAgent(targetAgent);
        require(currentAIS < triggerAIS, "Agent AIS above trigger threshold.");

        isClaimed = true;
        require(itkToken.transfer(beneficiary, payoutAmount), "Payout failed.");
        
        emit PayoutTriggered(beneficiary, payoutAmount);
    }

    /**
     * @notice Allows the underwriter to reclaim funds after policy expiry if no claim was made.
     */
    function reclaim() external {
        require(!isClaimed, "Claim already processed.");
        require(block.timestamp > expiry, "Policy not yet expired.");
        require(msg.sender == underwriter, "Only underwriter can reclaim.");

        isClaimed = true;
        require(itkToken.transfer(underwriter, payoutAmount), "Reclaim failed.");

        emit FundsReclaimed(underwriter, payoutAmount);
    }
}
