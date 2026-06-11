import hre from "hardhat";

async function main() {
  const txHash = "0xb939f582eb938c1e0aa871d2c019c444b322c8c03f1a6859e11dc46949802833";
  console.log("--------------------------------------------------");
  console.log("🔍 VALIDATING BLOCKCHAIN TRANSACTION");
  console.log("Tx Hash:", txHash);
  console.log("--------------------------------------------------");

  const provider = hre.network.provider;
  const tx = await hre.ethers.provider.getTransaction(txHash);
  if (!tx) {
    console.log("❌ Transaction not found on-chain yet.");
    return;
  }

  console.log("✅ Transaction Found!");
  const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
  if (receipt && receipt.status === 1) {
    console.log("✅ Transaction SUCCESSFUL (Status: 1)");
  } else {
    console.log("❌ Transaction FAILED or Pending.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
