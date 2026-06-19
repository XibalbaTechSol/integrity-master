// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CoveredEntityRegistry is Ownable {
    mapping(address => bool) public registeredEntities;
    mapping(address => string) public entityMetadata;

    event EntityRegistered(address indexed entity, string metadataURI);
    event EntityRevoked(address indexed entity);

    constructor() Ownable(msg.sender) {}

    function registerEntity(address entity, string memory metadataURI) external onlyOwner {
        registeredEntities[entity] = true;
        entityMetadata[entity] = metadataURI;
        emit EntityRegistered(entity, metadataURI);
    }

    function revokeEntity(address entity) external onlyOwner {
        registeredEntities[entity] = false;
        emit EntityRevoked(entity);
    }

    function isRegistered(address entity) external view returns (bool) {
        return registeredEntities[entity];
    }
}
