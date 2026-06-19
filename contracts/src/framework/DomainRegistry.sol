// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title DomainRegistry
 * @notice Cryptographically links an agent address to a verified web domain.
 * Mandatory for Tier 3 (Sovereign) status.
 */
contract DomainRegistry is AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // Mapping from agent address to verified domain
    mapping(address => string) public agentDomains;
    
    event DomainLinked(address indexed agent, string domain);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    /**
     * @notice Links an agent to a domain using an Oracle attestation.
     * @param _agent The address of the agent.
     * @param _domain The domain name (e.g., "xibalba.solutions").
     * @param _signature The Oracle signature over the (agent, domain) pair.
     */
    function linkDomain(
        address _agent, 
        string calldata _domain, 
        bytes calldata _signature
    ) external {
        bytes32 messageHash = keccak256(abi.encodePacked(_agent, _domain));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        address signer = ethSignedMessageHash.recover(_signature);
        require(hasRole(VALIDATOR_ROLE, signer), "Invalid Oracle signature.");

        agentDomains[_agent] = _domain;
        emit DomainLinked(_agent, _domain);
    }

    function getDomain(address _agent) external view returns (string memory) {
        return agentDomains[_agent];
    }
}
