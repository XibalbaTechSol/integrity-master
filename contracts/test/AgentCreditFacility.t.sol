// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/core/AgentCreditFacility.sol";
import "../src/core/MockITK.sol";
import "../src/core/SovereignAgent.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Dummy factory to pass to SovereignAgent
contract DummyFactory is ERC721 {
    constructor() ERC721("Dummy", "DUM") {}
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}

contract AgentCreditFacilityTest is Test {
    AgentCreditFacility facility;
    MockITK itk;
    DummyFactory factory;
    
    SovereignAgent agentTier1;
    SovereignAgent agentTier2;
    SovereignAgent agentTier3;

    address oracle = address(0x123);
    address controller = address(0x456);

    function setUp() public {
        itk = new MockITK();
        facility = new AgentCreditFacility(address(itk));
        factory = new DummyFactory();

        factory.mint(controller, 1);
        factory.mint(controller, 2);
        factory.mint(controller, 3);

        // Deploy 3 agents
        agentTier1 = new SovereignAgent("Agent 1", controller, oracle, 1, address(factory));
        agentTier2 = new SovereignAgent("Agent 2", controller, oracle, 2, address(factory));
        agentTier3 = new SovereignAgent("Agent 3", controller, oracle, 3, address(factory));

        // Fund the facility with 1 million ITK
        itk.mint(address(facility), 1_000_000 * 10**18);

        // Setup Tier 1 (Too low AIS)
        vm.prank(oracle);
        agentTier1.updateAIS(600, 1);

        // Setup Tier 2 (AIS >= 850, Tier 2 limit)
        vm.prank(oracle);
        agentTier2.updateAIS(850, 2);

        // Setup Tier 3 (AIS 1000, Uncapped limit)
        vm.prank(oracle);
        agentTier3.updateAIS(1000, 3);
    }

    function test_Tier1_CannotBorrow() public {
        vm.startPrank(controller);
        vm.expectRevert("Agent AIS too low for credit facility");
        facility.drawCredit(address(agentTier1), 10_000 * 10**18);
        vm.stopPrank();
    }

    function test_Tier2_CanBorrowWithinLimit() public {
        vm.startPrank(controller);
        facility.drawCredit(address(agentTier2), 50_000 * 10**18);
        assertEq(facility.borrowedAmounts(address(agentTier2)), 50_000 * 10**18);
        assertEq(itk.balanceOf(address(agentTier2)), 50_000 * 10**18);
        vm.stopPrank();
    }

    function test_Tier2_CannotExceedLimit() public {
        vm.startPrank(controller);
        vm.expectRevert("Exceeds Tier 2 borrowing limit");
        // TIER_2_LIMIT is 100,000
        facility.drawCredit(address(agentTier2), 100_001 * 10**18);
        vm.stopPrank();
    }

    function test_Tier3_UncappedBorrowing() public {
        vm.startPrank(controller);
        // Borrowing 200,000, which exceeds Tier 2 limit
        facility.drawCredit(address(agentTier3), 200_000 * 10**18);
        assertEq(facility.borrowedAmounts(address(agentTier3)), 200_000 * 10**18);
        assertEq(itk.balanceOf(address(agentTier3)), 200_000 * 10**18);
        vm.stopPrank();
    }
}
