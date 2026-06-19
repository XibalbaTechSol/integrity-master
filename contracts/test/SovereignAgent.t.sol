// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/core/SovereignAgent.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MockFactorySA is ERC721 {
    constructor() ERC721("Mock", "MCK") {}
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}

contract FailingTarget {
    fallback() external payable {
        revert("Target failed");
    }
}

contract SovereignAgentTest is Test {
    SovereignAgent agent;
    MockFactorySA factory;
    
    address controller;
    uint256 controllerPk;
    address newController;
    address oracle = address(0x222);
    address entryPoint = address(0x333);
    uint256 tokenId = 1;

    function setUp() public {
        (controller, controllerPk) = makeAddrAndKey("controller");
        newController = address(0x555);

        factory = new MockFactorySA();
        factory.mint(controller, tokenId);

        agent = new SovereignAgent("AgentAlias", controller, oracle, tokenId, address(factory), entryPoint);
    }

    function test_ConstructorSetup() public {
        assertEq(agent.agentAlias(), "AgentAlias");
        assertEq(agent.factory(), address(factory));
        assertEq(agent.identityTokenId(), tokenId);
        assertEq(agent.entryPoint(), entryPoint);
        assertEq(agent.ais(), 300);
        assertEq(agent.tier(), 1);
        assertTrue(agent.hasRole(agent.DEFAULT_ADMIN_ROLE(), controller));
        assertTrue(agent.hasRole(agent.ORACLE_ROLE(), oracle));
    }

    function test_ValidateUserOp_Success() public {
        IAccount.UserOperation memory op;
        op.sender = address(agent);
        op.nonce = 0;
        
        bytes32 userOpHash = keccak256("testHash");
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(controllerPk, ethSignedHash);
        op.signature = abi.encodePacked(r, s, v);

        // Fund agent so it can pay missingAccountFunds
        vm.deal(address(agent), 1 ether);

        vm.prank(entryPoint);
        uint256 validationData = agent.validateUserOp(op, userOpHash, 0.1 ether);
        assertEq(validationData, 0); // SIG_VALIDATION_SUCCESS
        assertEq(entryPoint.balance, 0.1 ether);
    }

    function test_ValidateUserOp_Fail_BadSignature() public {
        IAccount.UserOperation memory op;
        
        bytes32 userOpHash = keccak256("testHash");
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        
        // Sign with non-controller key
        (, uint256 badPk) = makeAddrAndKey("bad");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(badPk, ethSignedHash);
        op.signature = abi.encodePacked(r, s, v);

        vm.prank(entryPoint);
        uint256 validationData = agent.validateUserOp(op, userOpHash, 0);
        assertEq(validationData, 1); // SIG_VALIDATION_FAILED
    }

    function test_ValidateUserOp_NotEntryPoint() public {
        IAccount.UserOperation memory op;
        bytes32 userOpHash = keccak256("testHash");
        
        vm.expectRevert("SovereignAgent: caller must be EntryPoint");
        agent.validateUserOp(op, userOpHash, 0);
    }

    function test_Execute_Success() public {
        address target = address(0x999);
        bytes memory data = abi.encodeWithSignature("someFunc()");

        vm.prank(entryPoint);
        agent.execute(target, 0, data);
    }

    function test_Execute_Fail() public {
        FailingTarget target = new FailingTarget();

        vm.prank(entryPoint);
        vm.expectRevert("Target failed");
        agent.execute(address(target), 0, "");
    }

    function test_Execute_NotEntryPoint() public {
        vm.expectRevert("SovereignAgent: caller must be EntryPoint");
        agent.execute(address(0x1), 0, "");
    }

    function test_UpdateAIS_Success() public {
        vm.prank(oracle);
        agent.updateAIS(800, 2);
        assertEq(agent.ais(), 800);
        assertEq(agent.tier(), 2);
    }

    function test_UpdateAIS_NotOracle() public {
        vm.prank(controller);
        vm.expectRevert(abi.encodeWithSignature("AccessControlUnauthorizedAccount(address,bytes32)", controller, agent.ORACLE_ROLE()));
        agent.updateAIS(800, 2);
    }

    function test_UpdateAIS_OutOfBounds_Low() public {
        vm.prank(oracle);
        vm.expectRevert("AIS out of bounds");
        agent.updateAIS(299, 1);
    }

    function test_UpdateAIS_OutOfBounds_High() public {
        vm.prank(oracle);
        vm.expectRevert("AIS out of bounds");
        agent.updateAIS(1001, 1);
    }

    function test_RotateController_Success() public {
        vm.prank(controller);
        agent.rotateController(newController);
        
        assertTrue(agent.hasRole(agent.DEFAULT_ADMIN_ROLE(), newController));
        assertFalse(agent.hasRole(agent.DEFAULT_ADMIN_ROLE(), controller));
    }

    function test_RotateController_NotNFTHolder() public {
        vm.prank(newController);
        vm.expectRevert("Caller does not own the Identity NFT.");
        agent.rotateController(newController);
    }
}
