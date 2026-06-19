// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/shield/ReputationSBT.sol";

contract ReputationSBTTest is Test {
    ReputationSBT public sbt;
    address public owner = address(1);
    address public nonOwner = address(2);
    address public user = address(3);
    address public user2 = address(4);

    event MetricsUpdated(uint256 indexed tokenId, uint8 accuracy, uint8 compliance, uint8 reliability, uint32 lastUpdated);

    function setUp() public {
        vm.prank(owner);
        sbt = new ReputationSBT();
    }

    function testMint() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit MetricsUpdated(0, 95, 99, 100, 0); 
        sbt.mint(user, 95, 99, 100);

        assertEq(sbt.ownerOf(0), user);
        (uint8 acc, uint8 comp, uint8 rel, uint32 updated) = sbt.agentMetrics(0);
        assertEq(acc, 95);
        assertEq(comp, 99);
        assertEq(rel, 100);
        assertEq(updated, uint32(block.timestamp));
    }

    function testMintNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        sbt.mint(user, 95, 99, 100);
    }

    function testUpdateMetrics() public {
        vm.prank(owner);
        sbt.mint(user, 95, 99, 100);

        vm.warp(block.timestamp + 100);

        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit MetricsUpdated(0, 96, 98, 99, 0);
        sbt.updateMetrics(0, 96, 98, 99);

        (uint8 acc, uint8 comp, uint8 rel, uint32 updated) = sbt.agentMetrics(0);
        assertEq(acc, 96);
        assertEq(comp, 98);
        assertEq(rel, 99);
        assertEq(updated, uint32(block.timestamp));
    }

    function testUpdateMetricsNonexistent() public {
        vm.prank(owner);
        vm.expectRevert("Nonexistent token");
        sbt.updateMetrics(0, 96, 98, 99);
    }

    function testUpdateMetricsNotOwner() public {
        vm.prank(owner);
        sbt.mint(user, 95, 99, 100);

        vm.prank(nonOwner);
        vm.expectRevert();
        sbt.updateMetrics(0, 96, 98, 99);
    }

    function testTokenURI() public {
        vm.prank(owner);
        sbt.mint(user, 95, 99, 100);

        string memory uri = sbt.tokenURI(0);
        assertTrue(bytes(uri).length > 0);
    }

    function testTokenURINonexistent() public {
        vm.expectRevert();
        sbt.tokenURI(0);
    }

    function testTransferSBTReverts() public {
        vm.prank(owner);
        sbt.mint(user, 95, 99, 100);

        vm.prank(user);
        vm.expectRevert("SBT: Transfer not allowed");
        sbt.transferFrom(user, user2, 0);
    }
}
