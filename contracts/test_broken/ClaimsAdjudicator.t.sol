// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ClaimsAdjudicator.sol";
import "../src/SmartBAA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockITK is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract MockSmartBAA {
    enum BAAStatus { Pending, Active, Terminated, Breached }
    mapping(address => mapping(address => BAAStatus)) public status;
    function setStatus(address ce, address ba, BAAStatus s) external {
        status[ce][ba] = s;
    }
    function getBAAStatus(address ce, address ba) external view returns (BAAStatus) {
        return status[ce][ba];
    }
}

contract ClaimsAdjudicatorTest is Test {
    ClaimsAdjudicator public adjudicator;
    MockITK public itk;
    MockSmartBAA public smartBaa;
    
    address public insurer = address(0x1);
    address public provider = address(0x2);
    address public oracle = address(0x3);

    function setUp() public {
        itk = new MockITK();
        smartBaa = new MockSmartBAA();
        adjudicator = new ClaimsAdjudicator(address(itk), address(smartBaa), oracle);
        
        itk.transfer(insurer, 10000 * 10**18);
        vm.prank(insurer);
        itk.approve(address(adjudicator), type(uint256).max);
    }

    function testFundPolicySuccess() public {
        smartBaa.setStatus(insurer, provider, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(insurer);
        bytes32 policyId = adjudicator.fundPolicy(provider, 1000 * 10**18);
        
        (address _insurer, address _provider, uint256 _balance, bool _active) = adjudicator.policies(policyId);
        assertEq(_insurer, insurer);
        assertEq(_provider, provider);
        assertEq(_balance, 1000 * 10**18);
        assertTrue(_active);
        assertEq(itk.balanceOf(address(adjudicator)), 1000 * 10**18);
    }

    function testFundPolicyRevertsNoBAA() public {
        smartBaa.setStatus(insurer, provider, MockSmartBAA.BAAStatus.Pending);
        vm.prank(insurer);
        vm.expectRevert("Active BAA required");
        adjudicator.fundPolicy(provider, 1000 * 10**18);
    }

    function testAdjudicateClaimSuccess() public {
        smartBaa.setStatus(insurer, provider, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(insurer);
        bytes32 policyId = adjudicator.fundPolicy(provider, 1000 * 10**18);

        vm.prank(oracle);
        adjudicator.adjudicateClaim(policyId, 500 * 10**18, bytes32(0));
        
        (,, uint256 _balance,) = adjudicator.policies(policyId);
        assertEq(_balance, 500 * 10**18);
        assertEq(itk.balanceOf(provider), 500 * 10**18);
    }

    function testAdjudicateClaimRevertsNotOracle() public {
        smartBaa.setStatus(insurer, provider, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(insurer);
        bytes32 policyId = adjudicator.fundPolicy(provider, 1000 * 10**18);

        vm.prank(insurer);
        vm.expectRevert("Only Oracle can adjudicate");
        adjudicator.adjudicateClaim(policyId, 500 * 10**18, bytes32(0));
    }

    function testAdjudicateClaimRevertsNotActive() public {
        bytes32 policyId = keccak256(abi.encodePacked(insurer, provider));
        vm.prank(oracle);
        vm.expectRevert("Policy not active");
        adjudicator.adjudicateClaim(policyId, 500 * 10**18, bytes32(0));
    }

    function testAdjudicateClaimRevertsInsufficientEscrow() public {
        smartBaa.setStatus(insurer, provider, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(insurer);
        bytes32 policyId = adjudicator.fundPolicy(provider, 400 * 10**18);

        vm.prank(oracle);
        vm.expectRevert("Insufficient escrow");
        adjudicator.adjudicateClaim(policyId, 500 * 10**18, bytes32(0));
    }
}
