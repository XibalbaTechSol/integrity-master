const hre = require("hardhat");

async function main() {
  const itkAddress = "0xF448c05074D435d256D6fbc1fC059019B86A5408";
  const registryAddress = "0x0bd07324980856841e83FF95460CcD46EB9B590a";

  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying NoCodeFactory with account:", deployer.address);

  const NoCodeFactory = await hre.ethers.getContractFactory("NoCodeFactory");
  const factory = await NoCodeFactory.deploy(registryAddress, itkAddress);
  await factory.deployed();

  console.log("✅ NoCodeFactory deployed to:", factory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
