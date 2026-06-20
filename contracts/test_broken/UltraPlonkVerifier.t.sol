// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/UltraPlonkVerifier.sol";

contract UltraPlonkVerifierTest is Test {
    UltraPlonkVerifier verifier;

    function setUp() public {
        verifier = new UltraPlonkVerifier();
    }

    function testVerify() public {
        bytes memory proof = "mock_proof";
        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = keccak256("input1");
        publicInputs[1] = keccak256("input2");

        bool result = verifier.verify(proof, publicInputs);
        assertTrue(result);
    }

    function testVerifyEmptyProof() public {
        bytes memory proof = "";
        bytes32[] memory publicInputs = new bytes32[](0);

        bool result = verifier.verify(proof, publicInputs);
        assertFalse(result);
    }
}
