// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/framework/ReputationLendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockITK4 is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockReputationRegistry {
    uint256 mockAis;
    uint256 mockStaked;

    function setMockData(uint256 _ais, uint256 _staked) external {
        mockAis = _ais;
        mockStaked = _staked;
    }

    function getAgent(address) external view returns (uint256, uint256, uint256, bool) {
        return (mockAis, mockStaked, 0, false);
    }
}

contract ReputationLendingPoolTest is Test {
    ReputationLendingPool pool;
    MockITK4 itk;
    MockReputationRegistry registry;
    
    address agent = address(0x111);

    function setUp() public {
        itk = new MockITK4();
        registry = new MockReputationRegistry();
        pool = new ReputationLendingPool(address(registry), address(itk));
        
        itk.mint(address(this), 100000);
        itk.approve(address(pool), 100000);
        pool.depositLiquidity(100000);
    }

    function test_DepositLiquidity() public {
        assertEq(pool.totalLiquidity(), 100000);
        assertEq(itk.balanceOf(address(pool)), 100000);
    }

    function test_Borrow_Success() public {
        registry.setMockData(800, 10000); // LTV: 50 + (200*40/400) = 70%. Max borrow = 7000
        
        vm.prank(agent);
        pool.borrow(5000);

        (uint256 amt, uint256 staked, uint256 rate, uint256 startTime, bool active) = pool.loans(agent);
        assertEq(amt, 5000);
        assertEq(staked, 10000);
        // Rate: 1000 - (200*800/400) = 600
        assertEq(rate, 600);
        assertTrue(active);
        assertEq(itk.balanceOf(agent), 5000);
        assertEq(pool.totalLiquidity(), 95000);
    }

    function test_Borrow_ExistingActiveLoan() public {
        registry.setMockData(800, 10000);
        
        vm.startPrank(agent);
        pool.borrow(1000);
        vm.expectRevert("Existing loan active.");
        pool.borrow(1000);
        vm.stopPrank();
    }

    function test_Borrow_LowAIS() public {
        registry.setMockData(599, 10000);
        vm.prank(agent);
        vm.expectRevert("Insufficient reputation for borrowing.");
        pool.borrow(1000);
    }

    function test_Borrow_ExceedsLTV() public {
        registry.setMockData(600, 10000); // LTV 50%, Max 5000
        vm.prank(agent);
        vm.expectRevert("Exceeds reputation-based LTV.");
        pool.borrow(5001);
    }

    function test_Borrow_ExceedsLiquidity() public {
        registry.setMockData(1000, 10000000); // LTV 90%, Max 9000000
        vm.prank(agent);
        vm.expectRevert("Insufficient pool liquidity.");
        pool.borrow(200000); // Liquidity is 100000
    }

    function test_Repay_Success() public {
        registry.setMockData(800, 10000);
        vm.prank(agent);
        pool.borrow(5000); // Rate 600 bps

        vm.warp(block.timestamp + 365 days); // 1 year later

        // Interest = (5000 * 600 * 365 days) / (10000 * 365 days) = 300
        // Total = 5300
        itk.mint(agent, 300); // Give enough to repay interest
        
        vm.startPrank(agent);
        itk.approve(address(pool), 5300);
        pool.repay();
        vm.stopPrank();

        (,,,, bool active) = pool.loans(agent);
        assertFalse(active);
        assertEq(pool.totalLiquidity(), 100300);
    }

    function test_Repay_NoActiveLoan() public {
        vm.prank(agent);
        vm.expectRevert("No active loan.");
        pool.repay();
    }
}
