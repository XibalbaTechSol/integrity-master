// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/framework/AgentFactory.sol";
import "../src/core/SovereignAgent.sol";

contract AgentFactoryTest is Test {
    AgentFactory factory;
    address entryPoint = address(0x111);
    address oracle = address(0x222);
    address creator1 = address(0x333);
    address creator2 = address(0x444);

    function setUp() public {
        factory = new AgentFactory(entryPoint);
    }

    function test_Constructor_InvalidEntryPoint() public {
        vm.expectRevert("Invalid EntryPoint");
        new AgentFactory(address(0));
    }

    function test_CreateAgent_WithoutVouch() public {
        vm.prank(creator1);
        address agentAddr = factory.createAgent("Alias1", oracle, address(0));

        assertEq(factory.getAgentCount(), 1);
        assertEq(factory.getAgentByToken(0), agentAddr);
        assertEq(factory.ownerOf(0), creator1);
        
        SovereignAgent agent = SovereignAgent(agentAddr);
        assertEq(agent.agentAlias(), "Alias1");
    }

    function test_CreateAgent_WithVouch_Success() public {
        vm.startPrank(creator1);
        address parentAgent = factory.createAgent("Parent", oracle, address(0));
        vm.stopPrank();

        vm.prank(creator2);
        address childAgent = factory.createAgent("Child", oracle, parentAgent);

        assertEq(factory.getAgentCount(), 2);
        assertEq(factory.ownerOf(1), creator2);
    }

    function test_CreateAgent_WithVouch_NotRegisteredEntity() public {
        vm.prank(creator1);
        vm.expectRevert("Only registered entities can vouch.");
        factory.createAgent("Child", oracle, address(0x999));
    }
}
