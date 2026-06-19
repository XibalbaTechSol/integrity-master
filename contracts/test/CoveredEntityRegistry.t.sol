// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/shield/CoveredEntityRegistry.sol";

contract CoveredEntityRegistryTest is Test {
    CoveredEntityRegistry public registry;
    address public owner = address(1);
    address public nonOwner = address(2);
    address public entity = address(3);

    event EntityRegistered(address indexed entity, string metadataURI);
    event EntityRevoked(address indexed entity);

    function setUp() public {
        vm.prank(owner);
        registry = new CoveredEntityRegistry();
    }

    function testRegisterEntity() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit EntityRegistered(entity, "ipfs://test");
        registry.registerEntity(entity, "ipfs://test");

        assertTrue(registry.isRegistered(entity));
        assertEq(registry.entityMetadata(entity), "ipfs://test");
    }

    function testRegisterEntityNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        registry.registerEntity(entity, "ipfs://test");
    }

    function testRevokeEntity() public {
        vm.prank(owner);
        registry.registerEntity(entity, "ipfs://test");
        assertTrue(registry.isRegistered(entity));

        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit EntityRevoked(entity);
        registry.revokeEntity(entity);

        assertFalse(registry.isRegistered(entity));
    }

    function testRevokeEntityNotOwner() public {
        vm.prank(owner);
        registry.registerEntity(entity, "ipfs://test");

        vm.prank(nonOwner);
        vm.expectRevert();
        registry.revokeEntity(entity);
    }
}
