// SPDX-License-Identifier: MIT
// @title SmartBAA Isolated Test Suite
// @notice Validates the SmartBAA contract in isolation. Tracks issue #N.
// @dev Run with: forge test --match-contract SmartBAA_IsolatedTest -vvv

pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {SmartBAA} from "../../src/shield/SmartBAA.sol";
import {StakingReputation} from "../../src/shield/StakingReputation.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract SmartBAA_IsolatedTest is Test {
    SmartBAA public smartBAA;
    MockERC20 public itkToken;
    StakingReputation public stakingVault;

    address public ce = address(0x1);
    address public ba = address(0x2);
    string public agreementHash = "ipfs://Qm...";
    bytes32 public allowedScope = keccak256("HIPAA_COMPLIANT");
    uint256 public requiredCollateral = 1000 * 10**18;

    function setUp() public {
        itkToken = new MockERC20("Integrity Token", "ITK", 18);
        stakingVault = new StakingReputation(address(itkToken));

        smartBAA = new SmartBAA(
            ce,
            ba,
            agreementHash,
            allowedScope,
            requiredCollateral,
            address(itkToken),
            address(stakingVault)
        );

        itkToken.mint(ba, requiredCollateral * 2);
    }

    function test_SignBAA_Isolated() public {
        vm.startPrank(ba);
        itkToken.approve(address(smartBAA), requiredCollateral);
        smartBAA.signBAA(SmartBAA.EscrowType.ISOLATED);
        vm.stopPrank();

        assertTrue(smartBAA.isActive());
        assertEq(uint256(smartBAA.escrowType()), uint256(SmartBAA.EscrowType.ISOLATED));
        assertEq(itkToken.balanceOf(address(smartBAA)), requiredCollateral);
    }

    function test_Revoke_Isolated() public {
        // Sign first
        vm.startPrank(ba);
        itkToken.approve(address(smartBAA), requiredCollateral);
        smartBAA.signBAA(SmartBAA.EscrowType.ISOLATED);
        vm.stopPrank();

        // Revoke
        vm.prank(ce);
        smartBAA.revoke();

        assertFalse(smartBAA.isActive());
        assertEq(itkToken.balanceOf(ba), requiredCollateral * 2);
        assertEq(itkToken.balanceOf(address(smartBAA)), 0);
    }

    function test_Slash_Isolated() public {
        // Sign first
        vm.startPrank(ba);
        itkToken.approve(address(smartBAA), requiredCollateral);
        smartBAA.signBAA(SmartBAA.EscrowType.ISOLATED);
        vm.stopPrank();

        // Slash
        vm.prank(ce);
        smartBAA.slash();

        assertFalse(smartBAA.isActive());
        assertEq(itkToken.balanceOf(ce), requiredCollateral);
        assertEq(itkToken.balanceOf(address(smartBAA)), 0);
    }

    function test_OnlyBA_CanSign() public {
        vm.prank(ce);
        vm.expectRevert("Only Business Associate");
        smartBAA.signBAA(SmartBAA.EscrowType.ISOLATED);
    }

    function test_OnlyCE_CanRevoke() public {
        vm.startPrank(ba);
        itkToken.approve(address(smartBAA), requiredCollateral);
        smartBAA.signBAA(SmartBAA.EscrowType.ISOLATED);

        vm.expectRevert("Only Covered Entity");
        smartBAA.revoke();
        vm.stopPrank();
    }
}
