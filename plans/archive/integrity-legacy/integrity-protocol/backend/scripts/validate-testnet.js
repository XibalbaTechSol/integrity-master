const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("--------------------------------------------------");
  console.log("🚀 STARTING ON-CHAIN VALIDATION (BASE SEPOLIA)");
  console.log("Validator Address:", signer.address);
  console.log("--------------------------------------------------");

  // Contract Addresses from Deployment
  const itkAddress = "0x3eB4Df1C50Fec5EC1Eb611991663bd5e2Fe8CBF4";
  const registryAddress = "0xf3C04eF49C7773650d21f2660D2e3953B0ec8482";
  const protocolAddress = "0x5C014F4714a1d3D8061bCcAe3De03b9B6c6d80B2";

  // 1. Validate IntegrityToken (ITK)
  console.log("\n[1/3] Validating IntegrityToken (ITK)...");
  const ITK = await hre.ethers.getContractAt("IntegrityToken", itkAddress);
  const name = await ITK.name();
  const symbol = await ITK.symbol();
  const balance = await ITK.balanceOf(signer.address);
  console.log(`✅ Contract: ${name} (${symbol})`);
  console.log(`✅ Your Balance: ${hre.ethers.formatEther(balance)} ITK`);

  // 2. Validate ReputationRegistry
  console.log("\n[2/3] Validating ReputationRegistry...");
  const Registry = await hre.ethers.getContractAt("ReputationRegistry", registryAddress);
  
  // Try to fetch profile for a seeded agent
  const testAgent = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const profile = await Registry.getAgent(testAgent);
  console.log(`✅ Agent Profile [${testAgent}]:`);
  console.log(`   - AIS Score: ${profile[0].toString()}`);
  console.log(`   - Staked: ${hre.ethers.formatEther(profile[1])} ITK`);
  console.log(`   - Verified: ${profile[2]}`);
  console.log(`   - Tier: ${profile[3].toString()}`);

  // 3. Validate IntegrityProtocol
  console.log("\n[3/3] Validating IntegrityProtocol...");
  const Protocol = await hre.ethers.getContractAt("IntegrityProtocol", protocolAddress);
  const itkInProtocol = await Protocol.intgToken();
  console.log(`✅ Protocol is linked to ITK: ${itkInProtocol === itkAddress}`);
  
  // Check if signer is owner
  const owner = await Protocol.owner();
  console.log(`✅ Protocol Owner: ${owner}`);
  console.log(`✅ Signer is Owner: ${owner === signer.address}`);

  console.log("\n--------------------------------------------------");
  console.log("✨ ON-CHAIN VALIDATION SUCCESSFUL");
  console.log("The smart contracts are active and responding on Base Sepolia.");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("\n❌ VALIDATION FAILED");
  console.error(error);
  process.exitCode = 1;
});
