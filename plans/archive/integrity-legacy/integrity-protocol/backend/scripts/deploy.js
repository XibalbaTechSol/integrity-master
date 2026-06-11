const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying IntegrityToken with the account:", deployer.address);

  const initialOwner = deployer.address;
  const ITK = await hre.ethers.getContractFactory("IntegrityToken");
  
  // Deploy the contract
  const token = await ITK.deploy(initialOwner);

  await token.waitForDeployment();

  console.log("✅ IntegrityToken (ITK) deployed to:", await token.getAddress());
  console.log("Initial Owner set to:", initialOwner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
