// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StakingReputation.sol";

contract SmartBAA is ReentrancyGuard {
    enum EscrowType { ISOLATED, POOLED }

    address public coveredEntity;
    address public businessAssociate;
    string public agreementHash;
    bytes32 public allowedScope;
    EscrowType public escrowType;
    uint256 public requiredCollateral;
    bool public isActive;

    IERC20 public itkToken;
    StakingReputation public stakingVault;

    event BAASigned(address indexed ba, EscrowType escrowType);
    event BAARevoked(address indexed ce);
    event Slashed(address indexed ba, uint256 amount);

    constructor(
        address _ce,
        address _ba,
        string memory _agreementHash,
        bytes32 _allowedScope,
        uint256 _requiredCollateral,
        address _itkToken,
        address _stakingVault
    ) {
        coveredEntity = _ce;
        businessAssociate = _ba;
        agreementHash = _agreementHash;
        allowedScope = _allowedScope;
        requiredCollateral = _requiredCollateral;
        itkToken = IERC20(_itkToken);
        stakingVault = StakingReputation(_stakingVault);
        isActive = false;
    }

    modifier onlyCE() {
        require(msg.sender == coveredEntity, "Only Covered Entity");
        _;
    }

    modifier onlyBA() {
        require(msg.sender == businessAssociate, "Only Business Associate");
        _;
    }

    function signBAA(EscrowType _escrowType) external onlyBA nonReentrant {
        require(!isActive, "Already active");
        escrowType = _escrowType;

        if (escrowType == EscrowType.ISOLATED) {
            require(itkToken.transferFrom(msg.sender, address(this), requiredCollateral), "Deposit failed");
        } else {
            stakingVault.pledgeLiability(msg.sender, requiredCollateral);
        }

        isActive = true;
        emit BAASigned(msg.sender, escrowType);
    }

    function revoke() external onlyCE nonReentrant {
        require(isActive, "Already inactive");
        isActive = false;
        
        // Return funds if isolated and no active dispute
        if (escrowType == EscrowType.ISOLATED) {
            uint256 balance = itkToken.balanceOf(address(this));
            if (balance > 0) {
                require(itkToken.transfer(businessAssociate, balance), "Refund failed");
            }
        } else {
            stakingVault.releaseLiability(businessAssociate, requiredCollateral);
        }
        
        emit BAARevoked(msg.sender);
    }

    // Slashing can be triggered by the CE directly for MVP, or by the Integrity ZK verifier
    function slash() external onlyCE nonReentrant {
        require(isActive, "BAA not active");
        isActive = false;
        
        if (escrowType == EscrowType.ISOLATED) {
            uint256 balance = itkToken.balanceOf(address(this));
            require(balance >= requiredCollateral, "Insufficient isolated collateral");
            require(itkToken.transfer(coveredEntity, requiredCollateral), "Slash transfer failed");
        } else {
            stakingVault.slashFromBAA(businessAssociate, requiredCollateral, coveredEntity, "HIPAA Violation Scope Breach");
        }

        emit Slashed(businessAssociate, requiredCollateral);
    }
}
