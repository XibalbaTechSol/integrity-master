import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org");
  const txHash = "0xb939f582eb938c1e0aa871d2c019c444b322c8c03f1a6859e11dc46949802833";
  
  console.log("🔍 Validating transaction manually with ethers.js");
  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    console.log("❌ Transaction not found.");
    return;
  }
  console.log("✅ Transaction Found, From:", tx.from);
  
  const receipt = await provider.getTransactionReceipt(txHash);
  if (receipt && receipt.status === 1) {
    console.log("✅ Transaction SUCCESSFUL");
  } else {
    console.log("❌ Transaction FAILED or Pending.");
  }
}
main().catch(console.error);
