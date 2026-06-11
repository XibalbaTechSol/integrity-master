const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Expanding protocol with the account:", deployer.address);

  const itkAddress = "0x2fE2D055Ac894538CCFB2146eA18a604f874FDEE";
  const registryAddress = "0x765D12651DA806239675911d1908b02189DeEc88";
  const anchorAddress = "0x93e705c63c3c6F517B6fa214CA115c9cF222f75E";

  // 1. Deploy IntegrityProtocol
  console.log("Deploying IntegrityProtocol...");
  const IntegrityProtocol = await hre.ethers.getContractFactory("IntegrityProtocol");
  const protocol = await IntegrityProtocol.deploy(itkAddress);
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log("IntegrityProtocol deployed to:", protocolAddress);

  // 2. Deploy Slasher
  console.log("Deploying Slasher...");
  const Slasher = await hre.ethers.getContractFactory("Slasher");
  const slasher = await Slasher.deploy(protocolAddress, registryAddress);
  await slasher.waitForDeployment();
  const slasherAddress = await slasher.getAddress();
  console.log("Slasher deployed to:", slasherAddress);

  // 3. Configure Registry to trust Slasher for AIS updates (if applicable)
  // In our current contract, Slasher doesn't directly update AIS, it just emits events.
  // But we can grant it VALIDATOR_ROLE if we want it to call updateAIS.
  const ReputationRegistry = await hre.ethers.getContractAt("ReputationRegistry", registryAddress);
  const VALIDATOR_ROLE = await ReputationRegistry.VALIDATOR_ROLE();
  console.log("Granting VALIDATOR_ROLE to Slasher...");
  await ReputationRegistry.grantRole(VALIDATOR_ROLE, slasherAddress);
  console.log("Slasher authorized.");

  console.log("Summary of Expansion:");
  console.log("- IntegrityProtocol:", protocolAddress);
  console.log("- Slasher:", slasherAddress);
  console.log("Phase 2/3 Gap Closed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
