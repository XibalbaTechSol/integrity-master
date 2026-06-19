// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

// ── Core Protocol Contracts ──────────────────────────────────────────────────
import {IntegrityToken}        from "../src/oracle/IntegrityToken.sol";
import {ReputationRegistry}    from "../src/oracle/ReputationRegistry.sol";
import {CCIPReputationBridge}  from "../src/oracle/CCIPReputationBridge.sol";
import {StateAnchor}           from "../src/oracle/StateAnchor.sol";
import {Slasher}               from "../src/oracle/Slasher.sol";

// ── Framework Contracts ──────────────────────────────────────────────────────
import {XibalbaAgentRegistry}  from "../src/framework/XibalbaAgentRegistry.sol";
import {XibalbaNameService}    from "../src/framework/XibalbaNameService.sol";
import {IntegrityProtocol}     from "../src/framework/IntegrityProtocol.sol";
import {ReputationLendingPool} from "../src/framework/ReputationLendingPool.sol";
import {EnterpriseRegistry}    from "../src/framework/EnterpriseRegistry.sol";
import {DomainRegistry}        from "../src/framework/DomainRegistry.sol";
import {AgentFactory}          from "../src/framework/AgentFactory.sol";

// ── Shield (HIPAA layer — deploy contract only, no PHI logic here) ───────────
import {AuditShield}           from "../src/shield/AuditShield.sol";

/**
 * @title Deploy
 * @notice Full deployment of the Integrity Protocol to a target network.
 *
 * @dev Usage:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL \
 *     --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv
 *
 *   Required environment variables (see .env.example):
 *     DEPLOYER_PRIVATE_KEY   — private key of the deployer EOA
 *     CCIP_ROUTER            — Chainlink CCIP Router address for the target chain
 *     LINK_TOKEN             — LINK token address on the target chain
 *     ZK_VERIFIER            — UltraPlonk verifier contract address (deploy separately or mock)
 *
 *   Optional (safe to omit on first deploy — can be set post-deployment):
 *     VALIDATOR_ADDRESS      — initial validator role grantee
 *
 * @dev Chainlink CCIP Router Addresses (Testnet):
 *   Sepolia (ETH):       0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
 *   Amoy (Polygon):      0x9C32fCB86BF0f29Fb7EF58Ed1fFeC39fF4E1B72F
 *   Avalanche Fuji:      0xF694E193200268f9a4868e4Aa017A0118C9a8177
 *
 * @dev Chainlink LINK Token Addresses (Testnet):
 *   Sepolia:             0x779877A7B0D9E8603169DdbD7836e478b4624789
 */
