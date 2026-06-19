// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ClinicalTrialBond.sol";
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

contract ClinicalTrialBondTest is Test {
    ClinicalTrialBond public bond;
    MockITK public itk;
    MockSmartBAA public smartBaa;

    address public sponsor = address(0x1);
    address public trialSite = address(0x2);
    address public oracle = address(0x3);

    function setUp() public {
        itk = new MockITK();
        smartBaa = new MockSmartBAA();
        bond = new ClinicalTrialBond(address(itk), address(smartBaa), oracle);

        itk.transfer(trialSite, 10000 * 10**18);
        vm.prank(trialSite);
        itk.approve(address(bond), type(uint256).max);
    }

    function testCreateBondSuccess() public {
        smartBaa.setStatus(sponsor, trialSite, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(sponsor);
        bytes32 bondId = bond.createBond(trialSite, 100, block.timestamp + 30 days, 1000 * 10**18);
        
        (address _sponsor, address _trialSite, uint256 _target, uint256 _current, uint256 _deadline, uint256 _payout, ClinicalTrialBond.BondStatus _status) = bond.bonds(bondId);
        
        assertEq(_sponsor, sponsor);
        assertEq(_trialSite, trialSite);
        assertEq(_target, 100);
        assertEq(_current, 0);
        assertEq(_deadline, block.timestamp + 30 days);
        assertEq(_payout, 1000 * 10**18);
        assertEq(uint(_status), uint(ClinicalTrialBond.BondStatus.Active));
        assertEq(itk.balanceOf(address(bond)), 1000 * 10**18);
    }

    function testCreateBondRevertsNoBAA() public {
        smartBaa.setStatus(sponsor, trialSite, MockSmartBAA.BAAStatus.Pending);
        vm.prank(sponsor);
        vm.expectRevert("Active BAA required");
        bond.createBond(trialSite, 100, block.timestamp + 30 days, 1000 * 10**18);
    }

    function testUpdateEnrollmentAndComplete() public {
        smartBaa.setStatus(sponsor, trialSite, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(sponsor);
        bytes32 bondId = bond.createBond(trialSite, 100, block.timestamp + 30 days, 1000 * 10**18);

        vm.prank(oracle);
        bond.updateEnrollment(bondId, 100);

        (,,,,,, ClinicalTrialBond.BondStatus _status) = bond.bonds(bondId);
        assertEq(uint(_status), uint(ClinicalTrialBond.BondStatus.SuccessfullyCompleted));
        assertEq(itk.balanceOf(trialSite), 10000 * 10**18); // stake returned
    }

    function testUpdateEnrollmentAndPayout() public {
        smartBaa.setStatus(sponsor, trialSite, MockSmartBAA.BAAStatus.Active);
        
        vm.prank(sponsor);
        bytes32 bondId = bond.createBond(trialSite, 100, block.timestamp + 30 days, 1000 * 10**18);

        vm.warp(block.timestamp + 31 days);
        
        vm.prank(oracle);
        bond.updateEnrollment(bondId, 90);

        (,,,,,, ClinicalTrialBond.BondStatus _status) = bond.bonds(bondId);
        assertEq(uint(_status), uint(ClinicalTrialBond.BondStatus.PayoutTriggered));
        assertEq(itk.balanceOf(sponsor), 1000 * 10**18); // sponsor receives payout
    }
    
    function testUpdateEnrollmentRevertsNotOracle() public {
        smartBaa.setStatus(sponsor, trialSite, MockSmartBAA.BAAStatus.Active);
        vm.prank(sponsor);
        bytes32 bondId = bond.createBond(trialSite, 100, block.timestamp + 30 days, 1000 * 10**18);
        
        vm.prank(sponsor);
        vm.expectRevert("Only Oracle can update");
        bond.updateEnrollment(bondId, 100);
    }

    function testUpdateEnrollmentRevertsNotActive() public {
        smartBaa.setStatus(sponsor, trialSite, MockSmartBAA.BAAStatus.Active);
        vm.prank(sponsor);
        bytes32 bondId = bond.createBond(trialSite, 100, block.timestamp + 30 days, 1000 * 10**18);
        
        vm.prank(oracle);
        bond.updateEnrollment(bondId, 100); // completes the bond
        
        vm.prank(oracle);
        vm.expectRevert("Bond not active");
        bond.updateEnrollment(bondId, 110);
    }
}
