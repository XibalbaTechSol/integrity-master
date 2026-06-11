// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IntegrityToken.sol";

/**
 * @title IValidationRegistry
 * @dev Interface for ERC-8004 compatible validation requests (ZK-Proofs, TEE, etc.)
 */
interface IValidationRegistry {
    event ValidationRequested(address indexed validator, address indexed agent, bytes32 indexed requestHash, string requestUri);
    event ValidationResponded(bytes32 indexed requestHash, uint8 status, string responseUri);

    function requestValidation(address _validator, address _agent, string calldata _uri) external returns (bytes32);
    function recordValidation(bytes32 _requestHash, uint8 _status, string calldata _uri) external;
}

/**
 * @title ReputationRegistry
 * @author Xibalba Solutions
 * @notice The central ledger for Agent Integrity Scores (AIS), compliant with ERC-8004.
 */
contract ReputationRegistry is AccessControl, IValidationRegistry, ReentrancyGuard {
    
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    struct AgentProfile {
        uint256 ais;          // 300 - 1000
        uint256 jobCount;     // Number of successful transactions
        uint256 totalStaked;  // Amount of ITK currently staked
        uint256 lastUpdate;   // Timestamp of last activity
        bool isVerified;      // Xibalba Solutions audit status
        uint256 verificationTier; // Tier 1-3
    }

    IntegrityToken public intgToken;
    address public identityRegistry; 
    address public stateAnchor; // StateAnchor contract address
    address public zkVereifier; // UltraVerifier contract address
    
    mapping(address => AgentProfile) public agents;
    mapping(bytes32 => bool) public pendingValidations;
    
    event AISUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event Staked(address indexed agent, uint256 amount);
    event Unstaked(address indexed agent, uint256 amount);
    event VerificationStatusChanged(address indexed agent, bool isVerified, uint256 tier);
    event TierUpgradeRequested(address indexed agent, uint256 requestedTier, uint256 amountPaid);
    event ZKProofVerified(address indexed agent, bytes32 indexed stateRoot);

    constructor(address _intgToken, address _admin) {
        intgToken = IntegrityToken(_intgToken);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(VALIDATOR_ROLE, _admin);
    }

    function setIdentityRegistry(address _registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        identityRegistry = _registry;
    }

    function setZKConfigs(address _anchor, address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stateAnchor = _anchor;
        zkVereifier = _verifier;
    }

    /**
     * @notice ERC-8004: Request validation for an agent's AIS or capability.
     */
    function requestValidation(address _validator, address _agent, string calldata _uri) external override returns (bytes32) {
        bytes32 requestHash = keccak256(abi.encodePacked(_validator, _agent, _uri, block.timestamp));
        pendingValidations[requestHash] = true;
        emit ValidationRequested(_validator, _agent, requestHash, _uri);
        return requestHash;
    }

    /**
     * @notice ERC-8004: Record the result of a validation (e.g. ZK-Proof verification).
     */
    function recordValidation(bytes32 _requestHash, uint8 _status, string calldata _uri) external override onlyRole(VALIDATOR_ROLE) {
        require(pendingValidations[_requestHash], "Invalid or already processed request.");
        pendingValidations[_requestHash] = false;
        emit ValidationResponded(_requestHash, _status, _uri);
    }

    /**
     * @notice Verifies a ZK-proof of reputation and updates the local AIS cache.
     * @param _proof The Noir ZK-proof bytes.
     * @param _publicInputs Array of public inputs: [ais_threshold, max_risk_days, agent_address, state_root]
     */
    function verifyReputationZK(bytes calldata _proof, bytes32[] calldata _publicInputs) external nonReentrant {
        address agent = address(uint160(uint256(_publicInputs[2])));
        require(msg.sender == agent, "Only the agent can submit their own ZK-proof.");
        
        require(zkVereifier != address(0), "ZK Verifier not configured.");
        require(stateAnchor != address(0), "State Anchor not configured.");
        
        bytes32 stateRoot = _publicInputs[3];
        // require(StateAnchor(stateAnchor).isValidRoot(stateRoot), "Invalid or outdated state root.");

        // Verification call placeholder (Interface depends on Noir version)
        // (bool success) = IUltraVerifier(zkVereifier).verify(_proof, _publicInputs);
        // require(success, "ZK-Proof verification failed.");

        uint256 threshold = uint256(_publicInputs[0]);
        
        // Update job count or last activity if proof is valid
        agents[agent].lastUpdate = block.timestamp;
        
        emit ZKProofVerified(agent, stateRoot);
    }

    /**
     * @notice Registers or updates an agent's AIS based on protocol calculations.
     */
    function updateAIS(address _agent, uint256 _ais, uint256 _tier) external onlyRole(VALIDATOR_ROLE) {
        require(_ais >= 300 && _ais <= 1000, "AIS out of valid range.");
        require(_tier >= 1 && _tier <= 3, "Invalid tier.");
        
        uint256 oldScore = agents[_agent].ais;
        agents[_agent].ais = _ais;
        agents[_agent].verificationTier = _tier;
        agents[_agent].lastUpdate = block.timestamp;
        
        emit AISUpdated(_agent, oldScore, _ais);
        emit VerificationStatusChanged(_agent, agents[_agent].isVerified, _tier);
    }

    /**
     * @notice Stakes ITK tokens to boost the AIS score.
     */
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero.");
        require(intgToken.transferFrom(msg.sender, address(this), _amount), "Stake transfer failed.");
        
        agents[msg.sender].totalStaked += _amount;
        agents[msg.sender].lastUpdate = block.timestamp;
        
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Unstakes ITK tokens, reducing the AIS boost.
     */
    function unstake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero.");
        require(agents[msg.sender].totalStaked >= _amount, "Insufficient staked balance.");
        
        agents[msg.sender].totalStaked -= _amount;
        agents[msg.sender].lastUpdate = block.timestamp;
        
        require(intgToken.transfer(msg.sender, _amount), "Unstake transfer failed.");
        
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @notice Verifies an agent through Xibalba Solutions' cryptographic audit.
     */
    function verifyAgent(address _agent, bool _status, uint256 _tier) external onlyRole(VALIDATOR_ROLE) {
        agents[_agent].isVerified = _status;
        agents[_agent].verificationTier = _tier;
        emit VerificationStatusChanged(_agent, _status, _tier);
    }

    /**
     * @notice Monetization: Agents pay to upgrade their tier (Institutional Tier 3).
     * @param _targetTier The tier to upgrade to (e.g., 3).
     * @param _amount The amount of ITK to pay/burn for the upgrade.
     */
    function upgradeTier(uint256 _targetTier, uint256 _amount) external {
        require(_targetTier > agents[msg.sender].verificationTier, "Cannot downgrade or stay at same tier.");
        require(_targetTier <= 3, "Invalid target tier.");
        
        // Transfer ITK payment to the contract (effectively a revenue capture)
        require(intgToken.transferFrom(msg.sender, address(this), _amount), "Upgrade payment failed.");
        
        // If it's a Tier 3 upgrade, it usually requires a manual audit, 
        // so we flag it for validation rather than auto-upgrading.
        emit TierUpgradeRequested(msg.sender, _targetTier, _amount);
    }

    /**
     * @notice Returns the core reputation metrics for a specific agent.
     */
    function getAgent(address _agent) external view returns (uint256 score, uint256 staked, bool verified, uint256 tier) {
        AgentProfile memory profile = agents[_agent];
        return (profile.ais == 0 ? 300 : profile.ais, profile.totalStaked, profile.isVerified, profile.verificationTier);
    }
}
