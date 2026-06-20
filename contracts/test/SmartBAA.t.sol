// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SmartBAA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockITK is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract SmartBAATest is Test {
    SmartBAA public smartBaa;
    MockITK public itk;

    address public ce = address(0x1); // Covered Entity
    address public ba = address(0x2); // Business Associate
    uint256 public baPrivateKey = 0xA11CE;
    uint256 public cePrivateKey = 0xB0B;
    address public oracle = address(0x3);

    bytes32 public docHash = keccak256("BAA Document v1.0");
    string public uri = "https://xibalba.solutions/baa/1";

    // EIP-712 TypeHash from SmartBAA.sol
    bytes32 private constant BAA_TYPEHASH = keccak256(
        "BAA(address coveredEntity,address businessAssociate,bytes32 documentHash,string uri,uint256 stakedITK,address controller)"
    );

    function setUp() public {
        ce = vm.addr(cePrivateKey);
        ba = vm.addr(baPrivateKey);

        itk = new MockITK();
        smartBaa = new SmartBAA(address(itk), oracle);

        itk.transfer(ba, 1000 * 10**18);
    }

    /**
     * @notice Validates that a Business Associate can propose a BAA with a stake.
     */
    function test_ProposeBAA() public {
        vm.startPrank(ba);
        itk.approve(address(smartBaa), 500 * 10**18);
        bytes32 baaId = smartBaa.proposeBAA(ce, docHash, uri, 500 * 10**18, ba);
        vm.stopPrank();

        (address coveredEntity, address businessAssociate,,,,, ,) = smartBaa.baas(baaId);
        assertEq(coveredEntity, ce);
        assertEq(businessAssociate, ba);
        assertEq(itk.balanceOf(address(smartBaa)), 500 * 10**18);
    }

    /**
     * @notice Validates that a Covered Entity can sign a proposed BAA using EIP-712.
     */
    function test_SignBAA() public {
        vm.startPrank(ba);
        itk.approve(address(smartBaa), 500 * 10**18);
        bytes32 baaId = smartBaa.proposeBAA(ce, docHash, uri, 500 * 10**18, ba);
        vm.stopPrank();

        // Prepare EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            BAA_TYPEHASH,
            ce,
            ba,
            docHash,
            keccak256(bytes(uri)),
            500 * 10**18,
            ba
        ));

        bytes32 domainSeparator = smartBaa.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(cePrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(ce);
        smartBaa.signBAA(baaId, signature);

        assertEq(uint(smartBaa.getBAAStatus(ce, ba)), uint(SmartBAA.BAAStatus.Active));
    }

    /**
     * @notice Validates the slashing mechanism initiated by the Oracle.
     */
    function test_Slashing() public {
        // Setup: Propose and Sign
        vm.startPrank(ba);
        itk.approve(address(smartBaa), 500 * 10**18);
        bytes32 baaId = smartBaa.proposeBAA(ce, docHash, uri, 500 * 10**18, ba);
        vm.stopPrank();

        bytes32 structHash = keccak256(abi.encode(
            BAA_TYPEHASH,
            ce,
            ba,
            docHash,
            keccak256(bytes(uri)),
            500 * 10**18,
            ba
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", smartBaa.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(cePrivateKey, digest);
        vm.prank(ce);
        smartBaa.signBAA(baaId, abi.encodePacked(r, s, v));

        // Initiate Slash
        vm.prank(oracle);
        smartBaa.initiateSlash(baaId, "HIPAA violation detected via telemetry");

        assertEq(uint(smartBaa.getBAAStatus(ce, ba)), uint(SmartBAA.BAAStatus.Breached));

        // Finalize Slash after 3 days
        skip(3 days + 1);
        smartBaa.finalizeSlash(baaId);

        assertEq(itk.balanceOf(ce), 500 * 10**18);
    }
}
