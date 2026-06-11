// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./templates/AISEscrowSLA.sol";
import "./templates/ParametricInsurance.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NoCodeFactory
 * @notice Factory for deploying reputation-backed SLA and Insurance contracts.
 */
contract NoCodeFactory is Ownable {
    address public registry;
    address public itkToken;

    event SLADeployed(address indexed contractAddress, address indexed customer, address indexed agent);
    event InsuranceDeployed(address indexed contractAddress, address indexed underwriter, address indexed targetAgent);

    constructor(address _registry, address _itkToken) Ownable(msg.sender) {
        registry = _registry;
        itkToken = _itkToken;
    }

    /**
     * @notice Deploys a new AISEscrowSLA contract.
     */
    function deploySLA(
        address _customer,
        address _agent,
        uint256 _amount,
        uint256 _minAIS,
        uint256 _duration
    ) external returns (address) {
        AISEscrowSLA newSLA = new AISEscrowSLA(
            _customer,
            _agent,
            registry,
            itkToken,
            _amount,
            _minAIS,
            _duration
        );
        
        emit SLADeployed(address(newSLA), _customer, _agent);
        return address(newSLA);
    }

    /**
     * @notice Deploys a new ParametricInsurance contract.
     */
    function deployInsurance(
        address _beneficiary,
        address _targetAgent,
        uint256 _payoutAmount,
        uint256 _triggerAIS,
        uint256 _duration
    ) external returns (address) {
        ParametricInsurance newInsurance = new ParametricInsurance(
            msg.sender,
            _beneficiary,
            _targetAgent,
            registry,
            itkToken,
            _payoutAmount,
            _triggerAIS,
            _duration
        );
        
        emit InsuranceDeployed(address(newInsurance), msg.sender, _targetAgent);
        return address(newInsurance);
    }
}
