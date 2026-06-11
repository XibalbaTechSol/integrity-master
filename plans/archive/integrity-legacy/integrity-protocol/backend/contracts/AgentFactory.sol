// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./SovereignAgent.sol";

/**
 * @title AgentFactory
 * @author Xibalba Solutions
 * @notice Factory for deploying individual SovereignAgent identities and minting Identity NFTs.
 */
contract AgentFactory is ERC721 {
    uint256 private _nextTokenId;
    address[] public allAgents;
    
    // Mapping from tokenId to the actual agent contract address
    mapping(uint256 => address) public tokenToAgent;

    event AgentRegistered(address indexed agentContract, address indexed controller, uint256 indexed tokenId, string agentAlias);
    event Vouched(address indexed parent, address indexed child);

    constructor() ERC721("Xibalba Agent Identity", "XID") {}

    /**
     * @notice Creates a new SovereignAgent and mints an Identity NFT to the sender.
     * @param _alias The friendly name of the agent.
     * @param _oracle The initial authorized oracle.
     * @param _vouchFor Optional: The address of a parent agent vouching for this one.
     */
    function createAgent(string memory _alias, address _oracle, address _vouchFor) external returns (address) {
        uint256 tokenId = _nextTokenId++;
        
        SovereignAgent newAgent = new SovereignAgent(_alias, msg.sender, _oracle, tokenId, address(this));
        address agentAddr = address(newAgent);
        
        allAgents.push(agentAddr);
        tokenToAgent[tokenId] = agentAddr;
        
        _safeMint(msg.sender, tokenId);

        if (_vouchFor != address(0)) {
            // Inheritance logic: parent must own an XID NFT to vouch
            require(balanceOf(_vouchFor) > 0, "Only registered entities can vouch.");
            emit Vouched(_vouchFor, agentAddr);
        }
        
        emit AgentRegistered(agentAddr, msg.sender, tokenId, _alias);
        return agentAddr;
    }

    function getAgentCount() external view returns (uint256) {
        return allAgents.length;
    }

    /**
     * @notice Returns the agent contract associated with an NFT.
     */
    function getAgentByToken(uint256 _tokenId) external view returns (address) {
        return tokenToAgent[_tokenId];
    }
}
