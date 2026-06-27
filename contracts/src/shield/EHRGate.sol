// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title EHRGate
 * @dev Patient-controlled cryptographic gates governing PHI routing to SovereignAgents.
 * Designed to enforce Zero-Trust EHR Access inside the Xibalba Shield.
 */
contract EHRGate {
    struct Gate {
        bytes32 recordHash;
        address authorizedAgent;
        bool isUnlocked;
        uint256 grantedAt;
    }

    // Patient Address => Record Hash => Agent Address => Gate
    mapping(address => mapping(bytes32 => mapping(address => Gate))) public accessGates;

    event AccessGranted(address indexed patient, bytes32 indexed recordHash, address indexed agent);
    event AccessRevoked(address indexed patient, bytes32 indexed recordHash, address indexed agent);
    event AccessLogged(address indexed patient, bytes32 indexed recordHash, address indexed agent, bool successful);

    /**
     * @dev Patient explicitly grants access to an AI agent for a specific medical record.
     * @param recordHash The SHA-256 hash of the specific EHR document.
     * @param agent The on-chain address of the SovereignAgent.
     */
    function grantAccess(bytes32 recordHash, address agent) external {
        accessGates[msg.sender][recordHash][agent] = Gate({
            recordHash: recordHash,
            authorizedAgent: agent,
            isUnlocked: true,
            grantedAt: block.timestamp
        });

        emit AccessGranted(msg.sender, recordHash, agent);
    }

    /**
     * @dev Patient instantly revokes the access gate for an AI agent.
     * @param recordHash The SHA-256 hash of the specific EHR document.
     * @param agent The on-chain address of the SovereignAgent.
     */
    function revokeAccess(bytes32 recordHash, address agent) external {
        require(accessGates[msg.sender][recordHash][agent].isUnlocked, "EHRGate: Access is already locked");
        
        accessGates[msg.sender][recordHash][agent].isUnlocked = false;

        emit AccessRevoked(msg.sender, recordHash, agent);
    }

    /**
     * @dev Called by the SovereignAgent to cryptographically verify if it has active clearance
     * to perform Zero-Knowledge inference on the record.
     * @param patient The patient's wallet address.
     * @param recordHash The SHA-256 hash of the requested EHR document.
     * @return bool True if the gate is unlocked, false otherwise.
     */
    function checkAccess(address patient, bytes32 recordHash) public view returns (bool) {
        return accessGates[patient][recordHash][msg.sender].isUnlocked;
    }

    /**
     * @dev Called by the SovereignAgent before performing off-chain inference.
     * Emits a log that the Shield Command Center UI tracks for auditability.
     * @param patient The patient's wallet address.
     * @param recordHash The SHA-256 hash of the requested EHR document.
     */
    function verifyAndLogAccess(address patient, bytes32 recordHash) external returns (bool) {
        bool isGranted = checkAccess(patient, recordHash);
        
        emit AccessLogged(patient, recordHash, msg.sender, isGranted);
        
        return isGranted;
    }
}
