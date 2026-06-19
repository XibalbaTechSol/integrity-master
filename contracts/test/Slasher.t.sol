// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/Slasher.sol";
import "../src/oracle/ReputationRegistry.sol";

contract MockProtocol {
    struct Deal {
        address initiator;
        address performer;
        uint256 amount;
        bytes32 integrityHash;
        bool completed;
        bool exists;
    }
    mapping(bytes32 => Deal) public deals;

    function setDeal(bytes32 _dealId, address _initiator, address _performer, uint256 _amount, bytes32 _hash, bool _completed, bool _exists) external {
        deals[_dealId] = Deal(_initiator, _performer, _amount, _hash, _completed, _exists);
    }
}

contract SlasherTest is Test {
    Slasher slasher;
    MockProtocol protocol;
    address registry = address(0x2222);
    address owner = address(this);
    address initiator = address(0x111);
    address performer = address(0x222);
    bytes32 dealId = keccak256("deal1");

    function setUp() public {
        protocol = new MockProtocol();
        slasher = new Slasher(address(protocol), registry);
    }

    function testRaiseDispute() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(initiator);
        slasher.raiseDispute(dealId);

        (bytes32 dId, address init, address perf, uint256 stakeAtRisk, uint256 createdAt, bool resolved, bool justified) = slasher.disputes(dealId);
        assertEq(dId, dealId);
        assertEq(init, initiator);
        assertEq(perf, performer);
        assertEq(stakeAtRisk, 500);
        assertEq(createdAt, block.timestamp);
        assertFalse(resolved);
        assertFalse(justified);
    }

    function testRaiseDisputeNotExists() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, false);
        
        vm.prank(initiator);
        vm.expectRevert("Deal not found.");
        slasher.raiseDispute(dealId);
    }

    function testRaiseDisputeNotCompleted() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), false, true);
        
        vm.prank(initiator);
        vm.expectRevert("Deal must be completed to dispute performance.");
        slasher.raiseDispute(dealId);
    }

    function testRaiseDisputeNotInitiator() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(address(0x333));
        vm.expectRevert("Only initiator can dispute.");
        slasher.raiseDispute(dealId);
    }

    function testRaiseDisputeWindowClosed() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(initiator);
        slasher.raiseDispute(dealId);

        vm.warp(block.timestamp + 25 hours);

        vm.prank(initiator);
        vm.expectRevert("Window closed.");
        slasher.raiseDispute(dealId);
    }

    function testResolveDisputeJustified() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(initiator);
        slasher.raiseDispute(dealId);

        vm.expectEmit(true, true, false, true);
        emit Slasher.SlashExecuted(dealId, performer, 500);
        
        slasher.resolveDispute(dealId, true);

        (, , , , , bool resolved, bool justified) = slasher.disputes(dealId);
        assertTrue(resolved);
        assertTrue(justified);
    }

    function testResolveDisputeNotJustified() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(initiator);
        slasher.raiseDispute(dealId);
        
        slasher.resolveDispute(dealId, false);

        (, , , , , bool resolved, bool justified) = slasher.disputes(dealId);
        assertTrue(resolved);
        assertFalse(justified);
    }

    function testResolveDisputeNotFound() public {
        vm.expectRevert("Dispute not found.");
        slasher.resolveDispute(dealId, true);
    }

    function testResolveDisputeAlreadyResolved() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(initiator);
        slasher.raiseDispute(dealId);
        
        slasher.resolveDispute(dealId, true);

        vm.expectRevert("Already resolved.");
        slasher.resolveDispute(dealId, true);
    }

    function testResolveDisputeNotOwner() public {
        protocol.setDeal(dealId, initiator, performer, 1000, bytes32(0), true, true);
        
        vm.prank(initiator);
        slasher.raiseDispute(dealId);
        
        vm.prank(address(0x333));
        vm.expectRevert();
        slasher.resolveDispute(dealId, true);
    }

    function testSetChallengeWindow() public {
        slasher.setChallengeWindow(48 hours);
        assertEq(slasher.challengeWindow(), 48 hours);
    }

    function testSetChallengeWindowNotOwner() public {
        vm.prank(address(0x333));
        vm.expectRevert();
        slasher.setChallengeWindow(48 hours);
    }
}
