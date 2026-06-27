// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/shield/EHRGate.sol";
import "../src/shield/SmartBAA.sol";
import "../src/shield/SmartBAAFactory.sol";
import "../src/shield/CoveredEntityRegistry.sol";
import "../src/core/MockITK.sol";
import "../src/shield/StakingReputation.sol";

contract SeedAnvil is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock ITK Token
        MockITK itk = new MockITK();

        // 2. Deploy StakingReputation
        StakingReputation stakingVault = new StakingReputation(address(itk));

        // 3. Deploy CoveredEntityRegistry
        CoveredEntityRegistry registry = new CoveredEntityRegistry();

        // 4. Deploy SmartBAAFactory
        SmartBAAFactory factory = new SmartBAAFactory(address(registry), address(itk), address(stakingVault));
        stakingVault.setFactoryAddress(address(factory));

        // 5. Deploy EHRGate
        EHRGate ehrGate = new EHRGate();

        // --- Seed Data ---
        address patient = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address agent1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        address agent2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        
        // Grant access
        bytes32 record1 = keccak256("EHR_001");
        ehrGate.grantAccess(record1, agent1);

        bytes32 record2 = keccak256("EHR_002");
        ehrGate.grantAccess(record2, agent2);
        ehrGate.revokeAccess(record2, agent2); // Revoked

        // Verify & Log Access
        vm.stopBroadcast();
        
        vm.startBroadcast(0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d);
        ehrGate.verifyAndLogAccess(patient, record1);
        vm.stopBroadcast();

        vm.startBroadcast(0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a);
        ehrGate.verifyAndLogAccess(patient, record2); // Should fail/log false
        vm.stopBroadcast();

        console.log("EHRGate deployed at:", address(ehrGate));
        console.log("SmartBAAFactory deployed at:", address(factory));
    }
}
