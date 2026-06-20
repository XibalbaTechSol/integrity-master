// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/StateAnchor.sol";

contract StateAnchorTest is Test {
    StateAnchor anchor;
    address owner = address(this);

    function setUp() public {
        anchor = new StateAnchor();
    }

    function testAnchorRoot() public {
        bytes32 root = keccak256("test_root");
        
        anchor.anchorRoot(root);

        assertEq(anchor.latestRoot(), root);
        assertEq(anchor.latestTimestamp(), block.timestamp);
        assertEq(anchor.stateRoots(block.timestamp), root);
    }

    function testAnchorRootNotOwner() public {
        bytes32 root = keccak256("test_root");
        
        vm.prank(address(2));
        vm.expectRevert();
        anchor.anchorRoot(root);
    }

    function testIsValidRoot() public {
        bytes32 root = keccak256("test_root");
        
        anchor.anchorRoot(root);

        assertTrue(anchor.isValidRoot(root));
        assertFalse(anchor.isValidRoot(keccak256("invalid_root")));
    }
}
