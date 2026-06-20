// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/IntegrityPaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "../src/core/IAccount.sol";

contract MockReputationRegistry is IReputationRegistry {
    mapping(address => uint256) public scores;

    function setScore(address agent, uint256 score) external {
        scores[agent] = score;
    }

    function getAgent(address _agent) external view returns (uint256 score, uint256 staked, bool verified, uint256 tier) {
        return (scores[_agent], 0, true, 1);
    }
}

contract IntegrityPaymasterTest is Test {
    using MessageHashUtils for bytes32;

    IntegrityPaymaster paymaster;
    MockReputationRegistry registry;
    address entryPoint = address(0x111);
    address signer;
    uint256 signerKey;

    function setUp() public {
        (signer, signerKey) = makeAddrAndKey("signer");
        registry = new MockReputationRegistry();
        paymaster = new IntegrityPaymaster(entryPoint, signer, address(registry));
    }

    function testSetOracleSigner() public {
        paymaster.setOracleSigner(address(0x222));
        assertEq(paymaster.oracleSigner(), address(0x222));
    }

    function testValidatePaymasterUserOp() public {
        UserOperation memory userOp;
        userOp.sender = address(0x444);
        registry.setScore(userOp.sender, 650);

        bytes32 userOpHash = keccak256("testHash");
        uint256 maxCost = 1000;

        bytes32 hash = keccak256(abi.encodePacked(userOpHash, block.chainid));
        bytes32 ethSignedMessageHash = hash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        userOp.paymasterAndData = abi.encodePacked(address(paymaster), signature);

        vm.prank(entryPoint);
        (bytes memory context, uint256 validationData) = paymaster.validatePaymasterUserOp(userOp, userOpHash, maxCost);

        assertEq(context, "");
        assertEq(validationData, 0);
    }

    function testValidatePaymasterUserOpNotEntryPoint() public {
        UserOperation memory userOp;
        vm.prank(address(0x555));
        vm.expectRevert("Paymaster: caller must be EntryPoint");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 0);
    }

    function testValidatePaymasterUserOpAISTooLow() public {
        UserOperation memory userOp;
        userOp.sender = address(0x444);
        registry.setScore(userOp.sender, 500);

        vm.prank(entryPoint);
        vm.expectRevert("AIS too low for sponsorship");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 0);
    }

    function testValidatePaymasterUserOpInvalidLength() public {
        UserOperation memory userOp;
        userOp.sender = address(0x444);
        registry.setScore(userOp.sender, 650);
        userOp.paymasterAndData = new bytes(84);

        vm.prank(entryPoint);
        vm.expectRevert("Invalid paymasterAndData length");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 0);
    }

    function testValidatePaymasterUserOpInvalidSignature() public {
        UserOperation memory userOp;
        userOp.sender = address(0x444);
        registry.setScore(userOp.sender, 650);

        bytes32 userOpHash = keccak256("testHash");
        
        (, uint256 wrongKey) = makeAddrAndKey("wrong");
        bytes32 hash = keccak256(abi.encodePacked(userOpHash, block.chainid));
        bytes32 ethSignedMessageHash = hash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        userOp.paymasterAndData = abi.encodePacked(address(paymaster), signature);

        vm.prank(entryPoint);
        (bytes memory context, uint256 validationData) = paymaster.validatePaymasterUserOp(userOp, userOpHash, 0);

        assertEq(context, "");
        assertEq(validationData, 1);
    }

    function testPostOp() public {
        paymaster.postOp(PostOpMode.opSucceeded, "", 0);
    }
}
