// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import {EntryPoint} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {SimpleAccountFactory} from "@account-abstraction/contracts/accounts/SimpleAccountFactory.sol";
import {SimpleAccount} from "@account-abstraction/contracts/accounts/SimpleAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {StablecoinVaultPaymaster} from "../src/StablecoinVaultPaymaster.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPaymaster} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";

// Simple self-contained Mock ERC20 Token for testing
contract MockERC20 is IERC20 {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract StablecoinVaultPaymasterTest is Test {
    EntryPoint public entryPoint;
    SimpleAccountFactory public accountFactory;
    StablecoinVaultPaymaster public paymaster;
    MockERC20 public stablecoin;

    address public owner = address(0x9);
    address public agentOwner = address(0x10);
    uint256 public agentPrivateKey = 0xabc123;
    address public keeper = address(0x11);
    address public beneficiary = address(0x12);

    SimpleAccount public agentAccount;

    function setUp() public {
        // Labelling for easier debugging in Foundry traces
        vm.label(owner, "Owner");
        vm.label(agentOwner, "AgentOwner");
        vm.label(keeper, "Keeper");
        vm.label(beneficiary, "Beneficiary");

        vm.deal(owner, 100 ether);
        vm.startPrank(owner);

        // 1. Deploy Core ERC-4337 EntryPoint
        entryPoint = new EntryPoint();
        vm.label(address(entryPoint), "EntryPoint");

        // 2. Deploy Mock Stablecoin (USDC)
        stablecoin = new MockERC20();
        vm.label(address(stablecoin), "USDC");

        // 3. Deploy Custom Paymaster (StablecoinVaultPaymaster)
        paymaster = new StablecoinVaultPaymaster(entryPoint, stablecoin);
        vm.label(address(paymaster), "Paymaster");

        // 4. Deploy SimpleAccountFactory
        accountFactory = new SimpleAccountFactory(entryPoint);
        vm.label(address(accountFactory), "AccountFactory");

        // Set keeper status and the token price
        paymaster.updateKeeper(keeper, true);
        
        // 1 ETH = 3000 USDC. USDC has 6 decimals, ETH has 18.
        // We set tokenPrice such that: tokenPrice = USDC_per_ETH * 10^decimals
        // In our case: 3000 * 10^6 = 3,000,000,000 (3 * 10^9)
        paymaster.setTokenPrice(3000 * 1e6);

        // Stake/Deposit ETH into EntryPoint to support sponsorship
        paymaster.deposit{value: 10 ether}();
        entryPoint.addStake{value: 1 ether}(1 days);

        vm.stopPrank();

        // 5. Create Smart Account for Agent
        address agentAddress = vm.addr(agentPrivateKey);
        vm.prank(address(accountFactory.senderCreator()));
        agentAccount = accountFactory.createAccount(agentAddress, 0);
        vm.label(address(agentAccount), "AgentSmartAccount");

        // Provide USD liquidity to Agent's Smart Account
        stablecoin.mint(address(agentAccount), 1000 * 1e6); // $1000 USDC

        // Agent approves Paymaster to pull USDC fees
        vm.prank(address(agentAccount));
        stablecoin.approve(address(paymaster), type(uint256).max);
    }

    function testPaymasterInitialization() public view {
        assertEq(address(paymaster.token()), address(stablecoin));
        assertEq(paymaster.tokenPrice(), 3000 * 1e6);
        assertTrue(paymaster.isKeeper(keeper));
    }

    function testSponsorUserOperation() public {
        address agentAddress = vm.addr(agentPrivateKey);

        // Create a UserOperation to transfer 0.1 ETH to beneficiary
        PackedUserOperation memory userOp;
        userOp.sender = address(agentAccount);
        userOp.nonce = entryPoint.getNonce(address(agentAccount), 0);
        
        // InitCode is empty because account is already created
        userOp.initCode = "";
        
        // Set callData to execute a transfer on the smart account
        userOp.callData = abi.encodeWithSignature(
            "execute(address,uint256,bytes)",
            beneficiary,
            0.1 ether,
            ""
        );

        // Standard gas limits for testing UserOperations
        userOp.accountGasLimits = bytes32(abi.encodePacked(uint128(100000), uint128(100000)));
        userOp.preVerificationGas = 50000;
        userOp.gasFees = bytes32(abi.encodePacked(uint128(20 gwei), uint128(20 gwei)));

        // Configure Paymaster sponsorship details
        // paymasterAndData = [paymaster_address (20 bytes) | gas limits (32 bytes) | payload (var)]
        // Since we don't have custom paymaster data payloads, we pad with 32 bytes of 0 for verification gas limit.
        userOp.paymasterAndData = abi.encodePacked(
            address(paymaster),
            uint128(100000), // paymasterVerificationGasLimit
            uint128(100000)  // paymasterPostOpGasLimit
        );

        // Sign the UserOperation
        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, userOpHash);
        userOp.signature = abi.encodePacked(r, s, v);

        // Record initial balances before execution
        uint256 agentUsdcBefore = stablecoin.balanceOf(address(agentAccount));
        uint256 paymasterUsdcBefore = stablecoin.balanceOf(address(paymaster));
        uint256 beneficiaryEthBefore = beneficiary.balance;

        // Funded with some ETH to execute transfers
        vm.deal(address(agentAccount), 1 ether);

        // Handle the operation via EntryPoint
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = userOp;

        entryPoint.handleOps(ops, payable(owner));

        // Verify state updates
        uint256 agentUsdcAfter = stablecoin.balanceOf(address(agentAccount));
        uint256 paymasterUsdcAfter = stablecoin.balanceOf(address(paymaster));
        uint256 beneficiaryEthAfter = beneficiary.balance;

        // Confirm transfer succeeded
        assertEq(beneficiaryEthAfter - beneficiaryEthBefore, 0.1 ether);

        // Confirm agent was billed in USDC, and paymaster accrued the USDC
        assertTrue(agentUsdcAfter < agentUsdcBefore, "Agent was not billed");
        assertTrue(paymasterUsdcAfter > paymasterUsdcBefore, "Paymaster did not accrue USDC");
        assertEq(paymaster.accumulatedVault(), paymasterUsdcAfter - paymasterUsdcBefore);

        // Print final stats
        console.log("Actual USDC transaction fee captured: $%s.%s", 
            paymaster.accumulatedVault() / 1e6, 
            (paymaster.accumulatedVault() % 1e6) / 1e4
        );
    }

    function testAsynchronousKeeperSwap() public {
        // Directly simulate accumulated fees inside the Vault by calling postOp
        vm.prank(owner);
        stablecoin.mint(address(paymaster), 500 * 1e6); // Mint some stablecoin to the paymaster to allow refunds if any

        vm.prank(address(entryPoint));
        paymaster.postOp(
            IPaymaster.PostOpMode.opSucceeded,
            abi.encode(address(0x1), uint256(300 * 1e6)),
            uint256(0.1 ether),
            0
        );
        
        assertEq(paymaster.accumulatedVault(), 300 * 1e6);

        // Trigger batch swap via authorized keeper
        vm.prank(keeper);
        paymaster.triggerBatchedSwap();

        // Confirm vault is asynchronously reset to prevent continuous sandwiching
        assertEq(paymaster.accumulatedVault(), 0);
    }

    function testUnauthorizedKeeperRejection() public {
        vm.prank(owner);
        stablecoin.mint(address(paymaster), 100 * 1e6);
        
        vm.prank(address(entryPoint));
        paymaster.postOp(
            IPaymaster.PostOpMode.opSucceeded,
            abi.encode(address(0x1), uint256(60 * 1e6)),
            uint256(0.02 ether),
            0
        );

        // Unauthorized user attempts to swap
        address hacker = address(0xbad);
        vm.prank(hacker);
        vm.expectRevert("Not authorized keeper");
        paymaster.triggerBatchedSwap();
    }
}
