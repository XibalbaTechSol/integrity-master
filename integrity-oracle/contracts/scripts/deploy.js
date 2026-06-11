const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy IntegrityToken (ITK)
  const IntegrityToken = await hre.ethers.getContractFactory("IntegrityToken");
  const itk = await IntegrityToken.deploy(deployer.address);
  await itk.waitForDeployment();
  const itkAddress = await itk.getAddress();
  console.log("IntegrityToken deployed to:", itkAddress);

  // 2. Deploy ReputationRegistry
  const ReputationRegistry = await hre.ethers.getContractFactory("ReputationRegistry");
  const registry = await ReputationRegistry.deploy(itkAddress, deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ReputationRegistry deployed to:", registryAddress);

  // 3. Deploy StateAnchor
  const StateAnchor = await hre.ethers.getContractFactory("StateAnchor");
  const anchor = await StateAnchor.deploy();
  await anchor.waitForDeployment();
  const anchorAddress = await anchor.getAddress();
  console.log("StateAnchor deployed to:", anchorAddress);

  // Note: Further setup like `registry.setZKConfigs()` would happen here.
  console.log("Deployment complete! Base L2 integration ready.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
