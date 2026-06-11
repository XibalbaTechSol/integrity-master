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
    
    address public coveredEntity = address(0x1);
    address public businessAssociate = address(0x2);
    address public oracle = address(0x3);
    address public controller = address(0x4);
    
    bytes32 public documentHash = keccak256("HIPAA_BAA_TEXT_V1");
    string public uri = "https://xibalba.io/baa/v1";
    uint256 public stakeAmount = 1000 * 10**18;

    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant BAA_TYPEHASH = keccak256(
        "BAA(address coveredEntity,address businessAssociate,bytes32 documentHash,string uri,uint256 stakedITK,address controller)"
    );

    function setUp() public {
        itk = new MockITK();
        smartBaa = new SmartBAA(address(itk), oracle);
        
        // Setup initial balance for BA
        itk.transfer(businessAssociate, 10000 * 10**18);
        
        vm.prank(businessAssociate);
        itk.approve(address(smartBaa), type(uint256).max);

        // The EIP712 contract exposes a DOMAIN_SEPARATOR() function
        DOMAIN_SEPARATOR = smartBaa.DOMAIN_SEPARATOR();
    }

    function testProposeBAA() public {
        vm.prank(businessAssociate);
        bytes32 baaId = smartBaa.proposeBAA(coveredEntity, documentHash, uri, stakeAmount, controller);
        
        (address ce, address ba, bytes32 hash, string memory u, SmartBAA.BAAStatus status, uint256 stake, uint256 dispute, address ctrl) = smartBaa.baas(baaId);
        
        assertEq(ce, coveredEntity);
        assertEq(ba, businessAssociate);
        assertEq(hash, documentHash);
        assertEq(u, uri);
        assertEq(uint(status), uint(SmartBAA.BAAStatus.Pending));
        assertEq(stake, stakeAmount);
        assertEq(dispute, 0);
        assertEq(ctrl, controller);
        assertEq(itk.balanceOf(address(smartBaa)), stakeAmount);
    }

    function testSignBAA() public {
        // Private key 1 corresponds to address(vm.addr(1))
        address ceAddress = vm.addr(1);

        vm.prank(businessAssociate);
        bytes32 baaId = smartBaa.proposeBAA(ceAddress, documentHash, uri, stakeAmount, controller);

        // Generate EIP-712 signature for Covered Entity
        bytes32 structHash = keccak256(abi.encode(
            BAA_TYPEHASH,
            ceAddress,
            businessAssociate,
            documentHash,
            keccak256(bytes(uri)),
            stakeAmount,
            controller
        ));

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(ceAddress);
        smartBaa.signBAA(baaId, signature);

        assertEq(uint(smartBaa.getBAAStatus(ceAddress, businessAssociate)), uint(SmartBAA.BAAStatus.Active));
    }

    function testSlashAndRevoke() public {
        // Private key 1 corresponds to address(vm.addr(1))
        address ceAddress = vm.addr(1);

        // Setup signed BAA
        vm.prank(businessAssociate);
        bytes32 baaId = smartBaa.proposeBAA(ceAddress, documentHash, uri, stakeAmount, controller);

        bytes32 structHash = keccak256(abi.encode(
            BAA_TYPEHASH,
            ceAddress,
            businessAssociate,
            documentHash,
            keccak256(bytes(uri)),
            stakeAmount,
            controller
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(ceAddress);
        smartBaa.signBAA(baaId, signature);

        // Oracle initiates slash
        vm.prank(oracle);
        smartBaa.initiateSlash(baaId, "PHI_EXFILTRATION_DETECTED");
        assertEq(uint(smartBaa.getBAAStatus(ceAddress, businessAssociate)), uint(SmartBAA.BAAStatus.Breached));

        // Try to finalize early
        vm.expectRevert("Dispute window still open");
        smartBaa.finalizeSlash(baaId);

        // Fast forward 3 days
        vm.warp(block.timestamp + 3 days + 1);

        uint256 ceInitialBalance = itk.balanceOf(ceAddress);
        smartBaa.finalizeSlash(baaId);

        assertEq(itk.balanceOf(ceAddress), ceInitialBalance + stakeAmount);
        assertEq(itk.balanceOf(address(smartBaa)), 0);
    }

    function testRecovery() public {
        vm.prank(businessAssociate);
        bytes32 baaId = smartBaa.proposeBAA(coveredEntity, documentHash, uri, stakeAmount, controller);

        address newBA = address(0x5);
        vm.prank(controller);
        smartBaa.recoverBusinessAssociate(baaId, newBA);

        (, address ba,,,,,,) = smartBaa.baas(baaId);
        assertEq(ba, newBA);
    }
}
