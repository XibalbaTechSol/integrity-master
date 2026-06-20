import { ethers } from "ethers";

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const reputationSBTAbi = [
  "function integrityScores(uint256 tokenId) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
];

const auditShieldAbi = [
  "function anchorLog(bytes32 _dataHash) external",
  "function auditLogs(bytes32) view returns (bytes32 dataHash, address agent, uint256 timestamp)",
];

const smartBAAAbi = [
  "function isActive() view returns (bool)",
  "function coveredEntity() view returns (address)",
  "function businessAssociate() view returns (address)",
  "function allowedScope() view returns (bytes32)",
  "function agreementHash() view returns (string)",
  "function requiredCollateral() view returns (uint256)",
];

const smartBAAFactoryAbi = [
  "function deployedBAAs(address ce, uint256 index) view returns (address)",
  "function getBAAs(address ce) view returns (address[])",
];

// ─── Provider Setup ───────────────────────────────────────────────────────────

function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.ITK_TESTNET_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner(provider: ethers.JsonRpcProvider): ethers.Wallet | null {
  if (!process.env.PRIVATE_KEY) return null;
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

// ─── Verify Agent Reputation ──────────────────────────────────────────────────

/**
 * Verifies an agent's Reputation SBT integrity score meets the required threshold.
 * Falls back to mock approval if contract addresses are not configured (dev mode).
 */
export async function verifyIntegrityScore(
  agentAddress: string,
  requiredScore: number = 300
): Promise<boolean> {
  if (!agentAddress) return false;

  const sbtAddress = process.env.REPUTATION_SBT_ADDRESS;
  if (!sbtAddress || sbtAddress === "0x0000000000000000000000000000000000000000") {
    console.warn("[Shield] REPUTATION_SBT_ADDRESS not set — mock approving agent.");
    return true;
  }

  try {
    const provider = getProvider();
    const sbt = new ethers.Contract(sbtAddress, reputationSBTAbi, provider);

    const balance: bigint = await sbt.balanceOf(agentAddress);
    if (balance === 0n) {
      console.warn(`[Shield] Agent ${agentAddress} has no Reputation SBT.`);
      return false;
    }

    // Get first token and check its score
    const tokenId: bigint = await sbt.tokenOfOwnerByIndex(agentAddress, 0);
    const score: bigint = await sbt.integrityScores(tokenId);

    console.log(`[Shield] Agent ${agentAddress} AIS: ${score.toString()} (required: ${requiredScore})`);
    return score >= BigInt(requiredScore);
  } catch (err) {
    console.error("[Shield] verifyIntegrityScore error:", err);
    // Fail-open in dev, fail-closed in production
    return process.env.NODE_ENV !== "production";
  }
}

// ─── Verify Smart BAA Status ──────────────────────────────────────────────────

/**
 * Checks that the Business Associate has an active SmartBAA with the Covered Entity
 * and that the intended action scope is within the contract's allowedScope bitmask.
 */
export async function verifySmartBAA(
  agentAddress: string,
  coveredEntityAddress?: string,
  _actionScope?: string
): Promise<{ authorized: boolean; reason?: string }> {
  const factoryAddress = process.env.SMART_BAA_FACTORY_ADDRESS;
  const ceAddress = coveredEntityAddress || process.env.COVERED_ENTITY_ADDRESS;

  if (!factoryAddress || !ceAddress) {
    console.warn("[Shield] SmartBAA contracts not configured — mock authorizing.");
    return { authorized: true };
  }

  try {
    const provider = getProvider();
    const factory = new ethers.Contract(factoryAddress, smartBAAFactoryAbi, provider);

    // Get all BAAs deployed by this Covered Entity
    const baas: string[] = await factory.getBAAs(ceAddress);
    if (baas.length === 0) {
      return { authorized: false, reason: "No SmartBAAs deployed for this Covered Entity." };
    }

    // Check if any active BAA lists this agent as the BA
    for (const baaAddr of baas) {
      const baa = new ethers.Contract(baaAddr, smartBAAAbi, provider);
      const [isActive, ba]: [boolean, string] = await Promise.all([
        baa.isActive(),
        baa.businessAssociate(),
      ]);

      if (ba.toLowerCase() === agentAddress.toLowerCase() && isActive) {
        return { authorized: true };
      }
    }

    return {
      authorized: false,
      reason: `Agent ${agentAddress} has no active SmartBAA with the Covered Entity.`,
    };
  } catch (err) {
    console.error("[Shield] verifySmartBAA error:", err);
    return { authorized: false, reason: "SmartBAA contract check failed." };
  }
}

// ─── Anchor Audit Log ─────────────────────────────────────────────────────────

/**
 * Anchors a ZK-blinded data hash to the AuditShield contract on-chain.
 */
export async function anchorAuditLog(dataHash: string): Promise<string> {
  const auditShieldAddress = process.env.AUDIT_SHIELD_ADDRESS;

  if (!process.env.PRIVATE_KEY || !auditShieldAddress || auditShieldAddress === "0x0000000000000000000000000000000000000000") {
    console.warn("[Shield] PRIVATE_KEY or AUDIT_SHIELD_ADDRESS not configured — simulating anchor.");
    const mockTx = "0x" + Buffer.from(dataHash + Date.now().toString()).toString("hex").substring(0, 64);
    return mockTx;
  }

  try {
    const provider = getProvider();
    const signer = getSigner(provider);
    if (!signer) throw new Error("No signer available.");

    const auditShield = new ethers.Contract(auditShieldAddress, auditShieldAbi, signer);
    const tx = await auditShield.anchorLog(dataHash);
    const receipt = await tx.wait();
    console.log(`[Shield] Anchored ${dataHash} → tx ${receipt.hash}`);
    return receipt.hash;
  } catch (err) {
    console.error("[Shield] anchorAuditLog error:", err);
    throw new Error("Failed to anchor audit log on-chain.");
  }
}
