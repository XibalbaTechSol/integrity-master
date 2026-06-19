// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MedicalCreditLine.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockITK is ERC20 {
    constructor() ERC20("Integrity Token", "ITK") {
        _mint(msg.sender, 10000000 * 10**18);
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

contract MedicalCreditLineTest is Test {
    MedicalCreditLine public credit;
    MockITK public itk;
    MockSmartBAA public smartBaa;

    address public hospital = address(0x1);
    address public lender = address(0x2);
    address public supplier = address(0x3);
    address public oracle = address(0x4);

    function setUp() public {
        itk = new MockITK();
        smartBaa = new MockSmartBAA();
        credit = new MedicalCreditLine(address(itk), address(smartBaa), oracle);

        itk.transfer(lender, 1000000 * 10**18);
        vm.prank(lender);
        itk.approve(address(credit), type(uint256).max);

        itk.transfer(hospital, 10000 * 10**18);
        vm.prank(hospital);
        itk.approve(address(credit), type(uint256).max);
    }

    function testEstablishCreditLineTier1() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(oracle);
        credit.setAgentTier(hospital, 1);

        vm.prank(lender);
        bytes32 lineId = credit.establishCreditLine(hospital, 10000 * 10**18, 500);

        (address _h, address _l, uint256 _limit, uint256 _bal,,) = credit.creditLines(lineId);
        assertEq(_h, hospital);
        assertEq(_l, lender);
        assertEq(_limit, 10000 * 10**18);
        assertEq(_bal, 0);
    }

    function testEstablishCreditLineTier1RevertLimit() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(oracle);
        credit.setAgentTier(hospital, 1);

        vm.prank(lender);
        vm.expectRevert("Tier 1 capped at 10k credit limits");
        credit.establishCreditLine(hospital, 10001 * 10**18, 500);
    }

    function testEstablishCreditLineTier2() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        credit.establishCreditLine(hospital, 100000 * 10**18, 500);
    }

    function testEstablishCreditLineTier2RevertLimit() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        vm.expectRevert("Tier 2 capped at 100k credit limits");
        credit.establishCreditLine(hospital, 100001 * 10**18, 500);
    }

    function testEstablishCreditLineRevertNoBAA() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Pending);
        vm.prank(lender);
        vm.expectRevert("Active BAA required");
        credit.establishCreditLine(hospital, 1000 * 10**18, 500);
    }

    function testSetAgentTierRevertUnauthorized() public {
        vm.prank(lender);
        vm.expectRevert("Unauthorized");
        credit.setAgentTier(hospital, 2);
    }

    function testTriggerJITPayment() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        bytes32 lineId = credit.establishCreditLine(hospital, 10000 * 10**18, 500);

        vm.prank(oracle);
        credit.triggerJITPayment(lineId, supplier, 1000 * 10**18);

        (,,, uint256 _bal,,) = credit.creditLines(lineId);
        assertEq(_bal, 1000 * 10**18);
        assertEq(itk.balanceOf(supplier), 1000 * 10**18);
    }

    function testTriggerJITPaymentRevertLimitExceeded() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        bytes32 lineId = credit.establishCreditLine(hospital, 10000 * 10**18, 500);

        vm.prank(oracle);
        vm.expectRevert("Credit limit exceeded");
        credit.triggerJITPayment(lineId, supplier, 10001 * 10**18);
    }

    function testTriggerJITPaymentRevertNotOracle() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        bytes32 lineId = credit.establishCreditLine(hospital, 10000 * 10**18, 500);

        vm.prank(lender);
        vm.expectRevert("Only Oracle can trigger JIT");
        credit.triggerJITPayment(lineId, supplier, 1000 * 10**18);
    }

    function testRepay() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        bytes32 lineId = credit.establishCreditLine(hospital, 10000 * 10**18, 500);

        vm.prank(oracle);
        credit.triggerJITPayment(lineId, supplier, 1000 * 10**18);

        vm.prank(hospital);
        credit.repay(lineId, 500 * 10**18);

        (,,, uint256 _bal,,) = credit.creditLines(lineId);
        assertEq(_bal, 500 * 10**18);
    }
    
    function testRepayRevertNotHospital() public {
        smartBaa.setStatus(hospital, lender, MockSmartBAA.BAAStatus.Active);
        vm.prank(oracle);
        credit.setAgentTier(hospital, 2);

        vm.prank(lender);
        bytes32 lineId = credit.establishCreditLine(hospital, 10000 * 10**18, 500);

        vm.prank(oracle);
        credit.triggerJITPayment(lineId, supplier, 1000 * 10**18);

        vm.prank(lender);
        vm.expectRevert("Only hospital can repay");
        credit.repay(lineId, 500 * 10**18);
    }
}
