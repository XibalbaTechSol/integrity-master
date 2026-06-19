// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/IntegrityToken.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

contract IntegrityTokenTest is Test {
    IntegrityToken token;
    address owner = address(this);
    address alice = address(0x111);
    address bob = address(0x222);
    address validator = address(0x333);

    function setUp() public {
        token = new IntegrityToken(owner);
    }

    function testConstructor() public {
        assertEq(token.balanceOf(owner), token.MAX_SUPPLY() / 2);
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), owner));
    }

    function testMint() public {
        token.mint(alice, 1000);
        assertEq(token.balanceOf(alice), 1000);
    }

    function testMintZero() public {
        vm.expectRevert(IntegrityToken.ZeroAmount.selector);
        token.mint(alice, 0);
    }

    function testMintExceedsSupply() public {
        uint256 remaining = token.MAX_SUPPLY() - token.totalMinted();
        vm.expectRevert(abi.encodeWithSelector(IntegrityToken.ExceedsMaxSupply.selector, remaining + 1, remaining));
        token.mint(alice, remaining + 1);
    }

    function testAddRemoveValidator() public {
        token.addValidator(validator);
        assertTrue(token.hasRole(token.VALIDATOR_ROLE(), validator));

        token.removeValidator(validator);
        assertFalse(token.hasRole(token.VALIDATOR_ROLE(), validator));
    }

    function testRegisterAgent() public {
        token.addValidator(validator);
        vm.prank(validator);
        token.registerAgent(alice);
        assertTrue(token.hasRole(token.AGENT_ROLE(), alice));
    }

    function testStakeAndUnstake() public {
        token.mint(alice, 1000);
        
        vm.startPrank(alice);
        token.stake(500);
        
        assertEq(token.balanceOf(alice), 500);
        assertEq(token.balanceOf(address(token)), 500);
        assertEq(token.totalStaked(), 500);

        token.unstake(200);
        assertEq(token.balanceOf(alice), 700);
        assertEq(token.balanceOf(address(token)), 300);
        assertEq(token.totalStaked(), 300);
        vm.stopPrank();
    }

    function testStakeZero() public {
        vm.startPrank(alice);
        vm.expectRevert(IntegrityToken.ZeroAmount.selector);
        token.stake(0);
        vm.stopPrank();
    }

    function testUnstakeZero() public {
        vm.startPrank(alice);
        vm.expectRevert(IntegrityToken.ZeroAmount.selector);
        token.unstake(0);
        vm.stopPrank();
    }

    function testUnstakeInsufficient() public {
        token.mint(alice, 1000);
        vm.startPrank(alice);
        token.stake(500);
        vm.expectRevert(abi.encodeWithSelector(IntegrityToken.InsufficientStake.selector, 600, 500));
        token.unstake(600);
        vm.stopPrank();
    }

    function testSetFeeMultiplier() public {
        token.addValidator(validator);
        vm.prank(validator);
        token.setFeeMultiplier(2);
        assertEq(token.feeMultiplier(), 2);
    }

    function testSetFeeMultiplierOutOfRange() public {
        token.addValidator(validator);
        vm.prank(validator);
        vm.expectRevert("Multiplier out of range.");
        token.setFeeMultiplier(5);
    }

    function testTransferWithFee() public {
        token.transfer(alice, 10000);

        vm.startPrank(alice);
        token.transfer(bob, 10000);
        vm.stopPrank();

        assertEq(token.balanceOf(bob), 9950);
        assertEq(token.balanceOf(owner), token.MAX_SUPPLY() / 2 - 10000 + 25);
        assertEq(token.totalSupply(), token.MAX_SUPPLY() / 2 - 25);
    }
    
    function testTransferMaxFee() public {
        token.addValidator(validator);
        vm.prank(validator);
        token.setFeeMultiplier(4);

        token.transfer(alice, 10000);

        vm.startPrank(alice);
        token.transfer(bob, 10000);
        vm.stopPrank();

        assertEq(token.balanceOf(bob), 9800);
    }

    function testSupportsInterface() public {
        assertTrue(token.supportsInterface(type(IAccessControl).interfaceId));
    }
}
