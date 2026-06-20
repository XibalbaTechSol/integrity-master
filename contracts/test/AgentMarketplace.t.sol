// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentMarketplace.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock ITK", "mITK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract MockReputationRegistry {
    mapping(address => uint256) public scores;
    function setScore(address agent, uint256 score) public {
        scores[agent] = score;
    }
    function getAgent(address agent) external view returns (uint256, uint256, bool, uint256) {
        return (scores[agent], 0, true, 3);
    }
}

/**
 * @title AgentMarketplaceTest
 * @notice Validates the AgentMarketplace task lifecycle including creation, acceptance, and completion.
 * @dev Run with: forge test --match-path test/AgentMarketplace.t.sol
 */
contract AgentMarketplaceTest is Test {
    AgentMarketplace public marketplace;
    MockToken public itk;
    MockReputationRegistry public registry;

    address public requester = address(0x1);
    address public agent = address(0x2);

    function setUp() public {
        itk = new MockToken();
        registry = new MockReputationRegistry();
        marketplace = new AgentMarketplace(address(itk), address(registry));

        itk.transfer(requester, 1000 * 10**18);
        itk.transfer(agent, 1000 * 10**18);

        vm.prank(requester);
        itk.approve(address(marketplace), type(uint256).max);

        vm.prank(agent);
        itk.approve(address(marketplace), type(uint256).max);
    }

    function testCreateTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");

        (address req, , uint256 reward, uint256 minAIS, , , , ) = marketplace.tasks(taskId);
        assertEq(req, requester);
        assertEq(reward, 100 * 10**18);
        assertEq(minAIS, 500);
    }

    function testAcceptTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");

        registry.setScore(agent, 600);

        vm.prank(agent);
        marketplace.acceptTask(taskId, 50 * 10**18);

        (, address assigned, , , , AgentMarketplace.TaskStatus status, , uint256 bond) = marketplace.tasks(taskId);
        assertEq(assigned, agent);
        assertEq(uint(status), uint(AgentMarketplace.TaskStatus.InProgress));
        assertEq(bond, 50 * 10**18);
    }

    function testCompleteTask() public {
        vm.prank(requester);
        uint256 taskId = marketplace.createTask(100 * 10**18, 500, 1 days, "DATA_LABELING");

        registry.setScore(agent, 600);
        vm.prank(agent);
        marketplace.acceptTask(taskId, 50 * 10**18);

        uint256 balanceBefore = itk.balanceOf(agent);

        vm.prank(requester);
        marketplace.completeTask(taskId);

        uint256 balanceAfter = itk.balanceOf(agent);
        assertEq(balanceAfter - balanceBefore, 150 * 10**18);
    }
}
