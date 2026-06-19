// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/shield/StakingReputation.sol";
import "./mocks/MockERC20.sol";

contract StakingReputationTest is Test {
    StakingReputation public vault;
    MockERC20 public token;
    address public owner = address(1);
    address public nonOwner = address(2);
    address public factory = address(3);
    address public baa = address(4);
    address public agent = address(5);
    address public ce = address(6);

    event Staked(address indexed agent, uint256 amount);
    event Withdrawn(address indexed agent, uint256 amount);
    event Slashed(address indexed agent, uint256 amount, address recipient, string reason);
    event LiabilityPledged(address indexed agent, uint256 amount);
    event LiabilityReleased(address indexed agent, uint256 amount);

    function setUp() public {
        token = new MockERC20();
        vm.prank(owner);
        vault = new StakingReputation(address(token));

        token.mint(agent, 10000);
        vm.prank(agent);
        token.approve(address(vault), type(uint256).max);
    }

    function testSetFactoryAddress() public {
        vm.prank(owner);
        vault.setFactoryAddress(factory);
        assertEq(vault.factoryAddress(), factory);
    }

    function testSetFactoryAddressNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        vault.setFactoryAddress(factory);
    }

    function testSetAuthorizedBAA() public {
        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);
        assertTrue(vault.authorizedBAAs(baa));
    }

    function testSetAuthorizedBAANotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        vault.setAuthorizedBAA(baa, true);
    }

    function testRegisterBAA() public {
        vm.prank(owner);
        vault.setFactoryAddress(factory);

        vm.prank(factory);
        vault.registerBAA(baa);
        assertTrue(vault.authorizedBAAs(baa));
    }

    function testRegisterBAANotFactory() public {
        vm.prank(owner);
        vault.setFactoryAddress(factory);

        vm.prank(nonOwner);
        vm.expectRevert("Only factory can register BAAs");
        vault.registerBAA(baa);
    }

    function testStake() public {
        vm.prank(agent);
        vm.expectEmit(true, false, false, true);
        emit Staked(agent, 1000);
        vault.stake(1000);

        assertEq(vault.stakes(agent), 1000);
        assertEq(token.balanceOf(address(vault)), 1000);
    }

    function testWithdraw() public {
        vm.startPrank(agent);
        vault.stake(1000);

        vm.expectEmit(true, false, false, true);
        emit Withdrawn(agent, 500);
        vault.withdraw(500);
        vm.stopPrank();

        assertEq(vault.stakes(agent), 500);
    }

    function testWithdrawInsufficientFreeStake() public {
        vm.startPrank(agent);
        vault.stake(1000);
        vm.stopPrank();

        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vault.pledgeLiability(agent, 800);

        vm.prank(agent);
        vm.expectRevert("Insufficient free stake");
        vault.withdraw(300);
    }

    function testPledgeLiability() public {
        vm.prank(agent);
        vault.stake(1000);

        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vm.expectEmit(true, false, false, true);
        emit LiabilityPledged(agent, 500);
        vault.pledgeLiability(agent, 500);

        assertEq(vault.totalPledgedLiability(agent), 500);
    }

    function testPledgeLiabilityNotAuthorized() public {
        vm.prank(baa);
        vm.expectRevert("Not an authorized BAA");
        vault.pledgeLiability(agent, 500);
    }

    function testPledgeLiabilityInsufficientStake() public {
        vm.prank(agent);
        vault.stake(1000);

        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vm.expectRevert("Insufficient global stake");
        vault.pledgeLiability(agent, 1500);
    }

    function testReleaseLiability() public {
        vm.prank(agent);
        vault.stake(1000);

        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vault.pledgeLiability(agent, 500);

        vm.prank(baa);
        vm.expectEmit(true, false, false, true);
        emit LiabilityReleased(agent, 200);
        vault.releaseLiability(agent, 200);

        assertEq(vault.totalPledgedLiability(agent), 300);
    }

    function testReleaseLiabilityNotAuthorized() public {
        vm.prank(baa);
        vm.expectRevert("Not an authorized BAA");
        vault.releaseLiability(agent, 200);
    }

    function testReleaseLiabilityUnderflow() public {
        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vm.expectRevert("Liability underflow");
        vault.releaseLiability(agent, 200);
    }

    function testSlashFromBAA() public {
        vm.prank(agent);
        vault.stake(1000);

        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vault.pledgeLiability(agent, 500);

        vm.prank(baa);
        vm.expectEmit(true, false, false, true);
        emit Slashed(agent, 500, ce, "reason");
        vault.slashFromBAA(agent, 500, ce, "reason");

        assertEq(vault.stakes(agent), 500);
        assertEq(vault.totalPledgedLiability(agent), 0);
        assertEq(token.balanceOf(ce), 500);
    }

    function testSlashFromBAANotAuthorized() public {
        vm.prank(baa);
        vm.expectRevert("Not an authorized BAA");
        vault.slashFromBAA(agent, 500, ce, "reason");
    }

    function testSlashFromBAAInsufficientStake() public {
        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vm.expectRevert("Insufficient stake to slash");
        vault.slashFromBAA(agent, 500, ce, "reason");
    }

    function testSlashFromBAAExceedsLiability() public {
        vm.prank(agent);
        vault.stake(1000);

        vm.prank(owner);
        vault.setAuthorizedBAA(baa, true);

        vm.prank(baa);
        vault.pledgeLiability(agent, 400);

        vm.prank(baa);
        vm.expectRevert("Slash exceeds pledged liability");
        vault.slashFromBAA(agent, 500, ce, "reason");
    }

    function testSlash() public {
        vm.prank(agent);
        vault.stake(1000);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit Slashed(agent, 500, address(0), "global");
        vault.slash(agent, 500, "global");

        assertEq(vault.stakes(agent), 500);
    }

    function testSlashNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        vault.slash(agent, 500, "global");
    }

    function testSlashInsufficientStake() public {
        vm.prank(owner);
        vm.expectRevert("Insufficient stake to slash");
        vault.slash(agent, 500, "global");
    }
}
