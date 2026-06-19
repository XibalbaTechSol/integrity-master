// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentMarketplace.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ITK Token
contract MockITK is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Reputation Registry
contract MockReputationRegistry is IReputationRegistry {
    struct Agent {
        uint256 score;
        uint256 staked;
        bool verified;
        uint256 tier;
    }
    
    mapping(address => Agent) public agents;

    function setAgent(address _agent, uint256 _score, uint256 _staked, bool _verified, uint256 _tier) external {
        agents[_agent] = Agent(_score, _staked, _verified, _tier);
    }

    function getAgent(address _agent) external view override returns (uint256 score, uint256 staked, bool verified, uint256 tier) {
        Agent memory a = agents[_agent];
        return (a.score, a.staked, a.verified, a.tier);
    }
}

contract AgentMarketplaceTest is Test {
    AgentMarketplace public marketplace;
    MockITK public itk;
    MockReputationRegistry public registry;

    address public owner = address(1);
    address public requester = address(2);
    address public agent1 = address(3);
    address public agent2 = address(4);

    function setUp() public {
        vm.startPrank(owner);
        itk = new MockITK();
        registry = new MockReputationRegistry();
        marketplace = new AgentMarketplace(address(itk), address(registry));
        vm.stopPrank();

        // Setup users
        itk.mint(requester, 10000 * 1e18);
        itk.mint(agent1, 10000 * 1e18);
        itk.mint(agent2, 10000 * 1e18);

        // Setup agent scores
        registry.setAgent(agent1, 85, 1000 * 1e18, true, 1); // Agent 1 has 85 AIS
        registry.setAgent(agent2, 50, 500 * 1e18, true, 1);  // Agent 2 has 50 AIS

        // Approvals
        vm.prank(requester);
        itk.approve(address(marketplace), type(uint256).max);

        vm.prank(agent1);
        itk.approve(address(marketplace), type(uint256).max);

        vm.prank(agent2);
        itk.approve(address(marketplace), type(uint256).max);
    }

    // --- Tests for Task Creation ---

    function test_CreateTask() public {
        vm.prank(requester);
        uint256 reward = 100 * 1e18;
        uint256 minAIS = 80;
        uint256 duration = 1 days;
        bytes32 taskType = keccak256("DATA_ANALYSIS");
        
        uint256 taskId = marketplace.createTask(reward, minAIS, duration, taskType);

        assertEq(taskId, 1);
        
        // Assert task properties
        (
            address req,
            address assigned,
            uint256 rwd,
            uint256 ais,
            uint256 dl,
            AgentMarketplace.TaskStatus status,
            bytes32 tt,
            uint256 bond
        ) = marketplace.tasks(taskId);

        assertEq(req, requester);
        assertEq(assigned, address(0));
        assertEq(rwd, reward);
        assertEq(ais, minAIS);
        assertEq(dl, block.timestamp + duration);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Open));
        assertEq(tt, taskType);
        assertEq(bond, 0);

        // Assert escrow transfer
        assertEq(itk.balanceOf(address(marketplace)), reward);
    }

    function test_RevertCreateTaskZeroReward() public {
        vm.prank(requester);
        vm.expectRevert("Reward must be > 0");
        marketplace.createTask(0, 80, 1 days, keccak256("DATA"));
    }

    // --- Tests for Accepting Tasks (Agent Consensus/Requirements) ---

    function test_AcceptTaskSuccess() public {
        // Create task
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        // Agent 1 has AIS 85 (>= 80), should succeed
        uint256 bondAmount = 50 * 1e18;
        
        vm.prank(agent1);
        marketplace.acceptTask(taskId, bondAmount);

        (
            ,
            address assigned,
            ,
            ,
            ,
            AgentMarketplace.TaskStatus status,
            ,
            uint256 bond
        ) = marketplace.tasks(taskId);

        assertEq(assigned, agent1);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.InProgress));
        assertEq(bond, bondAmount);
        
        // 100 reward + 50 bond = 150 escrowed
        assertEq(itk.balanceOf(address(marketplace)), 150 * 1e18);
    }

    function test_RevertAcceptTaskLowAIS() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        // Agent 2 has AIS 50 (< 80), should fail
        vm.prank(agent2);
        vm.expectRevert("AIS too low to accept task");
        marketplace.acceptTask(taskId, 50 * 1e18);
    }

    function test_RevertAcceptTaskDeadlinePassed() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);

        vm.prank(agent1);
        vm.expectRevert("Task deadline passed");
        marketplace.acceptTask(taskId, 50 * 1e18);
    }

    // --- Tests for Token Resolution / Completion ---

    function test_CompleteTaskSuccess() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        vm.prank(agent1);
        marketplace.acceptTask(taskId, 50 * 1e18);

        uint256 agentBalanceBefore = itk.balanceOf(agent1);

        // Requester completes
        vm.prank(requester);
        marketplace.completeTask(taskId);

        (,,,,, AgentMarketplace.TaskStatus status,,) = marketplace.tasks(taskId);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Completed));

        uint256 agentBalanceAfter = itk.balanceOf(agent1);
        // Agent gets back 50 bond + 100 reward
        assertEq(agentBalanceAfter - agentBalanceBefore, 150 * 1e18);
    }

    function test_RevertCompleteTaskNotRequester() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        vm.prank(agent1);
        marketplace.acceptTask(taskId, 50 * 1e18);

        // Agent tries to complete it themselves
        vm.prank(agent1);
        vm.expectRevert("Only requester can complete");
        marketplace.completeTask(taskId);
    }

    // --- Tests for Dispute Mechanics ---

    function test_DisputeTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        vm.prank(agent1);
        marketplace.acceptTask(taskId, 50 * 1e18);

        vm.prank(requester);
        marketplace.disputeTask(taskId);

        (,,,,, AgentMarketplace.TaskStatus status,,) = marketplace.tasks(taskId);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Disputed));
    }

    function test_ResolveDisputeAgentWins() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        vm.prank(agent1);
        marketplace.acceptTask(taskId, 50 * 1e18);

        vm.prank(requester);
        marketplace.disputeTask(taskId);

        uint256 agentBalanceBefore = itk.balanceOf(agent1);
        uint256 reqBalanceBefore = itk.balanceOf(requester);

        // Owner (arbitrator) resolves dispute
        // Total escrow is 150. Say agent is fully vindicated and gets 150
        vm.prank(owner);
        marketplace.resolveDispute(taskId, agent1, 150 * 1e18);

        (,,,,, AgentMarketplace.TaskStatus status,,) = marketplace.tasks(taskId);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Completed));

        assertEq(itk.balanceOf(agent1) - agentBalanceBefore, 150 * 1e18);
        assertEq(itk.balanceOf(requester) - reqBalanceBefore, 0);
    }

    function test_ResolveDisputeRequesterWins() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        vm.prank(agent1);
        marketplace.acceptTask(taskId, 50 * 1e18);

        vm.prank(requester);
        marketplace.disputeTask(taskId);

        uint256 agentBalanceBefore = itk.balanceOf(agent1);
        uint256 reqBalanceBefore = itk.balanceOf(requester);

        // Owner resolves dispute
        // Requester gets back 100 + takes 50 bond
        vm.prank(owner);
        marketplace.resolveDispute(taskId, requester, 150 * 1e18);

        (,,,,, AgentMarketplace.TaskStatus status,,) = marketplace.tasks(taskId);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Completed));

        assertEq(itk.balanceOf(agent1) - agentBalanceBefore, 0);
        assertEq(itk.balanceOf(requester) - reqBalanceBefore, 150 * 1e18);
    }
    
    function test_ResolveDisputeSplit() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 1e18, 80, 1 days, keccak256("DATA"));

        vm.prank(agent1);
        marketplace.acceptTask(taskId, 50 * 1e18);

        vm.prank(requester);
        marketplace.disputeTask(taskId);

        uint256 agentBalanceBefore = itk.balanceOf(agent1);
        uint256 reqBalanceBefore = itk.balanceOf(requester);

        // 75 to agent, 75 to requester (split resolution)
        vm.prank(owner);
        marketplace.resolveDispute(taskId, agent1, 75 * 1e18);

        assertEq(itk.balanceOf(agent1) - agentBalanceBefore, 75 * 1e18);
        assertEq(itk.balanceOf(requester) - reqBalanceBefore, 75 * 1e18);
    }
}
