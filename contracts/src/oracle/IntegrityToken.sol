// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IntegrityToken (ITK)
 * @notice A decentralized reputation system for AI agents.
 * @dev ERC-20 token with dynamic fees, staking, and role-based access.
 */
contract IntegrityToken is ERC20, Ownable, AccessControl {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    // Roles
    // ──────────────────────────────────────────────
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    // ──────────────────────────────────────────────
    // Supply & Economics
    // ──────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100M ITK
    uint256 public totalMinted;

    uint256 public baseFeeBps = 50; // 0.5% base fee
    uint256 public maxFeeBps = 200; // 2.0% max fee
    uint256 public feeMultiplier = 1; // Increases with network activity/entropy
    
    // ──────────────────────────────────────────────
    // Staking
    // ──────────────────────────────────────────────
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
    }

    mapping(address => StakeInfo) private _stakes;
    uint256 public totalStaked;

    // ──────────────────────────────────────────────
    // Reputation (Legacy / Cache)
    // ──────────────────────────────────────────────
    mapping(address => uint256) private _reputationScores;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────
    event TokensMinted(address indexed to, uint256 amount);
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event ReputationUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event Slashed(address indexed agent, uint256 amount, string reason);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event AgentRegistered(address indexed agent);
    event AgentRemoved(address indexed agent);
    event FeeMultiplierUpdated(uint256 newMultiplier);

    // ──────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────
    error ExceedsMaxSupply(uint256 requested, uint256 remaining);
    error InsufficientStake(uint256 requested, uint256 available);
    error ZeroAmount();
    error InvalidScore(uint256 score);

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────
    constructor(address initialOwner)
        ERC20("Integrity Token", "ITK")
        Ownable(initialOwner)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);

        // Mint initial supply to owner (50% of max)
        uint256 initialMint = MAX_SUPPLY / 2;
        _mint(initialOwner, initialMint);
        totalMinted = initialMint;

        emit TokensMinted(initialOwner, initialMint);
    }

    // ──────────────────────────────────────────────
    // Minting (capped)
    // ──────────────────────────────────────────────

    function mint(address to, uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (totalMinted + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - totalMinted);
        }

        totalMinted += amount;
        _mint(to, amount);

        emit TokensMinted(to, amount);
    }

    // ──────────────────────────────────────────────
    // Role management
    // ──────────────────────────────────────────────

    function addValidator(address validator) external onlyOwner {
        grantRole(VALIDATOR_ROLE, validator);
        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        revokeRole(VALIDATOR_ROLE, validator);
        emit ValidatorRemoved(validator);
    }

    function registerAgent(address agent) external onlyRole(VALIDATOR_ROLE) {
        grantRole(AGENT_ROLE, agent);
        _reputationScores[agent] = 50; // default reputation
        emit AgentRegistered(agent);
    }

    // ──────────────────────────────────────────────
    // Staking
    // ──────────────────────────────────────────────

    function stake(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        _transfer(msg.sender, address(this), amount);

        _stakes[msg.sender].amount += amount;
        _stakes[msg.sender].stakedAt = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (_stakes[msg.sender].amount < amount) {
            revert InsufficientStake(amount, _stakes[msg.sender].amount);
        }

        _stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    // ──────────────────────────────────────────────
    // Overrides: Dynamic Sovereign Tax (Burn/Treasury)
    // ──────────────────────────────────────────────

    /**
     * @notice Updates the fee multiplier based on network volume (Entropy).
     * @param _multiplier The new multiplier (1-4x).
     */
    function setFeeMultiplier(uint256 _multiplier) external onlyRole(VALIDATOR_ROLE) {
        require(_multiplier >= 1 && _multiplier <= 4, "Multiplier out of range.");
        feeMultiplier = _multiplier;
        emit FeeMultiplierUpdated(_multiplier);
    }

    function _update(address from, address to, uint256 value) 
        internal 
        override 
    {
        // No fee for minting, burning, staking, or transfers from/to owner/contract
        if (from == address(0) || to == address(0) || from == owner() || to == owner() || from == address(this) || to == address(this)) {
            super._update(from, to, value);
            return;
        }

        uint256 currentFeeBps = baseFeeBps * feeMultiplier;
        if (currentFeeBps > maxFeeBps) currentFeeBps = maxFeeBps;

        uint256 fee = (value * currentFeeBps) / 10000;
        
        if (fee > 0) {
            uint256 burnAmount = fee / 2;
            uint256 treasuryAmount = fee - burnAmount;
            uint256 netAmount = value - fee;

            super._update(from, to, netAmount);
            super._update(from, address(0), burnAmount);
            super._update(from, owner(), treasuryAmount);
        } else {
            super._update(from, to, value);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
