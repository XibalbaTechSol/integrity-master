// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
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
 * @dev V2 Upgrade: Implements Chainlink CCIP for cross-chain AIS attestation broadcasting.
 */
contract ReputationRegistry is AccessControl, IValidationRegistry, ReentrancyGuard {
    
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    struct AgentProfile {
        uint256 ais;          // 300 - 1000
        uint256 jobCount;     // Number of successful transactions
        uint256 totalStaked;  // Amount of ITK staked BY the agent
        uint256 externalStaked; // Amount of ITK staked TO the agent by LPs
        uint256 lastUpdate;   // Timestamp of last activity
        bool isVerified;      // Xibalba Solutions audit status
        uint256 verificationTier; // Tier 1-3
    }

    IntegrityToken public intgToken;
    address public identityRegistry; 
    address public stateAnchor; // StateAnchor contract address
    address public zkVereifier; // UltraVerifier contract address
    
    // Chainlink CCIP Configuration
    IRouterClient public ccipRouter;
    IERC20 public linkToken;
    
    mapping(address => AgentProfile) public agents;
    mapping(bytes32 => bool) public pendingValidations;
    mapping(address => mapping(address => uint256)) public userStakes; // user => agent => amount

    
    event AISUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event Staked(address indexed agent, uint256 amount);
    event Unstaked(address indexed agent, uint256 amount);
    event VerificationStatusChanged(address indexed agent, bool isVerified, uint256 tier);
    event TierUpgradeRequested(address indexed agent, uint256 requestedTier, uint256 amountPaid);
    event ZKProofVerified(address indexed agent, bytes32 indexed stateRoot);
    event AIBroadcastedCrossChain(address indexed agent, uint64 destinationChainSelector, bytes32 messageId);

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
     * @notice Configure Chainlink CCIP Router and LINK token for cross-chain bridging.
     */
    function setCCIPConfig(address _router, address _linkToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ccipRouter = IRouterClient(_router);
        linkToken = IERC20(_linkToken);
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
}

/**
 * @title IUltraVerifier
 * @dev Interface for the Aztec Noir generated UltraPlonk verifier.
 */
interface IUltraVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}

    /**
     * @title ReputationRegistry
    ...
        /**
         * @notice Verifies a Noir ZK-proof of reputation and updates the local AIS cache.
         * @param _proof The Noir ZK-proof bytes.
         * @param _publicInputs Array of public inputs: [ais_threshold, max_risk_days, agent_address, state_root]
         */
        function verifyReputationZK(bytes calldata _proof, bytes32[] calldata _publicInputs) external nonReentrant {
            address agent = address(uint160(uint256(_publicInputs[2])));
            require(msg.sender == agent, "Only the agent can submit their own ZK-proof.");

            require(zkVereifier != address(0), "ZK Verifier not configured.");
            require(stateAnchor != address(0), "State Anchor not configured.");

            // 1. CALL THE ZK-VERIFIER
            bool isValid = IUltraVerifier(zkVereifier).verify(_proof, _publicInputs);
            require(isValid, "Invalid ZK Proof: Mathematical constraint failure.");

            bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
            bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
            ...
            /**
             * @notice Registers or updates an agent's AIS based on protocol calculations.
             */
            function updateAIS(address _agent, uint256 _ais, uint256 _tier) external onlyRole(VALIDATOR_ROLE) {
                _updateAISInternal(_agent, _ais, _tier);
            }

            /**
             * @notice Updates reputation score received from a trusted cross-chain bridge.
             */
            function updateAISByBridge(address _agent, uint256 _ais, uint256 _tier) external onlyRole(BRIDGE_ROLE) {
                _updateAISInternal(_agent, _ais, _tier);
            }

            function _updateAISInternal(address _agent, uint256 _ais, uint256 _tier) internal {
                require(_ais >= 300 && _ais <= 1000, "AIS out of valid range.");
                require(_tier >= 1 && _tier <= 3, "Invalid tier.");

                uint256 oldScore = agents[_agent].ais;
                agents[_agent].ais = _ais;
                agents[_agent].verificationTier = _tier;
                agents[_agent].lastUpdate = block.timestamp;

                emit AISUpdated(_agent, oldScore, _ais);
            }

    
    /**
     * @notice Broadcasts an agent's AIS score to a destination chain (e.g. Ethereum L1) via Chainlink CCIP.
     * @param _agent The agent whose score to broadcast.
     * @param _destinationChainSelector CCIP selector for the target blockchain.
     * @param _receiver The corresponding Registry contract on the target blockchain.
     */
    function broadcastAISToEthereumL1(address _agent, uint64 _destinationChainSelector, address _receiver) external nonReentrant returns (bytes32 messageId) {
        require(address(ccipRouter) != address(0), "CCIP Router not configured.");
        
        AgentProfile memory profile = agents[_agent];
        require(profile.ais > 0, "Agent has no AIS score to broadcast.");
        
        // Encode the AIS score update as the payload
        bytes memory payload = abi.encode(_agent, profile.ais, profile.verificationTier);
        
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens sent, just data
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000}) // Gas limit for the receiving contract
            ),
            feeToken: address(linkToken)
        });
        
        // Calculate the required LINK fee
        uint256 fees = ccipRouter.getFee(_destinationChainSelector, evm2AnyMessage);
        require(linkToken.balanceOf(address(this)) >= fees, "Not enough LINK balance to cover CCIP fees.");
        
        // Approve router to spend LINK
        linkToken.approve(address(ccipRouter), fees);
        
        // Send the CCIP message
        messageId = ccipRouter.ccipSend(_destinationChainSelector, evm2AnyMessage);
        
        emit AIBroadcastedCrossChain(_agent, _destinationChainSelector, messageId);
        return messageId;
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
     * @notice Stakes ITK tokens to a specific agent to boost their reputation.
     */
    function stakeToAgent(address _agent, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero.");
        require(intgToken.transferFrom(msg.sender, address(this), _amount), "Stake transfer failed.");
        
        userStakes[msg.sender][_agent] += _amount;
        agents[_agent].externalStaked += _amount;
        agents[_agent].lastUpdate = block.timestamp;
        
        emit Staked(_agent, _amount);
    }

    /**
     * @notice Unstakes ITK tokens from a specific agent.
     */
    function unstakeFromAgent(address _agent, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero.");
        require(userStakes[msg.sender][_agent] >= _amount, "Insufficient staked balance.");
        
        userStakes[msg.sender][_agent] -= _amount;
        agents[_agent].externalStaked -= _amount;
        
        require(intgToken.transfer(msg.sender, _amount), "Unstake transfer failed.");
        
        emit Unstaked(_agent, _amount);
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
     */
    function upgradeTier(uint256 _targetTier, uint256 _amount) external {
        require(_targetTier > agents[msg.sender].verificationTier, "Cannot downgrade or stay at same tier.");
        require(_targetTier <= 3, "Invalid target tier.");
        
        require(intgToken.transferFrom(msg.sender, address(this), _amount), "Upgrade payment failed.");
        
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
