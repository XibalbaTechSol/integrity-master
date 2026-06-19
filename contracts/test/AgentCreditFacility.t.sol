// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/core/AgentCreditFacility.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/core/SovereignAgent.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockITK2 is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DummyFactory2 is ERC721 {
    constructor() ERC721("Dummy", "DUM") {}
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}

contract AgentCreditFacilityTest is Test {
    AgentCreditFacility facility;
    MockITK2 itk;
    DummyFactory2 factory;

    SovereignAgent agentTier1;
    SovereignAgent agentTier2;
    SovereignAgent agentTier3;
    SovereignAgent agentTierIneligible;

    address oracle = address(0x123);
    address controller = address(0x456);
    address entryPoint = address(0x789);

    function setUp() public {
        itk = new MockITK2();
        facility = new AgentCreditFacility(address(itk));
        factory = new DummyFactory2();

        factory.mint(controller, 1);
        factory.mint(controller, 2);
        factory.mint(controller, 3);
        factory.mint(controller, 4);

        agentTier1 = new SovereignAgent("Agent 1", controller, oracle, 1, address(factory), entryPoint);
        agentTier2 = new SovereignAgent("Agent 2", controller, oracle, 2, address(factory), entryPoint);
        agentTier3 = new SovereignAgent("Agent 3", controller, oracle, 3, address(factory), entryPoint);
        agentTierIneligible = new SovereignAgent("Agent 4", controller, oracle, 4, address(factory), entryPoint);

        itk.mint(address(facility), 1_000_000 * 10**18);

        vm.startPrank(oracle);
        agentTier1.updateAIS(600, 1); // AIS too low
        agentTier2.updateAIS(850, 2); // Tier 2 limit
        agentTier3.updateAIS(1000, 3); // Uncapped limit
        agentTierIneligible.updateAIS(900, 1); // High AIS but Tier 1
        vm.stopPrank();
    }

    function test_DrawCredit_Unauthorized() public {
        vm.startPrank(address(0x999));
        vm.expectRevert("Not authorized to act on behalf of agent");
        facility.drawCredit(address(agentTier2), 10_000 * 10**18);
        vm.stopPrank();
    }

    function test_DrawCredit_AISTooLow() public {
        vm.startPrank(controller);
        vm.expectRevert("Agent AIS too low for credit facility");
        facility.drawCredit(address(agentTier1), 10_000 * 10**18);
        vm.stopPrank();
    }

    function test_DrawCredit_TierIneligible() public {
        vm.startPrank(controller);
        vm.expectRevert("Agent tier ineligible for credit");
        facility.drawCredit(address(agentTierIneligible), 10_000 * 10**18);
        vm.stopPrank();
    }

    function test_DrawCredit_Tier2_CanBorrowWithinLimit() public {
        vm.startPrank(controller);
        facility.drawCredit(address(agentTier2), 50_000 * 10**18);
        assertEq(facility.borrowedAmounts(address(agentTier2)), 50_000 * 10**18);
        assertEq(itk.balanceOf(address(agentTier2)), 50_000 * 10**18);
        vm.stopPrank();
    }

    function test_DrawCredit_Tier2_CannotExceedLimit() public {
        vm.startPrank(controller);
        vm.expectRevert("Exceeds Tier 2 borrowing limit");
        facility.drawCredit(address(agentTier2), 100_001 * 10**18);
        vm.stopPrank();
    }

    function test_DrawCredit_Tier3_UncappedBorrowing() public {
        vm.startPrank(controller);
        facility.drawCredit(address(agentTier3), 200_000 * 10**18);
        assertEq(facility.borrowedAmounts(address(agentTier3)), 200_000 * 10**18);
        assertEq(itk.balanceOf(address(agentTier3)), 200_000 * 10**18);
        vm.stopPrank();
    }

    function test_DrawCredit_InsufficientLiquidity() public {
        itk.mint(address(facility), 0); // Need to drain it
        // drain by drawing
        vm.startPrank(controller);
        facility.drawCredit(address(agentTier3), 1_000_000 * 10**18); // empties it
        
        vm.expectRevert("Insufficient liquidity in facility");
        facility.drawCredit(address(agentTier3), 100);
        vm.stopPrank();
    }

    function test_RepayCredit_RepayingMoreThanOwed() public {
        vm.startPrank(controller);
        facility.drawCredit(address(agentTier2), 50_000 * 10**18);
        vm.expectRevert("Repaying more than owed");
        facility.repayCredit(address(agentTier2), 50_001 * 10**18);
        vm.stopPrank();
    }

    function test_RepayCredit_Success() public {
        vm.startPrank(controller);
        facility.drawCredit(address(agentTier2), 50_000 * 10**18);

        // Mint ITK to controller so they can repay
        itk.mint(controller, 50_000 * 10**18);
        itk.approve(address(facility), 50_000 * 10**18);

        facility.repayCredit(address(agentTier2), 20_000 * 10**18);
        assertEq(facility.borrowedAmounts(address(agentTier2)), 30_000 * 10**18);
        vm.stopPrank();
    }
}