contract Deploy is Script {

    // ── Deployed Addresses (populated post-deployment) ───────────────────────
    IntegrityToken        public itkToken;
    ReputationRegistry    public reputationRegistry;
    XibalbaAgentRegistry  public agentRegistry;
    XibalbaNameService    public nameService;
    IntegrityProtocol     public integrityProtocol;
    ReputationLendingPool public lendingPool;
    EnterpriseRegistry    public enterpriseRegistry;
    DomainRegistry        public domainRegistry;
    AgentFactory          public agentFactory;
    CCIPReputationBridge  public ccipBridge;
    StateAnchor           public stateAnchor;
    Slasher               public slasher;
    AuditShield           public auditShield;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);
        address ccipRouter  = vm.envAddress("CCIP_ROUTER");
        address linkToken   = vm.envAddress("LINK_TOKEN");
        address zkVerifier  = vm.envOr("ZK_VERIFIER", address(0));
        address validator   = vm.envOr("VALIDATOR_ADDRESS", deployer);

        console.log("=== Integrity Protocol Deployment ===");
        console.log("Deployer :", deployer);
        console.log("Network  :", block.chainid);
        console.log("CCIP Router:", ccipRouter);
        console.log("LINK Token :", linkToken);
        console.log("ZK Verifier:", zkVerifier);
        console.log("Validator  :", validator);
        console.log("");

        vm.startBroadcast(deployerKey);

        // ── Step 1: Core Token ────────────────────────────────────────────────
        itkToken = new IntegrityToken(deployer);
        console.log("[1/13] IntegrityToken     :", address(itkToken));

        // ── Step 2: Reputation Oracle Registry ───────────────────────────────
        reputationRegistry = new ReputationRegistry(address(itkToken), deployer);
        console.log("[2/13] ReputationRegistry :", address(reputationRegistry));

        // ── Step 3: State Anchor (ZK Merkle root anchor) ─────────────────────
        stateAnchor = new StateAnchor();
        console.log("[3/13] StateAnchor        :", address(stateAnchor));

        // ── Step 4: CCIP Cross-chain Bridge ──────────────────────────────────
        ccipBridge = new CCIPReputationBridge(ccipRouter, address(reputationRegistry));
        console.log("[4/13] CCIPBridge         :", address(ccipBridge));

        // ── Step 5: Slasher is deployed AFTER IntegrityProtocol (dependency) ─
        // Placeholder — deployed below after IntegrityProtocol is available
        console.log("[5/13] Slasher            : (deployed post-IntegrityProtocol)");

        // ── Step 6: On-chain Agent NFT Registry ──────────────────────────────
        agentRegistry = new XibalbaAgentRegistry(address(itkToken), deployer);
        console.log("[6/13] AgentRegistry      :", address(agentRegistry));

        // ── Step 7: Name Service (ENS-style agent aliases) ───────────────────
        nameService = new XibalbaNameService(deployer);
        console.log("[7/13] NameService        :", address(nameService));

        // ── Step 8: Core Integrity Protocol ──────────────────────────────────
        integrityProtocol = new IntegrityProtocol(address(itkToken));
        console.log("[8/13] IntegrityProtocol  :", address(integrityProtocol));

        // ── Step 9: Lending Pool (reputation-backed credit) ──────────────────
        lendingPool = new ReputationLendingPool(
            address(reputationRegistry),
            address(itkToken)
        );
        console.log("[9/13] LendingPool        :", address(lendingPool));

        // ── Step 10: Enterprise Registry ─────────────────────────────────────
        enterpriseRegistry = new EnterpriseRegistry();
        console.log("[10/13] EnterpriseRegistry:", address(enterpriseRegistry));

        // ── Step 11: Domain Registry ──────────────────────────────────────────
        domainRegistry = new DomainRegistry(deployer);
        console.log("[11/13] DomainRegistry    :", address(domainRegistry));

        // ── Step 12: Agent Factory ────────────────────────────────────────────
        // entryPoint: use ERC-4337 EntryPoint (or deployer address for testnet)
        agentFactory = new AgentFactory(deployer);
        console.log("[12/13] AgentFactory      :", address(agentFactory));

        // ── Step 13: Audit Shield (domain-agnostic audit anchoring layer) ─────
        auditShield = new AuditShield();
        console.log("[13/13] AuditShield       :", address(auditShield));

        // ── Post-Deployment: Slasher (requires IntegrityProtocol + Registry) ──
        slasher = new Slasher(address(integrityProtocol), address(reputationRegistry));
        console.log("[+] Slasher               :", address(slasher));

        // ── Post-Deployment Configuration ────────────────────────────────────

        // Wire CCIP + ZK configs into ReputationRegistry
        reputationRegistry.setCCIPConfig(ccipRouter, linkToken);
        if (zkVerifier != address(0)) {
            reputationRegistry.setZKConfigs(address(stateAnchor), zkVerifier);
        }

        // Grant BRIDGE_ROLE to the CCIP bridge contract
        reputationRegistry.grantRole(
            reputationRegistry.BRIDGE_ROLE(),
            address(ccipBridge)
        );

        // Grant VALIDATOR_ROLE to the designated validator
        reputationRegistry.grantRole(
            reputationRegistry.VALIDATOR_ROLE(),
            validator
        );

        // Grant ORACLE_ROLE on AgentRegistry to IntegrityProtocol
        agentRegistry.grantRole(
            agentRegistry.ORACLE_ROLE(),
            address(integrityProtocol)
        );

        vm.stopBroadcast();

        // ── Deployment Summary ────────────────────────────────────────────────
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Chain ID          :", block.chainid);
        console.log("IntegrityToken    :", address(itkToken));
        console.log("ReputationRegistry:", address(reputationRegistry));
        console.log("CCIPBridge        :", address(ccipBridge));
        console.log("StateAnchor       :", address(stateAnchor));
        console.log("Slasher           :", address(slasher));
        console.log("AgentRegistry     :", address(agentRegistry));
        console.log("NameService       :", address(nameService));
        console.log("IntegrityProtocol :", address(integrityProtocol));
        console.log("LendingPool       :", address(lendingPool));
        console.log("EnterpriseRegistry:", address(enterpriseRegistry));
        console.log("DomainRegistry    :", address(domainRegistry));
        console.log("AgentFactory      :", address(agentFactory));
        console.log("AuditShield       :", address(auditShield));
    }
}
