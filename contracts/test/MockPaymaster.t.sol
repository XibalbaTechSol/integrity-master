// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/shield/MockPaymaster.sol";

contract MockPaymasterTest is Test {
    MockPaymaster public paymaster;
    address public owner = address(1);
    address public nonOwner = address(2);
    address public target = address(3);
    address public user = address(4);

    event GasSubsidized(address indexed user, address indexed target, uint256 amount);

    function setUp() public {
        vm.prank(owner);
        paymaster = new MockPaymaster();
    }

    function testApproveTarget() public {
        vm.prank(owner);
        paymaster.approveTarget(target);
        assertTrue(paymaster.approvedTargets(target));
    }

    function testApproveTargetNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        paymaster.approveTarget(target);
    }

    function testSubsidize() public {
        vm.prank(owner);
        paymaster.approveTarget(target);

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit GasSubsidized(user, target, 100);
        paymaster.subsidize(user, target, 100);
    }

    function testSubsidizeNotApproved() public {
        vm.prank(owner);
        vm.expectRevert("Target not approved for subsidy");
        paymaster.subsidize(user, target, 100);
    }

    function testSubsidizeNotOwner() public {
        vm.prank(owner);
        paymaster.approveTarget(target);

        vm.prank(nonOwner);
        vm.expectRevert();
        paymaster.subsidize(user, target, 100);
    }
}
