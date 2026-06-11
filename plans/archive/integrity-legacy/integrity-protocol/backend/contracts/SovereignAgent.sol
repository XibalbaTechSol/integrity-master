// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title SovereignAgent
 * @author Xibalba Solutions
 * @notice An individual, on-chain identity for an AI agent.
 * Tied to an Identity NFT from the AgentFactory.
 */
contract SovereignAgent is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    string public agentAlias;
    uint256 public ais;
    uint256 public tier;
    uint256 public identityTokenId;
    address public factory;

    event AISUpdated(uint256 newScore, uint256 newTier);
    event ControllerRotated(address indexed oldController, address indexed newController);

    constructor(string memory _alias, address _controller, address _initialOracle, uint256 _tokenId, address _factory) {
        agentAlias = _alias;
        factory = _factory;
        identityTokenId = _tokenId;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _controller);
        _grantRole(ORACLE_ROLE, _initialOracle);
        ais = 300; // Baseline
        tier = 1;
    }

    /**
     * @notice Ensures that only the current holder of the Identity NFT can manage keys.
     */
    modifier onlyNFTHolder() {
        require(IERC721(factory).ownerOf(identityTokenId) == msg.sender, "Caller does not own the Identity NFT.");
        _;
    }

    function updateAIS(uint256 _ais, uint256 _tier) external onlyRole(ORACLE_ROLE) {
        require(_ais >= 300 && _ais <= 1000, "AIS out of bounds");
        ais = _ais;
        tier = _tier;
        emit AISUpdated(_ais, _tier);
    }

    /**
     * @notice Rotates control to a new wallet. Only possible by the NFT holder.
     */
    function rotateController(address _newController) external onlyNFTHolder {
        _grantRole(DEFAULT_ADMIN_ROLE, _newController);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        emit ControllerRotated(msg.sender, _newController);
    }
}
