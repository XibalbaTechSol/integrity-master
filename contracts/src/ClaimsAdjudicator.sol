// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SmartBAA.sol";

/**
 * @title ClaimsAdjudicator
 * @dev Atomic medical claims adjudication using ZK-Proofs.
 */
contract ClaimsAdjudicator is Ownable {
    struct Policy {
        address insurer;
        address provider;
        uint256 escrowedBalance;
        bool active;
    }

    IERC20 public itkToken; // Using ITK or Stablecoin
    SmartBAA public smartBaa;
    address public integrityOracle;

    mapping(bytes32 => Policy) public policies;

    event PolicyFunded(bytes32 indexed policyId, uint256 amount);
    event ClaimPaid(bytes32 indexed policyId, uint256 amount, bytes32 zkProofHash);

    constructor(address _itkToken, address _smartBaa, address _integrityOracle) Ownable(msg.sender) {
        itkToken = IERC20(_itkToken);
        smartBaa = SmartBAA(_smartBaa);
        integrityOracle = _integrityOracle;
    }

    /**
     * @dev Fund a policy escrow. Requires an Active BAA.
     */
    function fundPolicy(address _provider, uint256 _amount) external returns (bytes32 policyId) {
        require(
            smartBaa.getBAAStatus(msg.sender, _provider) == SmartBAA.BAAStatus.Active,
            "Active BAA required"
        );

        policyId = keccak256(abi.encodePacked(msg.sender, _provider));
        require(itkToken.transferFrom(msg.sender, address(this), _amount), "Funding failed");

        policies[policyId].insurer = msg.sender;
        policies[policyId].provider = _provider;
        policies[policyId].escrowedBalance += _amount;
        policies[policyId].active = true;

        emit PolicyFunded(policyId, _amount);
    }

    /**
     * @dev Adjudicate and pay a claim instantly. 
     * In production, this would verify a ZK-SNARK proof from Aztec Noir.
     */
    function adjudicateClaim(
        bytes32 _policyId, 
        uint256 _claimAmount, 
        bytes32 _zkProofHash
    ) external {
        require(msg.sender == integrityOracle, "Only Oracle can adjudicate");
        Policy storage policy = policies[_policyId];
        require(policy.active, "Policy not active");
        require(policy.escrowedBalance >= _claimAmount, "Insufficient escrow");

        policy.escrowedBalance -= _claimAmount;
        
        require(itkToken.transfer(policy.provider, _claimAmount), "Claim payment failed");

        emit ClaimPaid(_policyId, _claimAmount, _zkProofHash);
    }
}
