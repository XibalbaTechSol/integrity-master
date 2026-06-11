// @ts-nocheck
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  XIBALBA SHIELD — ITK Testnet Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 1. Deploy AuditShield
  console.log("[1/5] Deploying AuditShield.sol...");
  const AuditShield = await ethers.getContractFactory("AuditShield");
  const auditShield = await AuditShield.deploy();
  await auditShield.waitForDeployment();
  const auditShieldAddr = await auditShield.getAddress();
  console.log(`  ✓ AuditShield deployed at: ${auditShieldAddr}\n`);

  // 2. Deploy ReputationSBT
  console.log("[2/5] Deploying ReputationSBT.sol...");
  const ReputationSBT = await ethers.getContractFactory("ReputationSBT");
  const reputationSBT = await ReputationSBT.deploy();
  await reputationSBT.waitForDeployment();
  const reputationSBTAddr = await reputationSBT.getAddress();
  console.log(`  ✓ ReputationSBT deployed at: ${reputationSBTAddr}\n`);

  // 3. Deploy SovereignAgent
  console.log("[3/5] Deploying SovereignAgent.sol...");
  const SovereignAgent = await ethers.getContractFactory("SovereignAgent");
  const sovereignAgent = await SovereignAgent.deploy("ipfs://xibalba-shield/agent-alpha");
  await sovereignAgent.waitForDeployment();
  const sovereignAgentAddr = await sovereignAgent.getAddress();
  console.log(`  ✓ SovereignAgent deployed at: ${sovereignAgentAddr}\n`);

  // 4. Deploy a mock ERC20 for ITK staking, then StakingReputation
  console.log("[4/5] Deploying StakingReputation.sol (using placeholder ITK address)...");
  const StakingReputation = await ethers.getContractFactory("StakingReputation");
  // Use a placeholder zero address for the ITK token — swap in the real address post-deployment
  const stakingReputation = await StakingReputation.deploy("0x0000000000000000000000000000000000000001");
  await stakingReputation.waitForDeployment();
  const stakingReputationAddr = await stakingReputation.getAddress();
  console.log(`  ✓ StakingReputation deployed at: ${stakingReputationAddr}\n`);

  // 5. Deploy MockPaymaster
  console.log("[5/5] Deploying MockPaymaster.sol...");
  const MockPaymaster = await ethers.getContractFactory("MockPaymaster");
  const mockPaymaster = await MockPaymaster.deploy();
  await mockPaymaster.waitForDeployment();
  const mockPaymasterAddr = await mockPaymaster.getAddress();
  console.log(`  ✓ MockPaymaster deployed at: ${mockPaymasterAddr}\n`);

  // 6. Deploy CoveredEntityRegistry
  console.log("[6/7] Deploying CoveredEntityRegistry.sol...");
  const CoveredEntityRegistry = await ethers.getContractFactory("CoveredEntityRegistry");
  const registry = await CoveredEntityRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`  ✓ CoveredEntityRegistry deployed at: ${registryAddr}\n`);

  // 7. Deploy SmartBAAFactory
  console.log("[7/7] Deploying SmartBAAFactory.sol...");
  const SmartBAAFactory = await ethers.getContractFactory("SmartBAAFactory");
  const factory = await SmartBAAFactory.deploy(registryAddr, "0x0000000000000000000000000000000000000001", stakingReputationAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`  ✓ SmartBAAFactory deployed at: ${factoryAddr}\n`);

  // Link ReputationSBT to SovereignAgent
  console.log("[POST] Linking ReputationSBT to SovereignAgent...");
  const linkTx = await sovereignAgent.setReputationSBT(reputationSBTAddr);
  await linkTx.wait();
  console.log("  ✓ SovereignAgent linked to ReputationSBT\n");

  // Link Factory to StakingReputation
  console.log("[POST] Linking SmartBAAFactory to StakingReputation...");
  const setFactoryTx = await stakingReputation.setFactoryAddress(factoryAddr);
  await setFactoryTx.wait();
  console.log("  ✓ SmartBAAFactory linked to StakingReputation\n");

  // Approve AuditShield target on MockPaymaster
  console.log("[POST] Approving AuditShield as subsidized target on MockPaymaster...");
  const approveTx = await mockPaymaster.approveTarget(auditShieldAddr);
  await approveTx.wait();
  console.log("  ✓ AuditShield approved for gas subsidy\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DEPLOYMENT COMPLETE — Copy addresses to .env:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  AUDIT_SHIELD_ADDRESS=${auditShieldAddr}`);
  console.log(`  REPUTATION_SBT_ADDRESS=${reputationSBTAddr}`);
  console.log(`  SOVEREIGN_AGENT_ADDRESS=${sovereignAgentAddr}`);
  console.log(`  STAKING_REPUTATION_ADDRESS=${stakingReputationAddr}`);
  console.log(`  MOCK_PAYMASTER_ADDRESS=${mockPaymasterAddr}`);
  console.log(`  COVERED_ENTITY_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`  SMART_BAA_FACTORY_ADDRESS=${factoryAddr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
