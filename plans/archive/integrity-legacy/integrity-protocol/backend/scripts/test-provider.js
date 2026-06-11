import hre from "hardhat";

async function main() {
  console.log("HRE network:", hre.network.name);
  console.log("HRE provider exists:", !!hre.network.provider);
  // Attempting to access ethers via the network provider, which is a common pattern in newer hardhat versions
  try {
     console.log("ethers:", !!hre.ethers);
  } catch(e) {
     console.log("hre.ethers error:", e.message);
  }
}
main().catch(console.error);
