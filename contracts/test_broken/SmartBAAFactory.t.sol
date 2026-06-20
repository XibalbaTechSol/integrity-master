// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/shield/SmartBAAFactory.sol";
import "../src/shield/CoveredEntityRegistry.sol";
import "../src/shield/StakingReputation.sol";
import "./mocks/MockERC20.sol";

contract SmartBAAFactoryTest is Test {
    SmartBAAFactory public factory;
    CoveredEntityRegistry public registry;
    StakingReputation public vault;
    MockERC20 public token;

    address public owner = address(1);
    address public ce = address(2);
    address public ba = address(3);

    event BAADeployed(address indexed ce, address indexed baaAddress);

    function setUp() public {
        vm.startPrank(owner);
        registry = new CoveredEntityRegistry();
        token = new MockERC20();
        vault = new StakingReputation(address(token));
        factory = new SmartBAAFactory(address(registry), address(token), address(vault));
        
        vault.setFactoryAddress(address(factory));
        registry.registerEntity(ce, "metadata");
        vm.stopPrank();
    }

    function testDeploySmartBAA() public {
        vm.prank(ce);
        vm.expectEmit(true, false, false, false);
        emit BAADeployed(ce, address(0));
        address baa = factory.deploySmartBAA(ba, "hash", bytes32(0), 1000);

        assertTrue(baa != address(0));
        address[] memory baas = factory.getBAAs(ce);
        assertEq(baas.length, 1);
        assertEq(baas[0], baa);

        assertTrue(vault.authorizedBAAs(baa));
    }

    function testDeploySmartBAANotRegistered() public {
        vm.prank(ba);
        vm.expectRevert("Not a registered Covered Entity");
        factory.deploySmartBAA(ba, "hash", bytes32(0), 1000);
    }
}
