const hre = require("hardhat");

async function main() {
  const txHash = "0xb939f582eb938c1e0aa871d2c019c444b322c8c03f1a6859e11dc46949802833";
  console.log("--------------------------------------------------");
  console.log("🔍 VALIDATING BLOCKCHAIN TRANSACTION");
  console.log("Tx Hash:", txHash);
  console.log("--------------------------------------------------");

  const tx = await hre.ethers.provider.getTransaction(txHash);
  if (!tx) {
    console.log("❌ Transaction not found on-chain yet. It might still be propagating.");
    return;
  }

  console.log("✅ Transaction Found!");
  console.log("From:", tx.from);
  console.log("To:", tx.to);
  console.log("Block Number:", tx.blockNumber);

  const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
  if (receipt && receipt.status === 1) {
    console.log("✅ Transaction SUCCESSFUL (Status: 1)");
    
    // Decode logs if possible
    const registryAddress = "0xf3C04eF49C7773650d21f2660D2e3953B0ec8482";
    const Registry = await hre.ethers.getContractAt("ReputationRegistry", registryAddress);
    
    console.log("\nDecining logs...");
    for (const log of receipt.logs) {
      try {
        const parsed = Registry.interface.parseLog(log);
        if (parsed) {
          console.log(`✨ Event: ${parsed.name}`);
          console.log(`   - Agent: ${parsed.args[0]}`);
          if (parsed.name === "AISUpdated") {
            console.log(`   - Old Score: ${parsed.args[1].toString()}`);
            console.log(`   - New Score: ${parsed.args[2].toString()}`);
          }
        }
      } catch (e) {
        // Not a registry event or parsing error
      }
    }
  } else {
    console.log("❌ Transaction FAILED or Pending.");
  }
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
