// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract BehavioralCommitment is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct Commitment {
        address agentId;          // Identifier for the AI agent
        uint256 timestamp;        // Timestamp of the commitment
        bytes32 actionHash;       // Cryptographic hash of the intended action and reasoning
        bytes32 policyHash;       // Hash of the HIPAA compliance policy
        bool isValid;             // Boolean indicating if the commitment was validated against policies
    }

    // Mapping from agentId to an array of their commitments
    mapping(address => Commitment[]) public commitments;

    event ActionCommitted(address indexed agentId, uint256 indexed commitmentIndex, bytes32 actionHash, bytes32 policyHash, uint256 timestamp);
    event CommitmentValidityUpdated(address indexed agentId, uint256 indexed commitmentIndex, bool isValid);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // In a real deployment, AGENT_ROLE and ORACLE_ROLE would be granted to specific addresses
        // by the deployer or a multi-sig wallet after deployment.
        // For development, we'll assume the deployer can assign roles.
    }

    /**
     * @notice Allows an authorized AI agent to commit to an action.
     * @param _actionHash Cryptographic hash of the intended action and reasoning.
     * @param _policyHash Hash of the HIPAA compliance policy.
     */
    function commitAction(bytes32 _actionHash, bytes32 _policyHash) public onlyRole(AGENT_ROLE) {
        // Devil's Advocate Note: Consider preventing duplicate (actionHash, policyHash) pairs within a short timeframe
        // to guard against simple replay attacks or spamming.

        uint256 commitmentIndex = commitments[msg.sender].length;
        commitments[msg.sender].push(Commitment(
            msg.sender,
            block.timestamp,
            _actionHash,
            _policyHash,
            false // Initially set to false, awaiting Oracle validation
        ));

        emit ActionCommitted(msg.sender, commitmentIndex, _actionHash, _policyHash, block.timestamp);
    }

    /**
     * @notice Allows an authorized Oracle/Policy Enforcement Point to update the validity of a commitment.
     * @param _agentId The address of the AI agent who made the commitment.
     * @param _commitmentIndex The index of the commitment in the agent's commitment array.
     * @param _isValid The new validity status of the commitment.
     */
    function updateCommitmentValidity(address _agentId, uint256 _commitmentIndex, bool _isValid) public onlyRole(ORACLE_ROLE) {
        require(_agentId != address(0), "Invalid agent address");
        require(_commitmentIndex < commitments[_agentId].length, "Commitment index out of bounds");

        // Devil's Advocate Note: Ensure this function is not susceptible to front-running or race conditions
        // if multiple oracles could potentially update the same commitment. For this MVP, we assume a single trusted Oracle.

        commitments[_agentId][_commitmentIndex].isValid = _isValid;

        emit CommitmentValidityUpdated(_agentId, _commitmentIndex, _isValid);
    }

    /**
     * @notice Retrieves a specific commitment for an AI agent.
     * @param _agentId The address of the AI agent.
     * @param _index The index of the commitment.
     * @return The Commitment struct.
     */
    function getCommitment(address _agentId, uint256 _index) public view returns (Commitment memory) {
        require(_agentId != address(0), "Invalid agent address");
        require(_index < commitments[_agentId].length, "Commitment index out of bounds");
        return commitments[_agentId][_index];
    }

    // Helper functions to grant and revoke roles (only for DEFAULT_ADMIN_ROLE)
    function grantAgentRole(address _agent) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(AGENT_ROLE, _agent);
    }

    function revokeAgentRole(address _agent) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(AGENT_ROLE, _agent);
    }

    function grantOracleRole(address _oracle) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, _oracle);
    }

    function revokeOracleRole(address _oracle) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ORACLE_ROLE, _oracle);
    }
}
