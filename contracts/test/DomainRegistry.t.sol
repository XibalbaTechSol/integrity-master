// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/framework/DomainRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract DomainRegistryTest is Test {
    DomainRegistry registry;
    address admin = address(0x111);
    address validator;
    uint256 validatorPk;
    address agent = address(0x333);

    function setUp() public {
        (validator, validatorPk) = makeAddrAndKey("validator");
        registry = new DomainRegistry(admin);
        
        vm.prank(admin);
        registry.grantRole(registry.VALIDATOR_ROLE(), validator);
    }

    function test_LinkDomain_Success() public {
        string memory domain = "xibalba.solutions";
        bytes32 messageHash = keccak256(abi.encodePacked(agent, domain));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(validatorPk, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        registry.linkDomain(agent, domain, signature);
        assertEq(registry.getDomain(agent), domain);
    }

    function test_LinkDomain_InvalidSignature() public {
        string memory domain = "xibalba.solutions";
        bytes32 messageHash = keccak256(abi.encodePacked(agent, domain));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        (, uint256 badPk) = makeAddrAndKey("bad");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(badPk, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid Oracle signature.");
        registry.linkDomain(agent, domain, signature);
    }
}
