// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SmartBAA.sol";

/**
 * @title ClinicalTrialBond
 * @dev Parametric insurance for clinical trial enrollment.
 */
contract ClinicalTrialBond is Ownable {
    enum BondStatus { Active, PayoutTriggered, SuccessfullyCompleted, Expired }

    struct Bond {
        address sponsor;
        address trialSite;
        uint256 targetEnrollment;
        uint256 currentEnrollment;
        uint256 deadline;
        uint256 payoutAmount;
        BondStatus status;
    }

    IERC20 public itkToken;
    SmartBAA public smartBaa;
    address public integrityOracle;

    mapping(bytes32 => Bond) public bonds;

    event BondCreated(bytes32 indexed bondId, address indexed sponsor, address indexed trialSite);
    event EnrollmentUpdated(bytes32 indexed bondId, uint256 count);
    event PayoutExecuted(bytes32 indexed bondId, uint256 amount);

    constructor(address _itkToken, address _smartBaa, address _integrityOracle) Ownable(msg.sender) {
        itkToken = IERC20(_itkToken);
        smartBaa = SmartBAA(_smartBaa);
        integrityOracle = _integrityOracle;
    }

    /**
     * @dev Creates a new bond. Requires an Active BAA.
     */
    function createBond(
        address _trialSite,
        uint256 _targetEnrollment,
        uint256 _deadline,
        uint256 _payoutAmount
    ) external returns (bytes32 bondId) {
        // Check for active BAA
        require(
            smartBaa.getBAAStatus(msg.sender, _trialSite) == SmartBAA.BAAStatus.Active,
            "Active BAA required"
        );

        bondId = keccak256(abi.encodePacked(msg.sender, _trialSite, block.timestamp));
        
        // Site stakes the payout amount (simplified logic)
        require(itkToken.transferFrom(_trialSite, address(this), _payoutAmount), "Stake transfer failed");

        bonds[bondId] = Bond({
            sponsor: msg.sender,
            trialSite: _trialSite,
            targetEnrollment: _targetEnrollment,
            currentEnrollment: 0,
            deadline: _deadline,
            payoutAmount: _payoutAmount,
            status: BondStatus.Active
        });

        emit BondCreated(bondId, msg.sender, _trialSite);
    }

    /**
     * @dev Oracle updates enrollment count. 
     * If deadline passed and target not met, triggers payout.
     */
    function updateEnrollment(bytes32 _bondId, uint256 _count) external {
        require(msg.sender == integrityOracle, "Only Oracle can update");
        Bond storage bond = bonds[_bondId];
        require(bond.status == BondStatus.Active, "Bond not active");

        bond.currentEnrollment = _count;
        emit EnrollmentUpdated(_bondId, _count);

        if (block.timestamp >= bond.deadline && bond.currentEnrollment < bond.targetEnrollment) {
            _executePayout(_bondId);
        } else if (bond.currentEnrollment >= bond.targetEnrollment) {
            bond.status = BondStatus.SuccessfullyCompleted;
            // Return stake to site
            require(itkToken.transfer(bond.trialSite, bond.payoutAmount), "Stake return failed");
        }
    }

    function _executePayout(bytes32 _bondId) internal {
        Bond storage bond = bonds[_bondId];
        bond.status = BondStatus.PayoutTriggered;
        uint256 amount = bond.payoutAmount;
        
        require(itkToken.transfer(bond.sponsor, amount), "Payout transfer failed");
        emit PayoutExecuted(_bondId, amount);
    }
}
