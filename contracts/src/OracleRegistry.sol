// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OracleRegistry
 * @author Xibalba Solutions
 * @notice Registry of approved off-chain data sources (World Awareness Protocol).
 */
contract OracleRegistry is AccessControl {
    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");

    struct OracleSource {
        string name;
        string uri;
        bool active;
        uint256 trustScore; // 0-1000
    }

    mapping(uint256 => OracleSource) public sources;
    uint256 public sourceCount;

    event SourceAdded(uint256 indexed sourceId, string name, string uri);
    event SourceStatusChanged(uint256 indexed sourceId, bool active);
    event SourceScoreUpdated(uint256 indexed sourceId, uint256 newScore);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CURATOR_ROLE, _admin);
    }

    function addSource(string calldata _name, string calldata _uri) external onlyRole(CURATOR_ROLE) {
        uint256 sourceId = ++sourceCount;
        sources[sourceId] = OracleSource({
            name: _name,
            uri: _uri,
            active: true,
            trustScore: 800 // Default trust score
        });
        emit SourceAdded(sourceId, _name, _uri);
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
