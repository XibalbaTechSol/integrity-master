// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/framework/XibalbaNameService.sol";

contract XibalbaNameServiceTest is Test {
    XibalbaNameService xns;
    address admin = address(this);
    address agent = address(0x111);

    function setUp() public {
        xns = new XibalbaNameService(admin);
    }

    function test_Register_Success() public {
        xns.register("agent.intg", agent);
        
        (address owner, uint256 registeredAt, bool isRevoked) = xns.registry("agent.intg");
        assertEq(owner, agent);
        assertEq(xns.getPrimaryHandle(agent), "agent.intg");
        assertFalse(isRevoked);
        assertEq(xns.resolve("agent.intg"), agent);
    }

    function test_Register_AlreadyRegistered() public {
        xns.register("agent.intg", agent);
        vm.expectRevert("Handle already registered");
        xns.register("agent.intg", address(0x222));
    }

    function test_Register_InvalidAgent() public {
        vm.expectRevert("Invalid agent address");
        xns.register("agent.intg", address(0));
    }

    function test_Register_SecondaryHandle() public {
        xns.register("primary.intg", agent);
        xns.register("secondary.intg", agent);

        assertEq(xns.getPrimaryHandle(agent), "primary.intg"); // Not overwritten
    }

    function test_Revoke_Success() public {
        xns.register("agent.intg", agent);
        xns.revoke("agent.intg");
        
        (,, bool isRevoked) = xns.registry("agent.intg");
        assertTrue(isRevoked);
        assertEq(xns.getPrimaryHandle(agent), "");
        assertEq(xns.resolve("agent.intg"), address(0));
    }

    function test_Revoke_NotFound() public {
        vm.expectRevert("Handle not found");
        xns.revoke("nonexistent.intg");
    }

    function test_Revoke_SecondaryHandle() public {
        xns.register("primary.intg", agent);
        xns.register("secondary.intg", agent);
        
        xns.revoke("secondary.intg");
        assertEq(xns.getPrimaryHandle(agent), "primary.intg"); // Not cleared
    }
}
