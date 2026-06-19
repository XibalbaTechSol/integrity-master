// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EnterpriseRegistry
 * @notice Links agents to verified business entities.
 * Mandatory for Tier 2 (Institutional) status.
 */
contract EnterpriseRegistry is Ownable {

    struct Enterprise {
        address admin;
        string name;
        string jurisdiction;
        bool isActive;
    }

    uint256 public enterpriseCount;
    mapping(uint256 => Enterprise) public enterprises;
    
    // Mapping from agent address to Enterprise ID
    mapping(address => uint256) public agentToEnterprise;
    
    // Mapping from agent address to VC hash (W3C Verifiable Credential anchor)
    mapping(address => bytes32) public agentVCHashes;

    event EnterpriseRegistered(uint256 indexed enterpriseId, string name, address admin);
    event AgentLinkedToEnterprise(uint256 indexed enterpriseId, address indexed agent);
    event EnterpriseVCAnchored(address indexed agent, bytes32 vcHash);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Registers a new enterprise entity.
     */
    function registerEnterprise(string calldata _name, string calldata _jurisdiction) external returns (uint256) {
        uint256 id = ++enterpriseCount;
        enterprises[id] = Enterprise({
            admin: msg.sender,
            name: _name,
            jurisdiction: _jurisdiction,
            isActive: true
        });

        emit EnterpriseRegistered(id, _name, msg.sender);
        return id;
    }

    /**
     * @notice Direct on-chain association (Master-Subordinate).
     */
    function addAgent(uint256 _enterpriseId, address _agent) external {
        require(enterprises[_enterpriseId].admin == msg.sender, "Only Enterprise admin.");
        require(enterprises[_enterpriseId].isActive, "Enterprise inactive.");

        agentToEnterprise[_agent] = _enterpriseId;
        emit AgentLinkedToEnterprise(_enterpriseId, _agent);
    }

    /**
     * @notice Anchors a Verifiable Credential hash for off-chain enterprise association.
     */
    function anchorEnterpriseVC(address _agent, bytes32 _vcHash) external {
        // Can be called by agent or Enterprise admin to anchor proof of association
        agentVCHashes[_agent] = _vcHash;
        emit EnterpriseVCAnchored(_agent, _vcHash);
    }

    function getEnterprise(uint256 _id) external view returns (Enterprise memory) {
        return enterprises[_id];
    }
}
