const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Configuring contracts with the account:", deployer.address);

  const registryAddress = "0x765D12651DA806239675911d1908b02189DeEc88";
  const itkAddress = "0x2fE2D055Ac894538CCFB2146eA18a604f874FDEE";
  const anchorAddress = "0x93e705c63c3c6F517B6fa214CA115c9cF222f75E";
  const oracleAddress = "0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556";

  const ReputationRegistry = await hre.ethers.getContractAt("ReputationRegistry", registryAddress);
  const IntegrityToken = await hre.ethers.getContractAt("IntegrityToken", itkAddress);

  // 1. Grant VALIDATOR_ROLE to the Oracle address
  const VALIDATOR_ROLE = await ReputationRegistry.VALIDATOR_ROLE();
  console.log("Granting VALIDATOR_ROLE to:", oracleAddress);
  const tx1 = await ReputationRegistry.grantRole(VALIDATOR_ROLE, oracleAddress);
  await tx1.wait();
  console.log("VALIDATOR_ROLE granted.");

  // 2. Set StateAnchor in the Registry
  console.log("Setting StateAnchor to:", anchorAddress);
  const tx2 = await ReputationRegistry.setZKConfigs(anchorAddress, "0x0000000000000000000000000000000000000000");
  await tx2.wait();
  console.log("StateAnchor set.");

  // 3. Transfer ITK tokens to the Oracle address for faucet use
  const amount = hre.ethers.parseEther("100000"); // 100k ITK
  console.log("Transferring 100,000 ITK to Oracle...");
  const tx3 = await IntegrityToken.transfer(oracleAddress, amount);
  await tx3.wait();
  console.log("ITK transferred.");

  console.log("Finalization complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
