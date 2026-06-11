const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("IntegrityProtocol Hash Anchor Integrity", function () {
  it("Should store the correct integrity hash when a deal is completed", async function () {
    const [owner, initiator, performer] = await ethers.getSigners();

    // Deploy Protocol
    const IntegrityToken = await ethers.getContractFactory("IntegrityToken");
    const itk = await IntegrityToken.deploy(owner.address);
    await itk.deployed();

    const IntegrityProtocol = await ethers.getContractFactory("IntegrityProtocol");
    const protocol = await IntegrityProtocol.deploy(itk.address);
    await protocol.deployed();

    // Setup Deal
    const amount = ethers.utils.parseEther("100");
    await itk.transfer(initiator.address, amount);
    await itk.connect(initiator).approve(protocol.address, amount);
    
    const tx = await protocol.connect(initiator).initiateDeal(performer.address, amount);
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'DealInitiated');
    const dealId = event.args.dealId;

    // Complete Handshake
    await itk.transfer(protocol.address, amount);
    const integrityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("mock_hash"));
    await protocol.connect(owner).completeHandshake(dealId, integrityHash);

    const deal = await protocol.deals(dealId);
    expect(deal.integrityHash).to.equal(integrityHash);
    expect(deal.completed).to.be.true;
  });
});
