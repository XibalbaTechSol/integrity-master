// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IntegrityPaymaster.sol";

interface IAccount {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

/**
 * @title AgentSmartAccount
 * @notice An ERC-4337 compliant smart account representing an individual AI Agent's identity.
 */
contract AgentSmartAccount is IAccount {
    address public immutable entryPoint;
    address public owner;

    event AgentExecuted(address indexed target, uint256 value, bytes data);

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "AgentSmartAccount: caller must be EntryPoint");
        _;
    }

    constructor(address _entryPoint, address _owner) {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        require(_owner != address(0), "Invalid Owner");
        entryPoint = _entryPoint;
        owner = _owner;
    }

    /**
     * @notice Validates the signature of the UserOperation.
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        // Standard EIP-191 / ERC-1271 compatible signature verification
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
        );

        address recovered = recoverSigner(ethSignedMessageHash, userOp.signature);
        if (recovered != owner) {
            return 1; // Validation failed (SIG_VALIDATION_FAILED)
        }

        // Prefund EntryPoint if it's missing funds and no paymaster is defined
        if (missingAccountFunds > 0) {
            payable(entryPoint).transfer(missingAccountFunds);
        }

        return 0; // Validation succeeded (SIG_VALIDATION_SUCCESS)
    }

    /**
     * @notice Allows the EntryPoint to execute arbitrary operations on behalf of the smart account.
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyEntryPoint {
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit AgentExecuted(dest, value, func);
    }

    /**
     * @dev Helper to recover address from signature.
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _sig) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_sig);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    /**
     * @dev Helper to split signature.
     */
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    receive() external payable {}
}
