const hre = require("hardhat");

async function main() {
  const tokenAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
  const ITK = await hre.ethers.getContractAt("IntegrityToken", tokenAddress);
  
  const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const balance = await ITK.balanceOf(testAddress);
  
  console.log("--------------------------------------------------");
  console.log("ITK Token Address:", tokenAddress);
  console.log("Test Wallet Address:", testAddress);
  console.log("ITK Balance:", hre.ethers.formatEther(balance), "ITK");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
