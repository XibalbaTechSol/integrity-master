// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SmartBAA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock ITK", "mITK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

/**
 * @title SmartBAATest
 * @notice Validates SmartBAA lifecycle: proposal, EIP-712 signing, and slashing.
 * @dev Run with: forge test --match-path test/SmartBAA.t.sol
 */
contract SmartBAATest is Test {
    SmartBAA public smartBAA;
    MockToken public itk;

    address public ce;
    uint256 public cePrivateKey;
    address public ba = address(0x2);
    address public oracle = address(0x3);

    function setUp() public {
        (ce, cePrivateKey) = makeAddrAndKey("coveredEntity");
        itk = new MockToken();
        smartBAA = new SmartBAA(address(itk), oracle);

        itk.transfer(ba, 1000 * 10**18);
        vm.prank(ba);
        itk.approve(address(smartBAA), type(uint256).max);
    }

    function testProposeAndSignBAA() public {
        bytes32 docHash = keccak256("BAA Content");

        vm.prank(ba);
        bytes32 baaId = smartBAA.proposeBAA(ce, docHash, "ipfs://baa", 100 * 10**18, ba);

        // Sign with EIP-712
        bytes32 structHash = keccak256(abi.encode(
            keccak256("BAA(address coveredEntity,address businessAssociate,bytes32 documentHash,string uri,uint256 stakedITK,address controller)"),
            ce,
            ba,
            docHash,
            keccak256(bytes("ipfs://baa")),
            100 * 10**18,
            ba
        ));

        bytes32 digest = _hashTypedData(smartBAA.DOMAIN_SEPARATOR(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(cePrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(ce);
        smartBAA.signBAA(baaId, signature);

        assertEq(uint(smartBAA.getBAAStatus(ce, ba)), uint(SmartBAA.BAAStatus.Active));
    }

    function testSlashBAA() public {
        // Setup Active BAA
        bytes32 docHash = keccak256("BAA Content");
        vm.prank(ba);
        bytes32 baaId = smartBAA.proposeBAA(ce, docHash, "ipfs://baa", 100 * 10**18, ba);

        // Mocking signBAA (just change status directly for speed or use same logic as above)
        // I'll reuse the signing logic to be robust.
        bytes32 structHash = keccak256(abi.encode(
            keccak256("BAA(address coveredEntity,address businessAssociate,bytes32 documentHash,string uri,uint256 stakedITK,address controller)"),
            ce,
            ba,
            docHash,
            keccak256(bytes("ipfs://baa")),
            100 * 10**18,
            ba
        ));
        bytes32 digest = _hashTypedData(smartBAA.DOMAIN_SEPARATOR(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(cePrivateKey, digest);
        vm.prank(ce);
        smartBAA.signBAA(baaId, abi.encodePacked(r, s, v));

        // Slash
        vm.prank(oracle);
        smartBAA.initiateSlash(baaId, "Data Leak Detected");

        assertEq(uint(smartBAA.getBAAStatus(ce, ba)), uint(SmartBAA.BAAStatus.Breached));

        // Wait 4 days
        vm.warp(block.timestamp + 4 days);

        uint256 balanceBefore = itk.balanceOf(ce);
        smartBAA.finalizeSlash(baaId);
        uint256 balanceAfter = itk.balanceOf(ce);

        assertEq(balanceAfter - balanceBefore, 100 * 10**18);
    }

    function _hashTypedData(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}
