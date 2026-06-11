import { ethers } from "hardhat";

async function main() {
  console.log("Ethers found:", !!ethers);
  if (ethers) {
     console.log("Provider exists:", !!ethers.provider);
  }
}

main().catch(console.error);
