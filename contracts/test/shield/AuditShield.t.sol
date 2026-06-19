// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {AuditShield} from "../../src/shield/AuditShield.sol";

contract AuditShieldTest is Test {
    AuditShield public shield;

    event LogAnchored(bytes32 indexed dataHash, address indexed agent, uint256 timestamp);

    function setUp() public {
        shield = new AuditShield();
    }

    function test_AnchorLog() public {
        bytes32 dataHash = keccak256("test data");
        address agent = address(this);
        uint256 currentTime = 1000;
        vm.warp(currentTime);
        
        vm.expectEmit(true, true, false, true);
        emit LogAnchored(dataHash, agent, currentTime);
        
        shield.anchorLog(dataHash);

        (bytes32 storedHash, address storedAgent, uint256 storedTimestamp) = shield.auditLogs(dataHash);
        
        assertEq(storedHash, dataHash);
        assertEq(storedAgent, agent);
        assertEq(storedTimestamp, currentTime);
    }

    function test_RevertWhen_LogAlreadyAnchored() public {
        bytes32 dataHash = keccak256("test data");
        shield.anchorLog(dataHash);

        vm.expectRevert("Log already anchored");
        shield.anchorLog(dataHash);
    }

    function testFuzz_AnchorLog(bytes32 dataHash, address agent, uint256 time) public {
        // Prevent block.timestamp from being 0 to correctly test the "already anchored" requirement.
        time = bound(time, 1, type(uint256).max);
        vm.warp(time);
        
        vm.prank(agent);
        
        vm.expectEmit(true, true, false, true);
        emit LogAnchored(dataHash, agent, time);
        
        shield.anchorLog(dataHash);

        (bytes32 storedHash, address storedAgent, uint256 storedTimestamp) = shield.auditLogs(dataHash);
        
        assertEq(storedHash, dataHash);
        assertEq(storedAgent, agent);
        assertEq(storedTimestamp, time);
    }

    function testFuzz_RevertWhen_LogAlreadyAnchored(bytes32 dataHash, address agent1, address agent2, uint256 time1, uint256 time2) public {
        time1 = bound(time1, 1, type(uint256).max);
        vm.warp(time1);

        vm.prank(agent1);
        shield.anchorLog(dataHash);

        vm.warp(time2);
        vm.prank(agent2);
        vm.expectRevert("Log already anchored");
        shield.anchorLog(dataHash);
    }
}
