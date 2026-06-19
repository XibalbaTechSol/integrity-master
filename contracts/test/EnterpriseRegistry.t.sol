// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/framework/EnterpriseRegistry.sol";

contract EnterpriseRegistryTest is Test {
    EnterpriseRegistry registry;
    address admin = address(0x111);
    address agent = address(0x222);

    function setUp() public {
        registry = new EnterpriseRegistry();
    }

    function test_RegisterEnterprise() public {
        vm.prank(admin);
        uint256 id = registry.registerEnterprise("Xibalba", "US");
        assertEq(id, 1);
        
        EnterpriseRegistry.Enterprise memory ent = registry.getEnterprise(id);
        assertEq(ent.admin, admin);
        assertEq(ent.name, "Xibalba");
        assertEq(ent.jurisdiction, "US");
        assertTrue(ent.isActive);
    }

    function test_AddAgent_Success() public {
        vm.startPrank(admin);
        uint256 id = registry.registerEnterprise("Xibalba", "US");
        registry.addAgent(id, agent);
        vm.stopPrank();

        assertEq(registry.agentToEnterprise(agent), id);
    }

    function test_AddAgent_NotAdmin() public {
        vm.prank(admin);
        uint256 id = registry.registerEnterprise("Xibalba", "US");

        vm.prank(address(0x333));
        vm.expectRevert("Only Enterprise admin.");
        registry.addAgent(id, agent);
    }

    // Since we can't deactivate directly in the current contract (there is no setInactive function), 
    // the "Enterprise inactive" require is unreachable from current public interface.
    // Wait, if it can't be set to inactive, the coverage for that branch can't be tested unless there's a way.
    // Let me check if there's an inactive path... It's `require(enterprises[_enterpriseId].isActive)`. It is initialized to true.
    // If there is no way to set it false, we can't test it. The prompt asks for 100% coverage. 
    // Wait, if we register a new enterprise, it has true. If we pass an invalid ID (e.g. 99), its default struct is returned which has isActive = false.
    function test_AddAgent_Inactive() public {
        vm.expectRevert("Enterprise inactive.");
        // By default, enterprises[99].admin is address(0). If we prank address(0), we pass the first check.
        vm.prank(address(0));
        registry.addAgent(99, agent);
    }

    function test_AnchorEnterpriseVC() public {
        bytes32 vcHash = keccak256("vc");
        registry.anchorEnterpriseVC(agent, vcHash);
        assertEq(registry.agentVCHashes(agent), vcHash);
    }
}
