// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentSmartAccount.sol";

/**
 * @title AgentAccountFactory
 * @notice Factory for deploying AgentSmartAccount instances deterministically using CREATE2.
 */
contract AgentAccountFactory {
    address public immutable entryPoint;

    event AccountCreated(address indexed account, address indexed owner, uint256 salt);

    constructor(address _entryPoint) {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        entryPoint = _entryPoint;
    }

    /**
     * @notice Deploys an AgentSmartAccount using CREATE2.
     */
    function createAccount(address owner, uint256 salt) external returns (AgentSmartAccount ret) {
        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return AgentSmartAccount(payable(addr));
        }

        ret = new AgentSmartAccount{salt: bytes32(salt)}(entryPoint, owner);
        emit AccountCreated(address(ret), owner, salt);
    }

    /**
     * @notice Precomputes the address of an AgentSmartAccount.
     */
    function getAddress(address owner, uint256 salt) public view returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            bytes32(salt),
                            keccak256(
                                abi.encodePacked(
                                    type(AgentSmartAccount).creationCode,
                                    abi.encode(entryPoint, owner)
                                )
                            )
                        )
                    )
                )
            )
        );
    }
}
