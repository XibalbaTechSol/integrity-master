// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentMarketplace.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockITK is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract MockReputationRegistry is IReputationRegistry {
    mapping(address => uint256) public scores;
    function setScore(address _agent, uint256 _score) external {
        scores[_agent] = _score;
    }
    function getAgent(address _agent) external view returns (uint256 score, uint256 staked, bool verified, uint256 tier) {
        return (scores[_agent], 0, true, 1);
    }
}

contract AgentMarketplaceTest is Test {
    AgentMarketplace public marketplace;
    MockITK public itk;
    MockReputationRegistry public registry;

    address public requester = address(0x1);
    address public agent = address(0x2);

    function setUp() public {
        itk = new MockITK();
        registry = new MockReputationRegistry();
        marketplace = new AgentMarketplace(address(itk), address(registry));

        itk.transfer(requester, 1000 * 10**18);
        itk.transfer(agent, 1000 * 10**18);
    }

    /**
     * @notice Validates that a requester can create a task and ITK is escrowed.
     */
    function test_CreateTask() public {
        vm.startPrank(requester);
        itk.approve(address(marketplace), 100 * 10**18);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");
        vm.stopPrank();

        (address req,, uint256 rewardITK, uint256 minAIS, uint256 deadline, AgentMarketplace.TaskStatus status, bytes32 taskType, uint256 performanceBond) = marketplace.tasks(taskId);
        assertEq(req, requester);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Open));
        assertEq(itk.balanceOf(address(marketplace)), 100 * 10**18);
    }

    /**
     * @notice Validates that an agent with sufficient AIS can accept a task.
     */
    function test_AcceptTask() public {
        // Create task
        vm.startPrank(requester);
        itk.approve(address(marketplace), 100 * 10**18);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");
        vm.stopPrank();

        // Set agent AIS
        registry.setScore(agent, 600);

        // Accept task
        vm.startPrank(agent);
        itk.approve(address(marketplace), 50 * 10**18);
        marketplace.acceptTask(taskId, 50 * 10**18);
        vm.stopPrank();

        (address requesterAddr, address assigned, uint256 reward, uint256 ais, uint256 dead, AgentMarketplace.TaskStatus status, bytes32 tType, uint256 bond) = marketplace.tasks(taskId);
        assertEq(assigned, agent);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.InProgress));
        assertEq(bond, 50 * 10**18);
    }

    /**
     * @notice Ensures that an agent with AIS below threshold cannot accept a task.
     */
    function test_AcceptTask_LowAIS_Reverts() public {
        // Create task
        vm.startPrank(requester);
        itk.approve(address(marketplace), 100 * 10**18);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");
        vm.stopPrank();

        // Set low agent AIS
        registry.setScore(agent, 400);

        // Accept task should revert
        vm.startPrank(agent);
        vm.expectRevert("AIS too low to accept task");
        marketplace.acceptTask(taskId, 0);
        vm.stopPrank();
    }

    /**
     * @notice Validates task completion and fund release.
     */
    function test_CompleteTask() public {
        // Setup: Create and Accept
        vm.startPrank(requester);
        itk.approve(address(marketplace), 100 * 10**18);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");
        vm.stopPrank();

        registry.setScore(agent, 600);
        vm.startPrank(agent);
        marketplace.acceptTask(taskId, 0);
        vm.stopPrank();

        // Complete
        vm.prank(requester);
        marketplace.completeTask(taskId);

        (,,,,, AgentMarketplace.TaskStatus status,,) = marketplace.tasks(taskId);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.Completed));
        assertEq(itk.balanceOf(agent), 1100 * 10**18); // 1000 original + 100 reward
    }
}
