// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/shield/EHRGate.sol";

contract EHRGateTest is Test {
    EHRGate public gate;

    address public patient = address(1);
    address public agent = address(2);
    bytes32 public recordHash = keccak256(abi.encodePacked("test_ehr_record_001"));

    function setUp() public {
        gate = new EHRGate();
    }

    function testGrantAccess() public {
        vm.prank(patient);
        gate.grantAccess(recordHash, agent);

        vm.prank(agent);
        bool isUnlocked = gate.checkAccess(patient, recordHash);
        assertTrue(isUnlocked, "Gate should be unlocked after grant");
    }

    function testRevokeAccess() public {
        vm.prank(patient);
        gate.grantAccess(recordHash, agent);
        
        vm.prank(agent);
        bool isUnlocked = gate.checkAccess(patient, recordHash);
        assertTrue(isUnlocked, "Gate should be unlocked");

        vm.prank(patient);
        gate.revokeAccess(recordHash, agent);
        
        vm.prank(agent);
        isUnlocked = gate.checkAccess(patient, recordHash);
        assertFalse(isUnlocked, "Gate should be locked after revoke");
    }

    function testCannotRevokeLockedGate() public {
        vm.prank(patient);
        vm.expectRevert("EHRGate: Access is already locked");
        gate.revokeAccess(recordHash, agent);
    }

    function testVerifyAndLogAccessSuccess() public {
        vm.prank(patient);
        gate.grantAccess(recordHash, agent);

        vm.prank(agent);
        bool hasAccess = gate.verifyAndLogAccess(patient, recordHash);
        assertTrue(hasAccess, "Verify should return true");
    }

    function testVerifyAndLogAccessFailure() public {
        vm.prank(agent);
        bool hasAccess = gate.verifyAndLogAccess(patient, recordHash);
        assertFalse(hasAccess, "Verify should return false for locked gate");
    }
}
