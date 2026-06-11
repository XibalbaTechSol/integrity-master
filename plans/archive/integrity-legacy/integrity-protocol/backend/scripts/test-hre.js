import hre from "hardhat";

async function main() {
  console.log("HRE keys:", Object.keys(hre));
  // Check if ethers is hidden somewhere in the HRE
  if (hre.ethers) {
    console.log("Found hre.ethers");
  } else {
    console.log("hre.ethers is undefined");
  }
}
main();
