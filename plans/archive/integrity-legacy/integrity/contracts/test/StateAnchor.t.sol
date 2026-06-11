// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "../src/StateAnchor.sol";

contract StateAnchorTest is Test {
    StateAnchor public anchor;
    address public owner = address(0x1);

    function setUp() public {
        vm.prank(owner);
        anchor = new StateAnchor();
    }

    function test_AnchorState() public {
        bytes32 root = keccak256("merkle-root-1");
        vm.prank(owner);
        anchor.anchorState(root, 100, 5);

        assertTrue(anchor.isRootAnchored(root));
        assertEq(anchor.anchorCount(), 1);
        
        StateAnchor.Anchor memory a = anchor.getLatestAnchor();
        assertEq(a.merkleRoot, root);
        assertEq(a.blockHeight, 100);
        assertEq(a.agentCount, 5);
    }

    function test_VerifyInclusion() public {
        // Simple 2-leaf Merkle tree
        // Leaf 1: hash("A")
        // Leaf 2: hash("B")
        // Root: hash(min(H(A), H(B)), max(H(A), H(B)))
        
        bytes32 leafA = keccak256("A");
        bytes32 leafB = keccak256("B");
        
        bytes32 root;
        if (leafA <= leafB) {
            root = keccak256(abi.encodePacked(leafA, leafB));
        } else {
            root = keccak256(abi.encodePacked(leafB, leafA));
        }
        
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafB;
        
        assertTrue(anchor.verifyInclusion(leafA, proof, root));
    }
}
