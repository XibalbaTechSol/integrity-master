const hre = require("hardhat");

async function main() {
  const address = "0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556";
  const itkAddress = "0xF448c05074D435d256D6fbc1fC059019B86A5408";
  
  const balance = await hre.ethers.provider.getBalance(address);
  console.log("--------------------------------------------------");
  console.log("Wallet Address:", address);
  console.log("ETH Balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  const itk = await hre.ethers.getContractAt("IntegrityToken", itkAddress);
  const itkBalance = await itk.balanceOf(address);
  console.log("ITK Balance:", hre.ethers.utils.formatEther(itkBalance), "ITK");
  
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
