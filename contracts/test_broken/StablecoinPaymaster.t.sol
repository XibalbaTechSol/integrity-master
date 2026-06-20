// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/StablecoinPaymaster.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/core/IAccount.sol";

contract MockERC20 is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract MockSwapRouter {
    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params) external returns (uint256 amountOut) {
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        amountOut = params.amountIn * 2; // mock rate
        MockERC20(address(uint160(address(params.tokenOut)))).mint(params.recipient, amountOut);
    }
}

contract StablecoinPaymasterTest is Test {
    StablecoinPaymaster paymaster;
    MockERC20 usdc;
    MockERC20 itk;
    MockSwapRouter router;
    
    address entryPoint = address(0x111);
    address oracleSigner = address(0x222);
    address agent = address(0x333);
    address owner = address(this);

    function setUp() public {
        usdc = new MockERC20();
        itk = new MockERC20();
        router = new MockSwapRouter();
        paymaster = new StablecoinPaymaster(entryPoint, address(usdc), address(itk), address(router), oracleSigner);
    }

    function testSetOracleSigner() public {
        paymaster.setOracleSigner(address(0x444));
        assertEq(paymaster.oracleSigner(), address(0x444));
    }

    function testSetPrice() public {
        paymaster.setPrice(4000 * 1e6);
        assertEq(paymaster.usdcPerEth(), 4000 * 1e6);
    }

    function testSetBuybackBps() public {
        paymaster.setBuybackBps(6000);
        assertEq(paymaster.buybackBps(), 6000);
    }

    function testSetBuybackBpsInvalid() public {
        vm.expectRevert("Invalid BPS");
        paymaster.setBuybackBps(10001);
    }

    function testPerformBuybackAndBurn() public {
        usdc.mint(address(paymaster), 1000 * 1e6);
        
        paymaster.performBuybackAndBurn(1000 * 1e6);
        
        assertEq(usdc.balanceOf(address(paymaster)), 0);
        assertEq(itk.balanceOf(address(0)), 2000 * 1e6); 
    }

    function testPerformBuybackAndBurnZeroAmount() public {
        vm.expectRevert("Amount must be > 0");
        paymaster.performBuybackAndBurn(0);
    }

    function testPerformBuybackAndBurnInsufficientBalance() public {
        vm.expectRevert("Insufficient USDC");
        paymaster.performBuybackAndBurn(1000);
    }

    function testValidatePaymasterUserOp() public {
        UserOperation memory userOp;
        userOp.sender = agent;
        uint256 maxCost = 1e15; 
        
        uint256 maxUsdcCost = (maxCost * 3000 * 1e6 * 110) / (1e18 * 100);
        
        usdc.mint(agent, maxUsdcCost);

        vm.prank(entryPoint);
        (bytes memory context, uint256 validationData) = paymaster.validatePaymasterUserOp(userOp, bytes32(0), maxCost);

        assertEq(validationData, 0);
        (address decodedAgent, uint256 decodedMaxUsdc) = abi.decode(context, (address, uint256));
        assertEq(decodedAgent, agent);
        assertEq(decodedMaxUsdc, maxUsdcCost);
    }

    function testValidatePaymasterUserOpNotEntryPoint() public {
        UserOperation memory userOp;
        vm.prank(address(0x444));
        vm.expectRevert("Paymaster: caller must be EntryPoint");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 0);
    }

    function testValidatePaymasterUserOpInsufficientBalance() public {
        UserOperation memory userOp;
        userOp.sender = agent;
        
        vm.prank(entryPoint);
        vm.expectRevert("Insufficient USDC balance");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 1e15);
    }

    function testPostOp() public {
        uint256 maxUsdcCost = 5000000;
        bytes memory context = abi.encode(agent, maxUsdcCost);
        uint256 actualGasCost = 1e15;

        usdc.mint(agent, 3300000);
        vm.prank(agent);
        usdc.approve(address(paymaster), 3300000);

        vm.prank(entryPoint);
        paymaster.postOp(PostOpMode.opSucceeded, context, actualGasCost);

        assertEq(usdc.balanceOf(agent), 0);
        assertEq(usdc.balanceOf(address(paymaster)), 3300000);
    }
    
    function testPostOpCapped() public {
        uint256 maxUsdcCost = 2000000;
        bytes memory context = abi.encode(agent, maxUsdcCost);
        uint256 actualGasCost = 1e15; 

        usdc.mint(agent, 2000000);
        vm.prank(agent);
        usdc.approve(address(paymaster), 2000000);

        vm.prank(entryPoint);
        paymaster.postOp(PostOpMode.opSucceeded, context, actualGasCost);

        assertEq(usdc.balanceOf(agent), 0);
        assertEq(usdc.balanceOf(address(paymaster)), 2000000);
    }

    function testPostOpNotEntryPoint() public {
        vm.prank(address(0x444));
        vm.expectRevert("Paymaster: caller must be EntryPoint");
        paymaster.postOp(PostOpMode.opSucceeded, "", 0);
    }

    function testWithdrawUSDC() public {
        usdc.mint(address(paymaster), 1000);
        paymaster.withdrawUSDC(owner, 1000);
        assertEq(usdc.balanceOf(owner), 1000);
        assertEq(usdc.balanceOf(address(paymaster)), 0);
    }
}
