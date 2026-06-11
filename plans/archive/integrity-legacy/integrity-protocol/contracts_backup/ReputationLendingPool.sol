// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ReputationRegistry.sol";

/**
 * @title ReputationLendingPool
 * @notice Allows agents to borrow liquidity based on their Agent Integrity Score (AIS).
 * High reputation acts as "soft collateral" to lower interest rates or increase LTV.
 */
contract ReputationLendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    ReputationRegistry public registry;
    IERC20 public itkToken;

    struct Loan {
        uint256 amount;
        uint256 collateralStaked;
        uint256 interestRateBps;
        uint256 startTime;
        bool active;
    }

    mapping(address => Loan) public loans;
    uint256 public totalLiquidity;

    event LoanIssued(address indexed agent, uint256 amount, uint256 interestRate);
    event LoanRepaid(address indexed agent, uint256 amount);

    constructor(address _registry, address _itkToken) Ownable(msg.sender) {
        registry = ReputationRegistry(_registry);
        itkToken = IERC20(_itkToken);
    }

    /**
     * @notice Deposit ITK to provide liquidity for the pool.
     */
    function depositLiquidity(uint256 _amount) external {
        itkToken.safeTransferFrom(msg.sender, address(this), _amount);
        totalLiquidity += _amount;
    }

    /**
     * @notice Borrow ITK based on reputation.
     * Higher AIS = Lower Interest Rate & Higher Loan-to-Value (LTV).
     */
    function borrow(uint256 _amount) external nonReentrant {
        require(!loans[msg.sender].active, "Existing loan active.");
        (uint256 ais, uint256 staked, , ) = registry.getAgent(msg.sender);
        
        require(ais >= 600, "Insufficient reputation for borrowing.");
        
        // Dynamic LTV based on AIS
        // 600 AIS = 50% LTV, 1000 AIS = 90% LTV
        uint256 maxLTV = 50 + ((ais - 600) * 40 / 400);
        uint256 maxBorrow = (staked * maxLTV) / 100;
        
        require(_amount <= maxBorrow, "Exceeds reputation-based LTV.");
        require(_amount <= totalLiquidity, "Insufficient pool liquidity.");

        // Dynamic Interest Rate
        // 1000 AIS = 2% (200 bps), 600 AIS = 10% (1000 bps)
        uint256 rate = 1000 - ((ais - 600) * 800 / 400);

        loans[msg.sender] = Loan({
            amount: _amount,
            collateralStaked: staked,
            interestRateBps: rate,
            startTime: block.timestamp,
            active: true
        });

        totalLiquidity -= _amount;
        itkToken.safeTransfer(msg.sender, _amount);

        emit LoanIssued(msg.sender, _amount, rate);
    }

    function repay() external nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan.");

        uint256 duration = block.timestamp - loan.startTime;
        uint256 interest = (loan.amount * loan.interestRateBps * duration) / (10000 * 365 days);
        uint256 totalRepayment = loan.amount + interest;

        itkToken.safeTransferFrom(msg.sender, address(this), totalRepayment);
        
        totalLiquidity += totalRepayment;
        loan.active = false;

        emit LoanRepaid(msg.sender, totalRepayment);
    }
}
