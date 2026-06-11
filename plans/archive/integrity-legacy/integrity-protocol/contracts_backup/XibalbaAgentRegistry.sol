// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IntegrityToken.sol";

/**
 * @title XibalbaAgentRegistry
 * @author Xibalba Solutions
 * @notice The optimized, high-scale registry for AI Agent identities and reputation.
 * Replaces the 'contract-per-agent' model with a centralized, NFT-indexed mapping.
 * Compliant with ERC-8004.
 */
contract XibalbaAgentRegistry is ERC721Enumerable, AccessControl, ReentrancyGuard {
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct AgentProfile {
        string agentAlias;
        uint256 ais;          // 300 - 1000
        uint256 totalStaked;  // Amount of ITK currently staked
        uint256 lastUpdate;   // Timestamp of last activity
        uint256 verificationTier; // Tier 1-3
        bool isVerified;      // Manual audit status
    }

    IntegrityToken public intgToken;
    uint256 private _nextTokenId;

    // Mapping from agent address (wallet) to their profile
    mapping(address => AgentProfile) public agents;
    // Mapping from address to tokenId (to link wallet to identity NFT)
    mapping(address => uint256) public walletToToken;

    event AgentRegistered(address indexed wallet, uint256 indexed tokenId, string agentAlias);
    event AISUpdated(address indexed wallet, uint256 oldScore, uint256 newScore);
    event Staked(address indexed wallet, uint256 amount);
    event Unstaked(address indexed wallet, uint256 amount);
    event TierUpgraded(address indexed wallet, uint256 newTier);

    constructor(address _intgToken, address _admin) ERC721("Xibalba Agent Identity", "XID") {
        intgToken = IntegrityToken(_intgToken);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ORACLE_ROLE, _admin);
    }

    /**
     * @notice Registers a new agent identity and mints an XID NFT.
     */
    function registerAgent(string memory _alias) external returns (uint256) {
        require(walletToToken[msg.sender] == 0, "Wallet already registered.");
        
        uint256 tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);
        
        agents[msg.sender] = AgentProfile({
            agentAlias: _alias,
            ais: 300,
            totalStaked: 0,
            lastUpdate: block.timestamp,
            verificationTier: 1,
            isVerified: false
        });
        
        walletToToken[msg.sender] = tokenId;
        
        emit AgentRegistered(msg.sender, tokenId, _alias);
        return tokenId;
    }

    /**
     * @notice Oracle-only: Updates an agent's AIS based on off-chain telemetry.
     */
    function updateAIS(address _agent, uint256 _ais, uint256 _tier) external onlyRole(ORACLE_ROLE) {
        require(walletToToken[_agent] != 0, "Agent not registered.");
        require(_ais >= 300 && _ais <= 1000, "AIS out of range.");
        require(_tier >= 1 && _tier <= 3, "Invalid tier.");
        
        uint256 oldScore = agents[_agent].ais;
        agents[_agent].ais = _ais;
        agents[_agent].verificationTier = _tier;
        agents[_agent].lastUpdate = block.timestamp;
        
        emit AISUpdated(_agent, oldScore, _ais);
    }

    /**
     * @notice Stakes ITK tokens to the registry to boost AIS.
     */
    function stake(uint256 _amount) external nonReentrant {
        require(walletToToken[msg.sender] != 0, "Register agent first.");
        require(_amount > 0, "Invalid amount.");
        require(intgToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed.");
        
        agents[msg.sender].totalStaked += _amount;
        agents[msg.sender].lastUpdate = block.timestamp;
        
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Withdraws staked ITK tokens.
     */
    function unstake(uint256 _amount) external nonReentrant {
        require(agents[msg.sender].totalStaked >= _amount, "Insufficient stake.");
        
        agents[msg.sender].totalStaked -= _amount;
        agents[msg.sender].lastUpdate = block.timestamp;
        
        require(intgToken.transfer(msg.sender, _amount), "Transfer failed.");
        
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @notice Returns the profile for a specific agent.
     */
    function getAgent(address _agent) external view returns (AgentProfile memory) {
        return agents[_agent];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
