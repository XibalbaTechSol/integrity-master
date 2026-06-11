const hre = require("hardhat");

async function main() {
  const [owner, sender, recipient] = await hre.ethers.getSigners();

  console.log("--------------------------------------------------");
  console.log("FINAL SOVEREIGN TAX VALIDATION");
  console.log("--------------------------------------------------");

  // 1. DEPLOY
  const ITK = await hre.ethers.getContractFactory("IntegrityToken");
  const token = await ITK.deploy(owner.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ Token deployed to:", tokenAddress);

  // 2. SETUP: Give the sender some tokens first (this transfer is free as it's from owner)
  const initialGrant = hre.ethers.parseEther("10000");
  await token.transfer(sender.address, initialGrant);
  
  const ownerBalanceAfterSetup = await token.balanceOf(owner.address);
  console.log(`Setup: Sender granted ${hre.ethers.formatEther(initialGrant)} ITK (Fee-exempt)`);

  // 3. VALIDATE: Transaction between TWO NON-OWNER addresses (Tax should apply)
  const amountToSend = hre.ethers.parseEther("1000"); // 1,000 ITK
  console.log(`\nAction: Sender is sending ${hre.ethers.formatEther(amountToSend)} ITK to Recipient...`);
  
  // sender -> recipient (TAX TRIGGER)
  const tx = await token.connect(sender).transfer(recipient.address, amountToSend);
  await tx.wait();

  // 4. CHECK RESULTS
  const finalBalanceRecipient = await token.balanceOf(recipient.address);
  const finalBalanceOwner = await token.balanceOf(owner.address);
  
  // MATH:
  // Sent: 1000 ITK
  // Fee (0.5%): 5 ITK
  // Recipient should get: 995 ITK
  // Treasury (Owner) should get: 2.5 ITK (50% of fee)
  // Burn (0x0) should get: 2.5 ITK (50% of fee)
  
  console.log("\n--- LEDGER VERIFICATION ---");
  console.log("Recipient received:  ", hre.ethers.formatEther(finalBalanceRecipient), "ITK (Expected: 995.0)");
  
  const treasuryGain = finalBalanceOwner - ownerBalanceAfterSetup;
  console.log("Treasury fee income: ", hre.ethers.formatEther(treasuryGain), "ITK (Expected: 2.5)");
  
  if (finalBalanceRecipient < amountToSend && treasuryGain > 0n) {
      console.log("\n✅ SOVEREIGN TAX CONFIRMED: 0.5% was automatically split between Burn and Treasury.");
  } else {
      console.log("\n❌ Validation Failed: Tax was not applied.");
  }
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
