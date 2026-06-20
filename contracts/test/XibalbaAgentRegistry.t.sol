// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/framework/XibalbaAgentRegistry.sol";
import "../src/oracle/IntegrityToken.sol";

contract XibalbaAgentRegistryTest is Test {
    XibalbaAgentRegistry registry;
    IntegrityToken itk;
    
    address admin = address(this);
    address agent = address(0x111);

    function setUp() public {
        itk = new IntegrityToken(admin);
        registry = new XibalbaAgentRegistry(address(itk), admin);
    }

    function test_RegisterAgent() public {
        vm.prank(agent);
        uint256 id = registry.registerAgent("Agent1");
        assertEq(id, 1);
        
        XibalbaAgentRegistry.AgentProfile memory profile = registry.getAgent(agent);
        assertEq(profile.agentAlias, "Agent1");
        assertEq(profile.ais, 300);
        assertEq(profile.totalStaked, 0);
        assertEq(profile.verificationTier, 1);
        assertFalse(profile.isVerified);
        
        assertEq(registry.walletToToken(agent), 1);
    }

    function test_RegisterAgent_AlreadyRegistered() public {
        vm.startPrank(agent);
        registry.registerAgent("Agent1");
        vm.expectRevert("Wallet already registered.");
        registry.registerAgent("Agent2");
        vm.stopPrank();
    }

    function test_UpdateAIS_Success() public {
        vm.prank(agent);
        registry.registerAgent("Agent1");

        registry.updateAIS(agent, 800, 2);
        XibalbaAgentRegistry.AgentProfile memory profile = registry.getAgent(agent);
        assertEq(profile.ais, 800);
        assertEq(profile.verificationTier, 2);
    }

    function test_UpdateAIS_NotRegistered() public {
        vm.expectRevert("Agent not registered.");
        registry.updateAIS(agent, 800, 2);
    }

    function test_UpdateAIS_OutOfRangeLow() public {
        vm.prank(agent);
        registry.registerAgent("Agent1");

        vm.expectRevert("AIS out of range.");
        registry.updateAIS(agent, 299, 2);
    }

    function test_UpdateAIS_OutOfRangeHigh() public {
        vm.prank(agent);
        registry.registerAgent("Agent1");

        vm.expectRevert("AIS out of range.");
        registry.updateAIS(agent, 1001, 2);
    }

    function test_UpdateAIS_InvalidTierLow() public {
        vm.prank(agent);
        registry.registerAgent("Agent1");

        vm.expectRevert("Invalid tier.");
        registry.updateAIS(agent, 800, 0);
    }

    function test_UpdateAIS_InvalidTierHigh() public {
        vm.prank(agent);
        registry.registerAgent("Agent1");

        vm.expectRevert("Invalid tier.");
        registry.updateAIS(agent, 800, 4);
    }

    function test_Stake_Success() public {
        vm.prank(admin);
        itk.mint(agent, 1000);

        vm.startPrank(agent);
        registry.registerAgent("Agent1");
        
        itk.approve(address(registry), 1000);
        registry.stake(1000);
        vm.stopPrank();

        XibalbaAgentRegistry.AgentProfile memory profile = registry.getAgent(agent);
        assertEq(profile.totalStaked, 1000);
    }

    function test_Stake_NotRegistered() public {
        vm.prank(agent);
        vm.expectRevert("Register agent first.");
        registry.stake(1000);
    }

    function test_Stake_InvalidAmount() public {
        vm.startPrank(agent);
        registry.registerAgent("Agent1");
        vm.expectRevert("Invalid amount.");
        registry.stake(0);
        vm.stopPrank();
    }

    function test_Unstake_Success() public {
        vm.prank(admin);
        itk.mint(agent, 1000);

        vm.startPrank(agent);
        registry.registerAgent("Agent1");
        
        itk.approve(address(registry), 1000);
        registry.stake(1000);
        
        registry.unstake(500);
        vm.stopPrank();

        XibalbaAgentRegistry.AgentProfile memory profile = registry.getAgent(agent);
        assertEq(profile.totalStaked, 500);
        // IntegrityToken charges 0.5% fee on all non-exempt transfers.
        // unstake(500) transfers 500 from registry to agent: fee = floor(500 * 50 / 10000) = 2
        // Agent receives 498. (Initial 1000 minted, 1000 staked with fee, gets back 498)
        assertEq(itk.balanceOf(agent), 498);
    }

    function test_Unstake_Insufficient() public {
        vm.startPrank(agent);
        registry.registerAgent("Agent1");
        vm.expectRevert("Insufficient stake.");
        registry.unstake(1000);
        vm.stopPrank();
    }

    function test_SupportsInterface() public {
        assertTrue(registry.supportsInterface(0x80ac58cd)); // ERC721 interface ID
    }
}
