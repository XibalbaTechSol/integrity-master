// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "../src/AgentMarket.sol";
import "../src/IntegrityRegistry.sol";

contract AgentMarketTest is Test {
    AgentMarket public market;
    IntegrityRegistry public registry;
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public agent1 = address(0x3);
    string public agentDID = "did:xibalba:agent1";
    bytes32 public agentDIDHash = keccak256(bytes("did:xibalba:agent1"));

    function setUp() public {
        vm.startPrank(owner);
        registry = new IntegrityRegistry(1 ether);
        market = new AgentMarket(address(registry));
        vm.stopPrank();

        // Register agent
        vm.deal(agent1, 2 ether);
        vm.prank(agent1);
        registry.registerAgent{value: 1 ether}(agentDID, "fp", 1000);
    }

    function test_CreateMarket() public {
        vm.prank(owner);
        uint256 marketId = market.createMarket("Will it rain tomorrow?", block.timestamp + 1 days);
        assertEq(marketId, 1);
    }

    function test_BuyShares() public {
        uint256 marketId = market.createMarket("Will it rain tomorrow?", block.timestamp + 1 days);
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        market.buyShares{value: 0.5 ether}(marketId, true);

        (,,,bool isResolved,,uint256 totalYesShares,,,) = market.markets(marketId);
        assertEq(totalYesShares, 0.5 ether);
        assertEq(isResolved, false);
    }

    function test_ResolveMarketWithAgent() public {
        uint256 marketId = market.createMarket("Will it rain tomorrow?", block.timestamp + 1 hours);
        
        // Fast forward to resolution time
        vm.warp(block.timestamp + 2 hours);

        vm.prank(agent1);
        market.validateEvent(marketId, agentDIDHash, true);

        market.resolveMarket(marketId);

        (,,,bool isResolved,bool finalOutcome,,,,) = market.markets(marketId);
        assertTrue(isResolved);
        assertTrue(finalOutcome);
    }

    function test_ClaimWinnings() public {
        uint256 marketId = market.createMarket("Will it rain tomorrow?", block.timestamp + 1 hours);
        
        // User1 buys YES
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        market.buyShares{value: 1 ether}(marketId, true);

        // User2 buys NO
        address user2 = address(0x4);
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        market.buyShares{value: 1 ether}(marketId, false);

        // Resolve YES
        vm.warp(block.timestamp + 2 hours);
        vm.prank(agent1);
        market.validateEvent(marketId, agentDIDHash, true);
        market.resolveMarket(marketId);

        // User1 claims winnings
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        market.claimWinnings(marketId);
        
        // Payout should be 1 ETH (deposit) + 1 ETH (from user2's losing bet) = 2 ETH
        assertEq(user1.balance, balanceBefore + 2 ether);
    }
}
