// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title OracleRegistry
 * @author Xibalba Solutions
 * @notice Registry of approved off-chain data sources (World Awareness Protocol).
 * Includes staking mechanics using the ITK token.
 */
contract OracleRegistry is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");

    IERC20 public immutable itkToken;
    uint256 public constant MIN_STAKE = 5000 * 10**18; // 5000 ITK

    struct OracleSource {
        address owner;
        string name;
        string uri;
        bool active;
        uint256 trustScore; // 0-1000
        uint256 stakedAmount;
    }

    mapping(uint256 => OracleSource) public sources;
    uint256 public sourceCount;

    event SourceAdded(uint256 indexed sourceId, string name, string uri, address indexed owner, uint256 staked);
    event SourceStatusChanged(uint256 indexed sourceId, bool active);
    event SourceScoreUpdated(uint256 indexed sourceId, uint256 newScore);
    event StakeAdded(uint256 indexed sourceId, uint256 amount);
    event StakeWithdrawn(uint256 indexed sourceId, uint256 amount);

    constructor(address _admin, address _itkToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CURATOR_ROLE, _admin);
        itkToken = IERC20(_itkToken);
    }

    function registerOracleNode(string calldata _name, string calldata _uri, uint256 _stakeAmount) external {
        require(_stakeAmount >= MIN_STAKE, "Insufficient stake collateral");

        // Transfer ITK from the caller to this contract
        itkToken.safeTransferFrom(msg.sender, address(this), _stakeAmount);

        uint256 sourceId = ++sourceCount;
        sources[sourceId] = OracleSource({
            owner: msg.sender,
            name: _name,
            uri: _uri,
            active: true,
            trustScore: 800, // Default trust score
            stakedAmount: _stakeAmount
        });

        emit SourceAdded(sourceId, _name, _uri, msg.sender, _stakeAmount);
    }

    function addSource(string calldata _name, string calldata _uri) external onlyRole(CURATOR_ROLE) {
        uint256 sourceId = ++sourceCount;
        sources[sourceId] = OracleSource({
            owner: msg.sender,
            name: _name,
            uri: _uri,
            active: true,
            trustScore: 800,
            stakedAmount: 0 // Curators can add without stake for now
        });
        emit SourceAdded(sourceId, _name, _uri, msg.sender, 0);
    }

    function setSourceStatus(uint256 _sourceId, bool _active) external onlyRole(CURATOR_ROLE) {
        require(_sourceId <= sourceCount, "Invalid sourceId");
        sources[_sourceId].active = _active;
        emit SourceStatusChanged(_sourceId, _active);
    }

    function updateSourceScore(uint256 _sourceId, uint256 _newScore) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_sourceId <= sourceCount, "Invalid sourceId");
        require(_newScore <= 1000, "Score out of bounds");
        sources[_sourceId].trustScore = _newScore;
        emit SourceScoreUpdated(_sourceId, _newScore);
    }

    function isSourceActive(uint256 _sourceId) external view returns (bool) {
        return sources[_sourceId].active;
    }
}
