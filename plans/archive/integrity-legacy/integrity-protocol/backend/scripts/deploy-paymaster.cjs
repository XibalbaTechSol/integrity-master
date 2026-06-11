const hre = require("hardhat");

async function main() {
  // Base Sepolia Addresses
  const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const usdcToken = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const itkToken = "0xF448c05074D435d256D6fbc1fC059019B86A5408";
  const swapRouter = "0x94cc0AaC535CCDB3C01d6787D6413C739ae12bc4";
  const treasury = "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556"; // Xibalba Oracle Address

  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying IntegrityPaymaster (Xibalba Shield) with account:", deployer.address);

  const IntegrityPaymaster = await hre.ethers.getContractFactory("IntegrityPaymaster");
  const paymaster = await IntegrityPaymaster.deploy(
    entryPoint,
    usdcToken,
    itkToken,
    swapRouter,
    treasury
  );
  await paymaster.deployed();

  console.log("✅ IntegrityPaymaster deployed to:", paymaster.address);

  // Fund the Paymaster's EntryPoint deposit to sponsor initial transactions
  console.log("💰 Funding Paymaster deposit in EntryPoint...");
  const EntryPointABI = ["function depositTo(address account) public payable"];
  const entryPointContract = new hre.ethers.Contract(entryPoint, EntryPointABI, deployer);
  const tx = await entryPointContract.depositTo(paymaster.address, { value: hre.ethers.utils.parseEther("0.05") }); // Lowered to 0.05 for safety
  await tx.wait();
  console.log("✅ Paymaster deposit funded with 0.05 ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
