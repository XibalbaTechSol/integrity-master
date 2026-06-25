// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentMarketplace.sol";
import "../src/core/MockITK.sol";
import "../src/oracle/ReputationRegistry.sol";

contract AgentMarketplaceTest is Test {
    AgentMarketplace public marketplace;
    MockITK public itkToken;
    ReputationRegistry public reputationRegistry;

    address public owner = address(this);
    address public requester = address(0x1);
    address public agent = address(0x2);

    function setUp() public {
        itkToken = new MockITK();
        reputationRegistry = new ReputationRegistry(address(itkToken), owner);
        marketplace = new AgentMarketplace(address(itkToken), address(reputationRegistry));

        // Fund requester and agent
        itkToken.mint(requester, 10000 ether);
        itkToken.mint(agent, 10000 ether);

        vm.prank(requester);
        itkToken.approve(address(marketplace), type(uint256).max);

        vm.prank(agent);
        itkToken.approve(address(marketplace), type(uint256).max);

        // Register agent and give them an AIS score
        vm.prank(owner);
        reputationRegistry.updateAIS(agent, 800, 1);
    }

    function test_createTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 ether, 500, 1 days, bytes32("DATA_ANALYSIS"));

        assertEq(taskId, 1);
        (address req, address assgn, uint256 rwd, uint256 minAIS, , AgentMarketplace.TaskStatus status, , ) = marketplace.tasks(taskId);
        
        assertEq(req, requester);
        assertEq(assgn, address(0));
        assertEq(rwd, 100 ether);
        assertEq(minAIS, 500);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Open));
        assertEq(itkToken.balanceOf(address(marketplace)), 100 ether);
    }

    function test_acceptTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 ether, 500, 1 days, bytes32("DATA_ANALYSIS"));

        vm.prank(agent);
        marketplace.acceptTask(taskId, 50 ether);

        (, address assgn, , , , AgentMarketplace.TaskStatus status, , uint256 bond) = marketplace.tasks(taskId);
        
        assertEq(assgn, agent);
        assertEq(bond, 50 ether);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.InProgress));
        assertEq(itkToken.balanceOf(address(marketplace)), 150 ether);
    }

    function test_failAcceptTask_LowAIS() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 ether, 900, 1 days, bytes32("DATA_ANALYSIS")); // requires 900 AIS

        vm.prank(agent);
        vm.expectRevert("AIS too low to accept task");
        marketplace.acceptTask(taskId, 50 ether);
    }

    function test_completeTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 ether, 500, 1 days, bytes32("DATA_ANALYSIS"));

        vm.prank(agent);
        marketplace.acceptTask(taskId, 50 ether);

        uint256 agentBalBefore = itkToken.balanceOf(agent);

        vm.prank(requester);
        marketplace.completeTask(taskId);

        uint256 agentBalAfter = itkToken.balanceOf(agent);
        
        (, , , , , AgentMarketplace.TaskStatus status, , ) = marketplace.tasks(taskId);
        
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Completed));
        assertEq(agentBalAfter - agentBalBefore, 150 ether); // 100 reward + 50 bond returned
    }
}
