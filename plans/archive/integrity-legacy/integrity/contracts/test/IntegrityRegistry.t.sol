// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "../src/IntegrityRegistry.sol";

contract IntegrityRegistryTest is Test {
    IntegrityRegistry public registry;
    address public owner = address(0x1);
    address public agent1 = address(0x2);
    uint256 public initialStake = 1 ether;

    function setUp() public {
        vm.prank(owner);
        registry = new IntegrityRegistry(initialStake);
    }

    function test_RegisterAgent() public {
        string memory did = "did:xibalba:agent1";
        string memory fingerprint = "hw-fingerprint-1";
        uint256 reputation = 1000;

        vm.deal(agent1, 2 ether);
        vm.prank(agent1);
        registry.registerAgent{value: 1.5 ether}(did, fingerprint, reputation);

        IntegrityRegistry.Agent memory agent = registry.getAgent(did);
        assertEq(agent.did, did);
        assertEq(agent.reputation, reputation);
        assertEq(agent.stake, 1.5 ether);
        assertTrue(agent.active);
    }

    function test_FailRegisterInsufficientStake() public {
        string memory did = "did:xibalba:agent2";
        vm.deal(agent1, 0.5 ether);
        vm.prank(agent1);
        
        vm.expectRevert(abi.encodeWithSelector(IntegrityRegistry.InsufficientStake.selector, 0.5 ether, 1 ether));
        registry.registerAgent{value: 0.5 ether}(did, "fp", 1000);
    }

    function test_UpdateReputation() public {
        string memory did = "did:xibalba:agent1";
        vm.deal(agent1, 1 ether);
        vm.prank(agent1);
        registry.registerAgent{value: 1 ether}(did, "fp", 1000);

        bytes memory proof = "some-zk-proof";
        vm.prank(owner);
        registry.updateReputation(did, 2000, proof);

        IntegrityRegistry.Agent memory agent = registry.getAgent(did);
        assertEq(agent.reputation, 2000);
    }

    function test_Slash() public {
        string memory did = "did:xibalba:agent1";
        vm.deal(agent1, 1 ether);
        vm.prank(agent1);
        registry.registerAgent{value: 1 ether}(did, "fp", 1000);

        uint256 ownerBalanceBefore = owner.balance;
        vm.prank(owner);
        registry.slash(did, 0.5 ether, "violation");

        IntegrityRegistry.Agent memory agent = registry.getAgent(did);
        assertEq(agent.stake, 0.5 ether);
        assertEq(owner.balance, ownerBalanceBefore + 0.5 ether);
    }
}
