// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title TimeWeightedQuadraticStake
 * @dev Implements Time-Weighted Bonding and Quadratic Reputation to prevent MEV/Flashloan
 * capital hijacking and mitigate whale dominance.
 */
contract TimeWeightedQuadraticStake {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    
    // MATURITY_EPOCH is the duration required to reach a 1.0 stake multiplier
    uint256 public constant MATURITY_EPOCH = 30 days;
    
    // MAX_REPUTATION_CAP sets a strict upper bound on influence, regardless of capital
    uint256 public immutable MAX_REPUTATION_CAP;

    struct StakeInfo {
        uint256 amount;
        uint256 weightedTimestamp;
    }

    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 totalAmount, uint256 newWeightedTimestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 remainingAmount);

    /**
     * @param _stakingToken Address of the ERC20 token to stake
     * @param _maxReputationCap The strict upper bound for any single agent's reputation
     */
    constructor(address _stakingToken, uint256 _maxReputationCap) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
        MAX_REPUTATION_CAP = _maxReputationCap;
    }

    /**
     * @notice Stake tokens into the protocol
     * @param amount The amount of tokens to stake
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        StakeInfo storage info = stakes[msg.sender];

        if (info.amount == 0) {
            info.weightedTimestamp = block.timestamp;
        } else {
            // Update weighted average timestamp to account for subsequent stakes
            // Formula: ((oldAmount * oldTimestamp) + (newAmount * currentTimestamp)) / totalAmount
            uint256 oldWeight = info.amount * info.weightedTimestamp;
            uint256 newWeight = amount * block.timestamp;
            info.weightedTimestamp = (oldWeight + newWeight) / (info.amount + amount);
        }

        info.amount += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, info.amount, info.weightedTimestamp);
    }

    /**
     * @notice Withdraw staked tokens
     * @param amount The amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        StakeInfo storage info = stakes[msg.sender];
        require(info.amount >= amount, "Insufficient staked amount");

        info.amount -= amount;
        if (info.amount == 0) {
            info.weightedTimestamp = 0;
        }

        stakingToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, info.amount);
    }

    /**
     * @notice Calculates the effective stake based on Time-Weighted Bonding
     * Effective Stake = Raw Stake * (min(Time Staked, MATURITY_EPOCH) / MATURITY_EPOCH)
     * @param agent The address of the staking agent
     * @return The time-weighted effective stake
     */
    function getEffectiveStake(address agent) public view returns (uint256) {
        StakeInfo memory info = stakes[agent];
        if (info.amount == 0) {
            return 0;
        }

        uint256 timeStaked = 0;
        if (block.timestamp > info.weightedTimestamp) {
            timeStaked = block.timestamp - info.weightedTimestamp;
        }

        if (timeStaked > MATURITY_EPOCH) {
            timeStaked = MATURITY_EPOCH;
        }

        // Apply time-weighted multiplier
        return (info.amount * timeStaked) / MATURITY_EPOCH;
    }

    /**
     * @notice Calculates the quadratic reputation, mitigated by the MAX_REPUTATION_CAP
     * reputation = min(sqrt(Effective Stake), MAX_REPUTATION_CAP)
     * @param agent The address of the agent
     * @return The capped quadratic reputation
     */
    function getEffectiveReputation(address agent) public view returns (uint256) {
        uint256 effectiveStake = getEffectiveStake(agent);
        uint256 reputation = Math.sqrt(effectiveStake);

        if (reputation > MAX_REPUTATION_CAP) {
            return MAX_REPUTATION_CAP;
        }

        return reputation;
    }
}
