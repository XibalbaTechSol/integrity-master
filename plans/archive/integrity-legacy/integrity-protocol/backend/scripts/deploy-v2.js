const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Starting deployment of Integrity Protocol v2.0 (Decentralized Architecture)...");
  console.log("Deployer Address:", deployer.address);

  // 1. Deploy IntegrityToken (ITK)
  const ITK = await hre.ethers.getContractFactory("IntegrityToken");
  const token = await ITK.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ IntegrityToken (ITK) deployed to:", tokenAddress);

  // 2. Deploy ReputationRegistry (Decentralized)
  const Registry = await hre.ethers.getContractFactory("ReputationRegistry");
  const registry = await Registry.deploy(tokenAddress, deployer.address); // Admin is deployer
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ ReputationRegistry (Decentralized) deployed to:", registryAddress);

  // 3. Deploy AgentFactory
  const Factory = await hre.ethers.getContractFactory("AgentFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ AgentFactory deployed to:", factoryAddress);

  // 4. Deploy IntegrityProtocol
  const Protocol = await hre.ethers.getContractFactory("IntegrityProtocol");
  const protocol = await Protocol.deploy(tokenAddress);
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log("✅ IntegrityProtocol deployed to:", protocolAddress);

  console.log("\n--- V2 DEPLOYMENT SUMMARY ---");
  console.log(`ITK_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`REPUTATION_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`AGENT_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`INTEGRITY_PROTOCOL_ADDRESS=${protocolAddress}`);
  console.log("-----------------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
