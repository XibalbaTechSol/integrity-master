const hre = require("hardhat");

async function main() {
  const registryAddress = "0xf3C04eF49C7773650d21f2660D2e3953B0ec8482";
  const Registry = await hre.ethers.getContractAt("ReputationRegistry", registryAddress);
  
  const agentAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const profile = await Registry.getAgent(agentAddress);
  
  console.log("--------------------------------------------------");
  console.log("🔍 CHECKING ON-CHAIN AIS FOR AGENT:", agentAddress);
  console.log("--------------------------------------------------");
  console.log("AIS Score:", profile[0].toString());
  console.log("Staked:", hre.ethers.formatEther(profile[1]), "ITK");
  console.log("Verified:", profile[2]);
  console.log("Tier:", profile[3].toString());
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
