const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Starting production-ready deployment of Integrity Protocol...");
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy IntegrityToken (ITK)
  const ITK = await hre.ethers.getContractFactory("IntegrityToken");
  const token = await ITK.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ IntegrityToken (ITK) deployed to:", tokenAddress);

  // 2. Deploy ReputationRegistry
  const Registry = await hre.ethers.getContractFactory("ReputationRegistry");
  const registry = await Registry.deploy(tokenAddress, deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ ReputationRegistry deployed to:", registryAddress);

  // 3. Deploy IntegrityProtocol
  const Protocol = await hre.ethers.getContractFactory("IntegrityProtocol");
  const protocol = await Protocol.deploy(tokenAddress);
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log("✅ IntegrityProtocol deployed to:", protocolAddress);

  // 4. Deploy Slasher (Phase 1: Programmable Slashing)
  const Slasher = await hre.ethers.getContractFactory("Slasher");
  const slasher = await Slasher.deploy(protocolAddress, registryAddress);
  await slasher.waitForDeployment();
  const slasherAddress = await slasher.getAddress();
  console.log("✅ Slasher deployed to:", slasherAddress);

  // 5. Deploy StateAnchor (Phase 2: ZK Moat)
  const StateAnchor = await hre.ethers.getContractFactory("StateAnchor");
  const stateAnchor = await StateAnchor.deploy();
  await stateAnchor.waitForDeployment();
  const stateAnchorAddress = await stateAnchor.getAddress();
  console.log("✅ StateAnchor deployed to:", stateAnchorAddress);

  // 6. Deploy ReputationLendingPool (Phase 3: DeFi)
  const Lending = await hre.ethers.getContractFactory("ReputationLendingPool");
  const lending = await Lending.deploy(registryAddress, tokenAddress);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("✅ ReputationLendingPool deployed to:", lendingAddress);

  // Setup ZK Configs in Registry (Verifier is placeholder for now)
  const MOCK_VERIFIER = "0x0000000000000000000000000000000000000000";
  await registry.setZKConfigs(stateAnchorAddress, MOCK_VERIFIER);
  console.log("⚙️  ZK Configs set in ReputationRegistry");

  console.log("\n--- DEPLOYMENT SUMMARY ---");
  console.log(`ITK_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`REPUTATION_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`INTEGRITY_PROTOCOL_ADDRESS=${protocolAddress}`);
  console.log(`SLASHER_ADDRESS=${slasherAddress}`);
  console.log(`STATE_ANCHOR_ADDRESS=${stateAnchorAddress}`);
  console.log(`LENDING_POOL_ADDRESS=${lendingAddress}`);
  console.log("--------------------------\n");

  // Initial setup: Grant tokens to common test agents
  const demoAgents = [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  // Hardhat Account #2
  ];

  console.log("Seeding test agents with ITK...");
  for (const addr of demoAgents) {
      const amount = hre.ethers.parseEther("10000");
      await token.transfer(addr, amount);
      console.log(`Sent 10000 ITK to ${addr}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
