// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {IntegrityRegistry} from "../src/IntegrityRegistry.sol";
import {StateAnchor} from "../src/StateAnchor.sol";

/// @title Deploy
/// @notice Deploys IntegrityRegistry and StateAnchor to Base Sepolia.
/// @dev Usage:
///   export PRIVATE_KEY=0x...
///   export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        uint256 stakeThreshold = vm.envOr("STAKE_THRESHOLD", uint256(0.001 ether));

        vm.startBroadcast(deployerKey);

        // 1. Deploy IntegrityRegistry
        IntegrityRegistry registry = new IntegrityRegistry(stakeThreshold);
        console2.log("IntegrityRegistry deployed at:", address(registry));
        console2.log("  stakeThreshold:", stakeThreshold);

        // 2. Deploy StateAnchor
        StateAnchor anchor = new StateAnchor();
        console2.log("StateAnchor deployed at:", address(anchor));

        vm.stopBroadcast();

        // Summary
        console2.log("");
        console2.log("=== Deployment Summary ===");
        console2.log("  Network:            Base Sepolia (84532)");
        console2.log("  IntegrityRegistry:  ", address(registry));
        console2.log("  StateAnchor:        ", address(anchor));
        console2.log("  Owner:              ", vm.addr(deployerKey));
    }
}
