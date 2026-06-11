const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Association Registries with the account:", deployer.address);

  const oracleAddress = "0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556";

  // 1. Deploy DomainRegistry
  console.log("Deploying DomainRegistry...");
  const DomainRegistry = await hre.ethers.getContractFactory("DomainRegistry");
  const domainRegistry = await DomainRegistry.deploy(deployer.address);
  await domainRegistry.waitForDeployment();
  const domainRegistryAddress = await domainRegistry.getAddress();
  console.log("DomainRegistry deployed to:", domainRegistryAddress);

  // 2. Grant VALIDATOR_ROLE to the Oracle
  const VALIDATOR_ROLE = await domainRegistry.VALIDATOR_ROLE();
  console.log("Granting VALIDATOR_ROLE to:", oracleAddress);
  await domainRegistry.grantRole(VALIDATOR_ROLE, oracleAddress);
  console.log("Oracle authorized on DomainRegistry.");

  // 3. Deploy EnterpriseRegistry
  console.log("Deploying EnterpriseRegistry...");
  const EnterpriseRegistry = await hre.ethers.getContractFactory("EnterpriseRegistry");
  const enterpriseRegistry = await EnterpriseRegistry.deploy();
  await enterpriseRegistry.waitForDeployment();
  const enterpriseRegistryAddress = await enterpriseRegistry.getAddress();
  console.log("EnterpriseRegistry deployed to:", enterpriseRegistryAddress);

  console.log("--- Association Registries Deployment Summary ---");
  console.log("- DomainRegistry:", domainRegistryAddress);
  console.log("- EnterpriseRegistry:", enterpriseRegistryAddress);
  console.log("Highest Tier prerequisites now enforceable.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
