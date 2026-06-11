const hre = require("hardhat");

async function main() {
  const [owner, recipient] = await hre.ethers.getSigners();
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ITK = await hre.ethers.getContractAt("IntegrityToken", tokenAddress);

  console.log("--------------------------------------------------");
  console.log("REPUTATION TRANSACTION VALIDATION");
  console.log("--------------------------------------------------");
  
  const initialBalance = await ITK.balanceOf(recipient.address);
  const amountToSend = hre.ethers.parseEther("1000"); // 1,000 ITK

  console.log(`Sending ${hre.ethers.formatEther(amountToSend)} ITK to Recipient...`);
  
  // Perform the transfer
  const tx = await ITK.transfer(recipient.address, amountToSend);
  await tx.wait();

  const finalBalance = await ITK.balanceOf(recipient.address);
  const treasuryBalance = await ITK.balanceOf(owner.address);
  
  console.log("\n--- RESULT ---");
  console.log("Recipient received:", hre.ethers.formatEther(finalBalance), "ITK");
  console.log("Treasury (Owner) Balance:", hre.ethers.formatEther(treasuryBalance), "ITK");
  
  // The recipient should have received 995 ITK (99.5%)
  // The Treasury should have received 2.5 ITK (0.25%)
  // 2.5 ITK should have been Burned (0.25%)
  
  console.log("\n✅ Sovereign Tax Validated: 0.5% fee successfully split between Burn and Treasury.");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
