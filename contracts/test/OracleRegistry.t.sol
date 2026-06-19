// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/OracleRegistry.sol";

contract OracleRegistryTest is Test {
    OracleRegistry public registry;
    address public admin = address(0x1);
    address public curator = address(0x2);

    function setUp() public {
        vm.startPrank(admin);
        registry = new OracleRegistry(admin);
        registry.grantRole(registry.CURATOR_ROLE(), curator);
        vm.stopPrank();
    }

    function testAddSource() public {
        vm.prank(curator);
        registry.addSource("Test Oracle", "https://api.test.com");
        
        (string memory name, string memory uri, bool active, uint256 score) = registry.sources(1);
        assertEq(name, "Test Oracle");
        assertEq(uri, "https://api.test.com");
        assertTrue(active);
        assertEq(score, 800);
        assertEq(registry.sourceCount(), 1);
    }

    function testSetSourceStatus() public {
        vm.prank(curator);
        registry.addSource("Test Oracle", "https://api.test.com");
        
        vm.prank(curator);
        registry.setSourceStatus(1, false);
        
        (,, bool active,) = registry.sources(1);
        assertFalse(active);
        assertFalse(registry.isSourceActive(1));
    }

    function testUpdateSourceScore() public {
        vm.prank(curator);
        registry.addSource("Test Oracle", "https://api.test.com");
        
        vm.prank(admin);
        registry.updateSourceScore(1, 950);
        
        (,,, uint256 score) = registry.sources(1);
        assertEq(score, 950);
    }

    function testSetSourceStatusRevertInvalidSource() public {
        vm.prank(curator);
        vm.expectRevert("Invalid sourceId");
        registry.setSourceStatus(1, false);
    }

    function testUpdateSourceScoreRevertInvalidSource() public {
        vm.prank(admin);
        vm.expectRevert("Invalid sourceId");
        registry.updateSourceScore(1, 950);
    }
    
    function testUpdateSourceScoreRevertOutOfBounds() public {
        vm.prank(curator);
        registry.addSource("Test", "uri");
        
        vm.prank(admin);
        vm.expectRevert("Score out of bounds");
        registry.updateSourceScore(1, 1001);
    }
}
