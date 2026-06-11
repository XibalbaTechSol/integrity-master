/**
 * Xibalba Integrity SDK — Blockchain Module
 *
 * Handles all on-chain interactions with IntegrityProtocol.sol
 * and IntegrityToken.sol (ITK).
 *
 * @module @xibalba/integrity-sdk/blockchain
 */

import { ethers } from "ethers";
import type { AgentProfile } from "./types";

// ─── ABIs (minimal interface for gas efficiency) ─────────────────

const PROTOCOL_ABI = [
  "function initiateDeal(address _performer, uint256 _amount) external returns (bytes32)",
  "function completeHandshake(bytes32 _dealId, bytes32 _integrityHash) external",
  "function deals(bytes32) view returns (address initiator, address performer, uint256 amount, bytes32 integrityHash, bool completed, bool exists)",
  "function dealCount() view returns (uint256)",
  "event DealInitiated(bytes32 indexed dealId, address initiator, address performer, uint256 amount)",
  "event DealCompleted(bytes32 indexed dealId, bytes32 integrityHash)",
];

const REGISTRY_ABI = [
  "function getAgent(address _agent) external view returns (uint256 score, uint256 staked, bool verified)",
  "function stake(uint256 _amount) external",
  "function agents(address) view returns (uint256 ais, uint256 jobCount, uint256 totalStaked, uint256 lastUpdate, bool isVerified)",
];

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

export class IntegrityBlockchain {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private protocolContract?: ethers.Contract;
  private registryContract?: ethers.Contract;
  private tokenContract?: ethers.Contract;

  constructor(
    rpcUrl: string,
    private protocolAddress?: string,
    private registryAddress?: string,
    private tokenAddress?: string,
    privateKey?: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }

    const signerOrProvider = this.signer ?? this.provider;

    if (protocolAddress) {
      this.protocolContract = new ethers.Contract(protocolAddress, PROTOCOL_ABI, signerOrProvider);
    }
    if (registryAddress) {
      this.registryContract = new ethers.Contract(registryAddress, REGISTRY_ABI, signerOrProvider);
    }
    if (tokenAddress) {
      this.tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signerOrProvider);
    }
  }

  // ─── IntegrityProtocol.sol ─────────────────────────────────────

  /**
   * Initiate a deal on-chain. Deposits ITK into escrow.
   *
   * @param performer - Address of the agent performing the work.
   * @param amount - ITK amount (in wei).
   * @returns The deal ID (bytes32) and transaction receipt.
   */
  async initiateDeal(
    performer: string,
    amount: bigint
  ): Promise<{ dealId: string; receipt: ethers.TransactionReceipt }> {
    if (!this.protocolContract || !this.signer) {
      throw new Error("Protocol contract and signer required for initiateDeal.");
    }

    // Auto-approve token spend if needed
    if (this.tokenContract) {
      const signerAddr = await this.signer.getAddress();
      const allowance: bigint = await this.tokenContract.allowance(signerAddr, this.protocolAddress);
      if (allowance < amount) {
        const approveTx = await this.tokenContract.approve(this.protocolAddress, amount);
        await approveTx.wait();
      }
    }

    const tx = await this.protocolContract.initiateDeal(performer, amount);
    const receipt = await tx.wait();

    // Extract dealId from the DealInitiated event
    const iface = new ethers.Interface(PROTOCOL_ABI);
    let dealId = "";
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed?.name === "DealInitiated") {
          dealId = parsed.args[0];
          break;
        }
      } catch {
        // Not our event
      }
    }

    return { dealId, receipt };
  }

  /**
   * Complete a deal and anchor the integrity hash on-chain.
   *
   * @param dealId - Unique deal ID from initiateDeal.
   * @param integrityHash - The 0x-prefixed SHA256 hash from the Xibalba backend.
   * @returns Transaction receipt.
   */
  async completeHandshake(
    dealId: string,
    integrityHash: string
  ): Promise<ethers.TransactionReceipt> {
    if (!this.protocolContract || !this.signer) {
      throw new Error("Protocol contract and signer required for completeHandshake.");
    }

    // Pad or truncate hash to bytes32
    const hashBytes32 = ethers.zeroPadValue(integrityHash.startsWith("0x") ? integrityHash.slice(0, 66) : `0x${integrityHash.slice(0, 64)}`, 32);

    const tx = await this.protocolContract.completeHandshake(dealId, hashBytes32);
    return await tx.wait();
  }

  /**
   * Read a deal's details from the blockchain.
   */
  async getDeal(dealId: string): Promise<{
    initiator: string;
    performer: string;
    amount: bigint;
    integrityHash: string;
    completed: boolean;
    exists: boolean;
  }> {
    if (!this.protocolContract) throw new Error("Protocol contract address required.");

    const [initiator, performer, amount, integrityHash, completed, exists] =
      await this.protocolContract.deals(dealId);

    return { initiator, performer, amount, integrityHash, completed, exists };
  }

  // ─── ReputationRegistry.sol ────────────────────────────────────

  /**
   * Fetch an agent's on-chain reputation profile.
   */
  async getAgentProfile(agentAddress: string): Promise<AgentProfile> {
    if (!this.registryContract) throw new Error("Registry contract address required.");

    const [score, staked, verified] = await this.registryContract.getAgent(agentAddress);

    return {
      address: agentAddress,
      ais: Number(score),
      totalStaked: BigInt(staked),
      isVerified: Boolean(verified),
      jobCount: 0,
      lastUpdate: 0,
    };
  }

  /**
   * Stake ITK tokens to boost the agent's AIS.
   */
  async stake(amount: bigint): Promise<ethers.TransactionReceipt> {
    if (!this.registryContract || !this.signer) {
      throw new Error("Registry contract and signer required for staking.");
    }

    // Auto-approve if registry is set
    if (this.tokenContract && this.registryAddress) {
      const signerAddr = await this.signer.getAddress();
      const allowance: bigint = await this.tokenContract.allowance(signerAddr, this.registryAddress);
      if (allowance < amount) {
        const approveTx = await this.tokenContract.approve(this.registryAddress, amount);
        await approveTx.wait();
      }
    }

    const tx = await this.registryContract.stake(amount);
    return await tx.wait();
  }

  // ─── Token Utilities ───────────────────────────────────────────

  /**
   * Get the ITK token balance for an address.
   */
  async getBalance(address: string): Promise<bigint> {
    if (!this.tokenContract) throw new Error("Token contract address required.");
    return await this.tokenContract.balanceOf(address);
  }
}
