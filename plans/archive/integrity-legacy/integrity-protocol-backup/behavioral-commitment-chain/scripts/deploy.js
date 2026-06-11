import hre from "hardhat";

async function main() {
  const BehavioralCommitment = await hre.ethers.getContractFactory("BehavioralCommitment");
  const behavioralCommitment = await BehavioralCommitment.deploy();

  await behavioralCommitment.waitForDeployment();

  console.log(
    `BehavioralCommitment deployed to ${behavioralCommitment.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
