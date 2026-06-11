import { expect } from "chai";
import { ethers } from "hardhat";

describe("BehavioralCommitment", function () {
  let behavioralCommitment;
  let owner;
  let agent1;
  let agent2;
  let oracle;
  let addr1; // A regular address without a role

  // Hashes for testing
  const ACTION_HASH_1 = ethers.keccak256(ethers.toUtf8Bytes("action_data_1"));
  const POLICY_HASH_1 = ethers.keccak256(ethers.toUtf8Bytes("policy_data_1"));
  const ACTION_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("action_data_2"));
  const POLICY_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("policy_data_2"));

  beforeEach(async function () {
    [owner, agent1, agent2, oracle, addr1] = await ethers.getSigners();

    const BehavioralCommitmentFactory = await ethers.getContractFactory("BehavioralCommitment");
    behavioralCommitment = await BehavioralCommitmentFactory.deploy();

    // Grant roles
    await behavioralCommitment.grantRole(await behavioralCommitment.DEFAULT_ADMIN_ROLE(), owner.address);
    await behavioralCommitment.grantRole(await behavioralCommitment.AGENT_ROLE(), agent1.address);
    await behavioralCommitment.grantRole(await behavioralCommitment.AGENT_ROLE(), agent2.address);
    await behavioralCommitment.grantRole(await behavioralCommitment.ORACLE_ROLE(), oracle.address);
  });

  describe("Deployment and Role Management", function () {
    it("Should set the deployer as DEFAULT_ADMIN_ROLE", async function () {
      expect(await behavioralCommitment.hasRole(await behavioralCommitment.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should grant AGENT_ROLE to agent1 and agent2", async function () {
      expect(await behavioralCommitment.hasRole(await behavioralCommitment.AGENT_ROLE(), agent1.address)).to.be.true;
      expect(await behavioralCommitment.hasRole(await behavioralCommitment.AGENT_ROLE(), agent2.address)).to.be.true;
    });

    it("Should grant ORACLE_ROLE to oracle", async function () {
      expect(await behavioralCommitment.hasRole(await behavioralCommitment.ORACLE_ROLE(), oracle.address)).to.be.true;
    });

    it("Should allow ADMIN to grant and revoke roles", async function () {
      // Grant a new agent role
      await behavioralCommitment.connect(owner).grantAgentRole(addr1.address);
      expect(await behavioralCommitment.hasRole(await behavioralCommitment.AGENT_ROLE(), addr1.address)).to.be.true;

      // Revoke an agent role
      await behavioralCommitment.connect(owner).revokeAgentRole(agent2.address);
      expect(await behavioralCommitment.hasRole(await behavioralCommitment.AGENT_ROLE(), agent2.address)).to.be.false;
    });

    it("Should not allow non-ADMIN to grant or revoke roles", async function () {
      await expect(behavioralCommitment.connect(agent1).grantAgentRole(addr1.address))
        .to.be.revertedWithCustomError(behavioralCommitment, "AccessControlUnauthorizedAccount");

      await expect(behavioralCommitment.connect(oracle).revokeOracleRole(oracle.address))
        .to.be.revertedWithCustomError(behavioralCommitment, "AccessControlUnauthorizedAccount");
    });
  });

  describe("commitAction", function () {
    it("Should allow an agent to commit an action", async function () {
      await expect(behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_1, POLICY_HASH_1))
        .to.emit(behavioralCommitment, "ActionCommitted")
        .withArgs(agent1.address, 0, ACTION_HASH_1, POLICY_HASH_1, (await ethers.provider.getBlock("latest")).timestamp);

      const commitment = await behavioralCommitment.getCommitment(agent1.address, 0);
      expect(commitment.agentId).to.equal(agent1.address);
      expect(commitment.actionHash).to.equal(ACTION_HASH_1);
      expect(commitment.policyHash).to.equal(POLICY_HASH_1);
      expect(commitment.isValid).to.be.false;
      expect(commitment.timestamp).to.equal((await ethers.provider.getBlock("latest")).timestamp);
    });

    it("Should store multiple commitments for the same agent", async function () {
      await behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_1, POLICY_HASH_1);
      await behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_2, POLICY_HASH_2);

      const commitment0 = await behavioralCommitment.getCommitment(agent1.address, 0);
      expect(commitment0.actionHash).to.equal(ACTION_HASH_1);

      const commitment1 = await behavioralCommitment.getCommitment(agent1.address, 1);
      expect(commitment1.actionHash).to.equal(ACTION_HASH_2);
    });

    it("Should not allow non-agents to commit actions", async function () {
      await expect(behavioralCommitment.connect(addr1).commitAction(ACTION_HASH_1, POLICY_HASH_1))
        .to.be.revertedWithCustomError(behavioralCommitment, "AccessControlUnauthorizedAccount");
    });

    // Devil's Advocate Test: Prevent duplicate (actionHash, policyHash) pairs within a short timeframe
    // This requires implementing a mapping to track recent commitments or a more complex nonce system
    // For MVP, we defer this to future iterations or off-chain logic, but acknowledge the risk.
    it.skip("Should prevent duplicate commitments within a short timeframe", async function () {
      // This test is skipped for MVP but outlines a future security enhancement
      await behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_1, POLICY_HASH_1);
      await expect(behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_1, POLICY_HASH_1))
        .to.be.revertedWith("Duplicate commitment");
    });
  });

  describe("updateCommitmentValidity", function () {
    beforeEach(async function () {
      // Agent commits an action first
      await behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_1, POLICY_HASH_1);
    });

    it("Should allow an oracle to update commitment validity", async function () {
      await expect(behavioralCommitment.connect(oracle).updateCommitmentValidity(agent1.address, 0, true))
        .to.emit(behavioralCommitment, "CommitmentValidityUpdated")
        .withArgs(agent1.address, 0, true);

      const commitment = await behavioralCommitment.getCommitment(agent1.address, 0);
      expect(commitment.isValid).to.be.true;
    });

    it("Should not allow non-oracles to update commitment validity", async function () {
      await expect(behavioralCommitment.connect(agent1).updateCommitmentValidity(agent1.address, 0, true))
        .to.be.revertedWithCustomError(behavioralCommitment, "AccessControlUnauthorizedAccount");

      await expect(behavioralCommitment.connect(addr1).updateCommitmentValidity(agent1.address, 0, true))
        .to.be.revertedWithCustomError(behavioralCommitment, "AccessControlUnauthorizedAccount");
    });

    it("Should revert for invalid agent address", async function () {
      await expect(behavioralCommitment.connect(oracle).updateCommitmentValidity(ethers.ZeroAddress, 0, true))
        .to.be.revertedWith("Invalid agent address");
    });

    it("Should revert for out-of-bounds commitment index", async function () {
      await expect(behavioralCommitment.connect(oracle).updateCommitmentValidity(agent1.address, 999, true))
        .to.be.revertedWith("Commitment index out of bounds");
    });
  });

  describe("getCommitment", function () {
    it("Should retrieve a commitment", async function () {
      await behavioralCommitment.connect(agent1).commitAction(ACTION_HASH_1, POLICY_HASH_1);
      const commitment = await behavioralCommitment.getCommitment(agent1.address, 0);

      expect(commitment.agentId).to.equal(agent1.address);
      expect(commitment.actionHash).to.equal(ACTION_HASH_1);
      expect(commitment.policyHash).to.equal(POLICY_HASH_1);
      expect(commitment.isValid).to.be.false;
      expect(commitment.timestamp).to.be.a("bigint"); // Expect bigint for timestamp
    });

    it("Should revert for invalid agent address", async function () {
      await expect(behavioralCommitment.getCommitment(ethers.ZeroAddress, 0))
        .to.be.revertedWith("Invalid agent address");
    });

    it("Should revert for out-of-bounds commitment index", async function () {
      await expect(behavioralCommitment.getCommitment(agent1.address, 999))
        .to.be.revertedWith("Commitment index out of bounds");
    });
  });
});
