/**
 * Xibalba Integrity SDK — Unified Entry Point
 *
 * @example
 * ```ts
 * import { IntegrityClient } from "@xibalba/integrity-sdk";
 *
 * const client = new IntegrityClient({
 *   agentAddress: "0xYourAgent",
 *   apiKey: "xib_live_...",
 * });
 *
 * // Pre-transaction trust check
 * const trust = await client.handshake("0xTargetAgent");
 *
 * // Report a completed deal → get hash for blockchain
 * const result = await client.reportDeal(
 *   "deal_123", "0xTargetAgent", 5000, 120, 0.98
 * );
 *
 * // Anchor hash on-chain (if blockchain is configured)
 * await client.anchorOnChain(result.dealId, result.integrityHash);
 * ```
 *
 * @module @xibalba/integrity-sdk
 */

import { createHash } from "crypto";
import { IntegrityAPI } from "./api";
import { IntegrityBlockchain } from "./blockchain";
import { ScoringEngine } from "./scoring";
import type {
  IntegrityConfig,
  DealResult,
  HandshakeResult,
  VerificationResult,
  TelemetryEvent,
  AgentProfile,
} from "./types";

export class IntegrityClient {
  /** Direct access to the API layer. */
  public readonly api: IntegrityAPI;

  /** Direct access to the blockchain layer (null if no RPC configured). */
  public readonly blockchain: IntegrityBlockchain | null;

  /** Client-side scoring engine for offline calculations. */
  public readonly scorer = ScoringEngine;

  private telemetryBuffer: TelemetryEvent[] = [];
  private config: IntegrityConfig;

  constructor(config: IntegrityConfig) {
    this.config = config;

    this.api = new IntegrityAPI(
      config.apiUrl ?? "http://localhost:8001",
      config.agentAddress,
      config.apiKey,
      config.timeoutMs,
      config.privateKey
    );

    // Blockchain is optional — SDK works API-only for frictionless adoption
    if (config.rpcUrl) {
      this.blockchain = new IntegrityBlockchain(
        config.rpcUrl,
        config.protocolAddress,
        undefined, // registryAddress — set via blockchain directly if needed
        config.tokenAddress,
        config.privateKey
      );
    } else {
      this.blockchain = null;
    }
  }

  // ─── Core Workflow ─────────────────────────────────────────────

  /**
   * Report a completed deal to Xibalba and receive the integrity hash.
   */
  async reportDeal(
    dealId: string,
    performer: string,
    amount: number,
    latencyMs: number,
    accuracy: number,
    metadata?: Record<string, any>
  ): Promise<DealResult> {
    return this.api.reportDeal(dealId, performer, amount, latencyMs, accuracy, metadata);
  }

  /**
   * Pre-transaction trust assessment of a target agent.
   */
  async handshake(targetAddress: string): Promise<HandshakeResult> {
    return this.api.handshake(targetAddress);
  }

  /**
   * Verify an on-chain hash against the Xibalba database.
   */
  async verify(dealId: string, onChainHash: string): Promise<VerificationResult> {
    return this.api.verify(dealId, onChainHash);
  }

  /**
   * Anchor an integrity hash on-chain via IntegrityProtocol.sol.
   * Requires blockchain to be configured with a private key.
   */
  async anchorOnChain(
    dealId: string,
    integrityHash: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.blockchain) {
      return { success: false, error: "Blockchain not configured. Set rpcUrl and privateKey." };
    }

    try {
      const receipt = await this.blockchain.completeHandshake(dealId, integrityHash);
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Read an agent's on-chain profile from ReputationRegistry.
   */
  async getAgentProfile(address: string): Promise<AgentProfile | null> {
    if (!this.blockchain) return null;
    return this.blockchain.getAgentProfile(address);
  }

  // ─── Telemetry ─────────────────────────────────────────────────

  /**
   * Buffer a telemetry event for batch reporting.
   */
  trackEvent(event: TelemetryEvent): void {
    this.telemetryBuffer.push(event);
  }

  /**
   * Flush all buffered telemetry to the Xibalba backend.
   */
  async flushTelemetry(): Promise<Record<string, any>> {
    const events = [...this.telemetryBuffer];
    this.telemetryBuffer = [];
    return this.api.flushTelemetry(events);
  }

  // ─── Utilities ─────────────────────────────────────────────────

  /**
   * Compute an integrity hash locally for independent verification.
   * Mirrors the server-side algorithm so devs can audit Xibalba's output.
   */
  static computeHash(dealId: string, latencyMs: number, accuracy: number, amount: number): string {
    const metricString = `${dealId}-${latencyMs}-${accuracy}-${amount}`;
    const digest = createHash("sha256").update(metricString).digest("hex");
    return `0x${digest}`;
  }
}

// ─── Re-exports ──────────────────────────────────────────────────

export { IntegrityAPI } from "./api";
export { IntegrityBlockchain } from "./blockchain";
export { ScoringEngine } from "./scoring";
export type {
  IntegrityConfig,
  DealResult,
  HandshakeResult,
  VerificationResult,
  AgentProfile,
  TelemetryEvent,
  RiskTier,
  TriMetricResult,
  IntegrityScoreParams,
} from "./types";
