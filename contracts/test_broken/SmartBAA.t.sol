// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/shield/SmartBAA.sol";
import "../src/shield/StakingReputation.sol";
import "./mocks/MockERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SmartBAATest is Test {
    SmartBAA public baaIsolated;
    SmartBAA public baaPooled;
    MockERC20 public token;
    StakingReputation public vault;

    address public ce = address(1);
    address public ba = address(2);
    address public notRelated = address(3);

    event BAASigned(address indexed ba, SmartBAA.EscrowType escrowType);
    event BAARevoked(address indexed ce);
    event Slashed(address indexed ba, uint256 amount);

    function setUp() public {
        token = new MockERC20();
        vault = new StakingReputation(address(token));

        baaIsolated = new SmartBAA(
            ce,
            ba,
            "hash",
            bytes32(0),
            1000,
            address(token),
            address(vault)
        );

        baaPooled = new SmartBAA(
            ce,
            ba,
            "hash",
            bytes32(0),
            1000,
            address(token),
            address(vault)
        );

        token.mint(ba, 10000);
        vm.startPrank(ba);
        token.approve(address(baaIsolated), type(uint256).max);
        token.approve(address(vault), type(uint256).max);
        vault.stake(5000);
        vm.stopPrank();

        vault.setAuthorizedBAA(address(baaPooled), true);
    }

    function testSignBAAIsolated() public {
        vm.prank(ba);
        vm.expectEmit(true, false, false, true);
        emit BAASigned(ba, SmartBAA.EscrowType.ISOLATED);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);

        assertTrue(baaIsolated.isActive());
        assertEq(token.balanceOf(address(baaIsolated)), 1000);
    }

    function testSignBAAPooled() public {
        vm.prank(ba);
        vm.expectEmit(true, false, false, true);
        emit BAASigned(ba, SmartBAA.EscrowType.POOLED);
        baaPooled.signBAA(SmartBAA.EscrowType.POOLED);

        assertTrue(baaPooled.isActive());
        assertEq(vault.totalPledgedLiability(ba), 1000);
    }

    function testSignBAANotBA() public {
        vm.prank(notRelated);
        vm.expectRevert("Only Business Associate");
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);
    }

    function testSignBAAAlreadyActive() public {
        vm.startPrank(ba);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);

        vm.expectRevert("Already active");
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);
        vm.stopPrank();
    }

    function testRevokeIsolated() public {
        vm.prank(ba);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);

        uint256 balBefore = token.balanceOf(ba);
        vm.prank(ce);
        vm.expectEmit(true, false, false, false);
        emit BAARevoked(ce);
        baaIsolated.revoke();

        assertFalse(baaIsolated.isActive());
        assertEq(token.balanceOf(ba), balBefore + 1000);
    }

    function testRevokeIsolatedNoBalance() public {
        SmartBAA baaZero = new SmartBAA(ce, ba, "hash", bytes32(0), 0, address(token), address(vault));
        vm.prank(ba);
        baaZero.signBAA(SmartBAA.EscrowType.ISOLATED);
        
        vm.prank(ce);
        baaZero.revoke();
        assertFalse(baaZero.isActive());
    }

    function testRevokePooled() public {
        vm.prank(ba);
        baaPooled.signBAA(SmartBAA.EscrowType.POOLED);

        vm.prank(ce);
        baaPooled.revoke();

        assertFalse(baaPooled.isActive());
        assertEq(vault.totalPledgedLiability(ba), 0);
    }

    function testRevokeNotCE() public {
        vm.prank(ba);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);

        vm.prank(notRelated);
        vm.expectRevert("Only Covered Entity");
        baaIsolated.revoke();
    }

    function testRevokeNotActive() public {
        vm.prank(ce);
        vm.expectRevert("Already inactive");
        baaIsolated.revoke();
    }

    function testSlashIsolated() public {
        vm.prank(ba);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);

        uint256 balBefore = token.balanceOf(ce);
        vm.prank(ce);
        vm.expectEmit(true, false, false, true);
        emit Slashed(ba, 1000);
        baaIsolated.slash();

        assertFalse(baaIsolated.isActive());
        assertEq(token.balanceOf(ce), balBefore + 1000);
    }

    function testSlashIsolatedInsufficient() public {
        vm.prank(ba);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);
        
        vm.mockCall(
            address(token),
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(baaIsolated)),
            abi.encode(0)
        );

        vm.prank(ce);
        vm.expectRevert("Insufficient isolated collateral");
        baaIsolated.slash();
    }

    function testSlashPooled() public {
        vm.prank(ba);
        baaPooled.signBAA(SmartBAA.EscrowType.POOLED);

        uint256 balBefore = token.balanceOf(ce);
        vm.prank(ce);
        vm.expectEmit(true, false, false, true);
        emit Slashed(ba, 1000);
        baaPooled.slash();

        assertFalse(baaPooled.isActive());
        assertEq(vault.totalPledgedLiability(ba), 0);
        assertEq(token.balanceOf(ce), balBefore + 1000);
    }

    function testSlashNotActive() public {
        vm.prank(ce);
        vm.expectRevert("BAA not active");
        baaIsolated.slash();
    }

    function testSlashNotCE() public {
        vm.prank(ba);
        baaIsolated.signBAA(SmartBAA.EscrowType.ISOLATED);

        vm.prank(notRelated);
        vm.expectRevert("Only Covered Entity");
        baaIsolated.slash();
    }
}
