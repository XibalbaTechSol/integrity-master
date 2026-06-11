// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title XibalbaNameService (XNS)
 * @author Xibalba Solutions
 * @notice The decentralized naming service for the Xibalba Integrity Protocol.
 * Maps human-readable handles (e.g., 'hermes.intg') to agent Ethereum addresses.
 */
contract XibalbaNameService is AccessControl, ReentrancyGuard {
    
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct NameRecord {
        address owner;
        uint256 registeredAt;
        bool isRevoked;
    }

    // Mapping from handle to record (handle is lowercase, without .intg suffix if stored)
    mapping(string => NameRecord) public registry;
    // Mapping from address to handle (primary handle)
    mapping(address => string) public primaryHandle;

    event NameRegistered(string indexed handle, address indexed agent);
    event NameRevoked(string indexed handle, address indexed agent);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRAR_ROLE, _admin);
    }

    /**
     * @notice Registers a new .intg handle for an agent.
     * @param _handle The human-readable handle (e.g., "trader").
     * @param _agent The Ethereum address of the agent.
     */
    function register(string calldata _handle, address _agent) external onlyRole(REGISTRAR_ROLE) {
        require(registry[_handle].owner == address(0), "Handle already registered");
        require(_agent != address(0), "Invalid agent address");

        registry[_handle] = NameRecord({
            owner: _agent,
            registeredAt: block.timestamp,
            isRevoked: false
        });

        // Set as primary handle if they don't have one
        if (bytes(primaryHandle[_agent]).length == 0) {
            primaryHandle[_agent] = _handle;
        }

        emit NameRegistered(_handle, _agent);
    }

    /**
     * @notice Revokes a handle due to compromise or decommission.
     */
    function revoke(string calldata _handle) external onlyRole(REGISTRAR_ROLE) {
        address owner = registry[_handle].owner;
        require(owner != address(0), "Handle not found");
        
        registry[_handle].isRevoked = true;
        
        if (keccak256(bytes(primaryHandle[owner])) == keccak256(bytes(_handle))) {
            delete primaryHandle[owner];
        }

        emit NameRevoked(_handle, owner);
    }

    /**
     * @notice Resolves a handle to its current owner address.
     */
    function resolve(string calldata _handle) external view returns (address) {
        NameRecord memory record = registry[_handle];
        if (record.isRevoked) return address(0);
        return record.owner;
    }

    /**
     * @notice Returns the primary handle for an address.
     */
    function getPrimaryHandle(address _agent) external view returns (string memory) {
        return primaryHandle[_agent];
    }
}
