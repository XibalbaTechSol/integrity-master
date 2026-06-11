// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SmartBAA.sol";

/**
 * @title MedicalCreditLine
 * @dev Just-In-Time (JIT) programmable credit for medical supplies.
 */
contract MedicalCreditLine is Ownable {
    struct CreditLine {
        address hospital;
        address lender;
        uint256 limit;
        uint256 balance;
        uint256 interestRate; // Annual basis points (e.g. 500 = 5%)
        uint256 lastUpdate;
    }

    IERC20 public itkToken; // ITK used for fees; credit could be USDC
    SmartBAA public smartBaa;
    address public integrityOracle;

    mapping(bytes32 => CreditLine) public creditLines;
    // Attestation-Gated Leverage (Vulnerability 3 Fix)
    mapping(address => uint256) public agentTiers;

    event CreditLineEstablished(bytes32 indexed lineId, address indexed hospital, uint256 limit);
    event Drawdown(bytes32 indexed lineId, address indexed supplier, uint256 amount);

    constructor(address _itkToken, address _smartBaa, address _integrityOracle) Ownable(msg.sender) {
        itkToken = IERC20(_itkToken);
        smartBaa = SmartBAA(_smartBaa);
        integrityOracle = _integrityOracle;
    }

    /**
     * @dev Set agent attestation tier (restricted to Oracle/Owner)
     */
    function setAgentTier(address _agent, uint256 _tier) external {
        require(msg.sender == integrityOracle || msg.sender == owner(), "Unauthorized");
        agentTiers[_agent] = _tier;
    }

    /**
     * @dev Establish a credit line. Requires an Active BAA.
     */
    function establishCreditLine(
        address _hospital,
        uint256 _limit,
        uint256 _interestRate
    ) external returns (bytes32 lineId) {
        require(
            smartBaa.getBAAStatus(_hospital, msg.sender) == SmartBAA.BAAStatus.Active,
            "Active BAA required"
        );

        // Enforce Attestation-Gated Leverage limits
        uint256 tier = agentTiers[_hospital];
        if (tier == 0 || tier == 1) {
            require(_limit <= 10000 * 10**18, "Tier 1 capped at 10k credit limits");
        } else if (tier == 2) {
            require(_limit <= 100000 * 10**18, "Tier 2 capped at 100k credit limits");
        }
        // Tier 3 (TEE-bound) remains uncapped (leverage authorized)

        lineId = keccak256(abi.encodePacked(_hospital, msg.sender));
        creditLines[lineId] = CreditLine({
            hospital: _hospital,
            lender: msg.sender,
            limit: _limit,
            balance: 0,
            interestRate: _interestRate,
            lastUpdate: block.timestamp
        });

        emit CreditLineEstablished(lineId, _hospital, _limit);
    }

    /**
     * @dev JIT Drawdown triggered by inventory consumption.
     */
    function triggerJITPayment(
        bytes32 _lineId,
        address _supplier,
        uint256 _amount
    ) external {
        require(msg.sender == integrityOracle, "Only Oracle can trigger JIT");
        CreditLine storage line = creditLines[_lineId];
        require(line.balance + _amount <= line.limit, "Credit limit exceeded");

        line.balance += _amount;
        line.lastUpdate = block.timestamp;

        // Lender's capital is transferred to supplier
        // (Assumes lender has pre-approved this contract to spend their ITK/USDC)
        require(itkToken.transferFrom(line.lender, _supplier, _amount), "Credit transfer failed");

        emit Drawdown(_lineId, _supplier, _amount);
    }

    /**
     * @dev Simple repayment function.
     */
    function repay(bytes32 _lineId, uint256 _amount) external {
        CreditLine storage line = creditLines[_lineId];
        require(msg.sender == line.hospital, "Only hospital can repay");
        
        require(itkToken.transferFrom(msg.sender, line.lender, _amount), "Repayment failed");
        
        line.balance -= _amount; // Simplified (doesn't account for interest in this draft)
        line.lastUpdate = block.timestamp;
    }
}
