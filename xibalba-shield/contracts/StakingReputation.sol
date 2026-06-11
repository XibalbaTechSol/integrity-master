// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingReputation is Ownable {
    IERC20 public itkToken;
    
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public totalPledgedLiability;
    mapping(address => bool) public authorizedBAAs;
    address public factoryAddress;

    event Staked(address indexed agent, uint256 amount);
    event Withdrawn(address indexed agent, uint256 amount);
    event Slashed(address indexed agent, uint256 amount, address recipient, string reason);
    event LiabilityPledged(address indexed agent, uint256 amount);
    event LiabilityReleased(address indexed agent, uint256 amount);

    constructor(address _itkToken) Ownable(msg.sender) {
        itkToken = IERC20(_itkToken);
    }

    modifier onlyAuthorizedBAA() {
        require(authorizedBAAs[msg.sender], "Not an authorized BAA");
        _;
    }

    function setFactoryAddress(address _factory) external onlyOwner {
        factoryAddress = _factory;
    }

    function setAuthorizedBAA(address baa, bool status) external onlyOwner {
        authorizedBAAs[baa] = status;
    }

    function registerBAA(address baa) external {
        require(msg.sender == factoryAddress, "Only factory can register BAAs");
        authorizedBAAs[baa] = true;
    }

    function stake(uint256 amount) external {
        require(itkToken.transferFrom(msg.sender, address(this), amount), "Stake failed");
        stakes[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(stakes[msg.sender] >= totalPledgedLiability[msg.sender] + amount, "Insufficient free stake");
        stakes[msg.sender] -= amount;
        require(itkToken.transfer(msg.sender, amount), "Withdraw transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function pledgeLiability(address agent, uint256 amount) external onlyAuthorizedBAA {
        require(stakes[agent] >= totalPledgedLiability[agent] + amount, "Insufficient global stake");
        totalPledgedLiability[agent] += amount;
        emit LiabilityPledged(agent, amount);
    }

    function releaseLiability(address agent, uint256 amount) external onlyAuthorizedBAA {
        require(totalPledgedLiability[agent] >= amount, "Liability underflow");
        totalPledgedLiability[agent] -= amount;
        emit LiabilityReleased(agent, amount);
    }

    function slashFromBAA(address agent, uint256 amount, address recipient, string memory reason) external onlyAuthorizedBAA {
        require(stakes[agent] >= amount, "Insufficient stake to slash");
        require(totalPledgedLiability[agent] >= amount, "Slash exceeds pledged liability");
        
        stakes[agent] -= amount;
        totalPledgedLiability[agent] -= amount;
        
        require(itkToken.transfer(recipient, amount), "Transfer to CE failed");
        
        emit Slashed(agent, amount, recipient, reason);
    }

    function slash(address agent, uint256 amount, string memory reason) external onlyOwner {
        require(stakes[agent] >= amount, "Insufficient stake to slash");
        stakes[agent] -= amount;
        // Global administrative slash (burns or redirects to treasury)
        emit Slashed(agent, amount, address(0), reason);
    }
}
