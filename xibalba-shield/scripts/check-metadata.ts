// @ts-nocheck
import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const reputationSBTAddress = process.env.REPUTATION_SBT_ADDRESS;
  if (!reputationSBTAddress) {
    console.error("Error: REPUTATION_SBT_ADDRESS not set");
    process.exit(1);
  }

  const ReputationSBT = await ethers.getContractFactory("ReputationSBT");
  const reputationSBT = ReputationSBT.attach(reputationSBTAddress);

  const [deployer] = await ethers.getSigners();
  
  console.log("Minting a test SBT...");
  const mintTx = await reputationSBT.mint(deployer.address, 95, 98, 92);
  await mintTx.wait();

  const tokenId = 0; // First token
  const uri = await reputationSBT.tokenURI(tokenId);
  console.log("\nToken ID 0 URI:");
  console.log(uri);

  const jsonBase64 = uri.split(",")[1];
  const decoded = Buffer.from(jsonBase64, 'base64').toString('utf-8');
  console.log("\nDecoded Metadata:");
  console.log(JSON.stringify(JSON.parse(decoded), null, 2));
}

main().catch(console.error);
