// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IReputationRegistry {
    function getAgent(address _agent) external view returns (uint256 score, uint256 staked, bool verified, uint256 tier);
}

/**
 * @title AgentMarketplace
 * @author Xibalba Solutions
 * @notice A high-integrity marketplace for autonomous agent service contracts (A2A).
 * Supports task negotiation, escrowed payments, and performance bonds.
 */
contract AgentMarketplace is ReentrancyGuard, Ownable {
    
    enum TaskStatus { Open, Bidded, InProgress, Completed, Disputed, Cancelled }

    struct Task {
        address requester;
        address assignedAgent;
        uint256 rewardITK;
        uint256 minAIS;
        uint256 deadline;
        TaskStatus status;
        bytes32 taskType;
        uint256 performanceBond; // ITK staked by the performing agent
    }

    IERC20 public itkToken;
    IReputationRegistry public reputationRegistry;

    mapping(uint256 => Task) public tasks;
    uint256 public taskCount;

    event TaskCreated(uint256 indexed taskId, address indexed requester, uint256 rewardITK, uint256 minAIS);
    event TaskBidded(uint256 indexed taskId, address indexed agent, uint256 bondAmount);
    event TaskCompleted(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId);

    constructor(address _itkToken, address _reputationRegistry) Ownable(msg.sender) {
        itkToken = IERC20(_itkToken);
        reputationRegistry = IReputationRegistry(_reputationRegistry);
    }

    /**
     * @notice Creates a new task with a fixed reward. Reward ITK is locked in escrow.
     */
    function createTask(
        uint256 _rewardITK,
        uint256 _minAIS,
        uint256 _duration,
        bytes32 _taskType
    ) external nonReentrant returns (uint256 taskId) {
        require(_rewardITK > 0, "Reward must be > 0");
        require(itkToken.transferFrom(msg.sender, address(this), _rewardITK), "Escrow transfer failed");

        taskId = ++taskCount;
        tasks[taskId] = Task({
            requester: msg.sender,
            assignedAgent: address(0),
            rewardITK: _rewardITK,
            minAIS: _minAIS,
            deadline: block.timestamp + _duration,
            status: TaskStatus.Open,
            taskType: _taskType,
            performanceBond: 0
        });

        emit TaskCreated(taskId, msg.sender, _rewardITK, _minAIS);
    }

    /**
     * @notice Allows an agent to bid and accept a task. Requires a performance bond.
     */
    function acceptTask(uint256 _taskId, uint256 _bondAmount) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(block.timestamp < task.deadline, "Task deadline passed");

        // Verify AIS
        (uint256 ais, , , ) = reputationRegistry.getAgent(msg.sender);
        require(ais >= task.minAIS, "AIS too low to accept task");

        // Transfer performance bond
        if (_bondAmount > 0) {
            require(itkToken.transferFrom(msg.sender, address(this), _bondAmount), "Bond transfer failed");
            task.performanceBond = _bondAmount;
        }

        task.assignedAgent = msg.sender;
        task.status = TaskStatus.InProgress;

        emit TaskBidded(_taskId, msg.sender, _bondAmount);
    }

    /**
     * @notice Requester confirms task completion and releases funds.
     */
    function completeTask(uint256 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(msg.sender == task.requester, "Only requester can complete");
        require(task.status == TaskStatus.InProgress, "Task not in progress");

        task.status = TaskStatus.Completed;

        // Release reward and bond to the agent
        uint256 totalPayout = task.rewardITK + task.performanceBond;
        require(itkToken.transfer(task.assignedAgent, totalPayout), "Payout failed");

        emit TaskCompleted(_taskId);
    }

    /**
     * @notice Triggers a dispute. Funds remain locked until resolution.
     */
    function disputeTask(uint256 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(msg.sender == task.requester || msg.sender == task.assignedAgent, "Unauthorized");
        require(task.status == TaskStatus.InProgress, "Task not in progress");

        task.status = TaskStatus.Disputed;
        emit TaskDisputed(_taskId);
    }

    /**
     * @notice Resolution mechanism (e.g., protocol governance or arbitrator).
     */
    function resolveDispute(uint256 _taskId, address _winner, uint256 _payoutWinner) external onlyOwner {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Disputed, "Task not disputed");
        
        uint256 totalEscrow = task.rewardITK + task.performanceBond;
        require(_payoutWinner <= totalEscrow, "Invalid payout amount");

        task.status = TaskStatus.Completed;
        
        if (_payoutWinner > 0) {
            require(itkToken.transfer(_winner, _payoutWinner), "Winner payout failed");
        }
        
        uint256 remaining = totalEscrow - _payoutWinner;
        if (remaining > 0) {
            address loser = (_winner == task.requester) ? task.assignedAgent : task.requester;
            require(itkToken.transfer(loser, remaining), "Loser refund failed");
        }
    }
}
