const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IntegrityToken Deflationary Mechanics", function () {
  it("Should burn exactly 0.5% on transfers between non-owner/non-contract addresses", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const IntegrityToken = await ethers.getContractFactory("IntegrityToken");
    const itk = await IntegrityToken.deploy(owner.address);
    await itk.deployed();

    const initialAmount = ethers.utils.parseEther("1000");
    await itk.transfer(addr1.address, initialAmount);

    const transferAmount = ethers.utils.parseEther("100");
    // Fee = 0.5% of 100 = 0.5 ITK
    // Burn = 50% of 0.5 = 0.25 ITK
    // Treasury = 50% of 0.5 = 0.25 ITK
    // Net = 100 - 0.5 = 99.5 ITK

    const totalSupplyBefore = await itk.totalSupply();
    await itk.connect(addr1).transfer(addr2.address, transferAmount);
    const totalSupplyAfter = await itk.totalSupply();

    const burned = totalSupplyBefore.sub(totalSupplyAfter);
    const expectedBurn = ethers.utils.parseEther("0.25");

    expect(burned).to.equal(expectedBurn);
    expect(await itk.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("99.5"));
  });
});
