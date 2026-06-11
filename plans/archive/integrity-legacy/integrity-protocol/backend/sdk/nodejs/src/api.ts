/**
 * Xibalba Integrity SDK — API Client
 *
 * Handles all communication with the Xibalba Solutions backend.
 *
 * @module @xibalba/integrity-sdk/api
 */

import axios, { AxiosInstance } from "axios";
import { Wallet } from "ethers";
import type {
  DealResult,
  HandshakeResult,
  VerificationResult,
  TelemetryEvent,
  RiskTier,
} from "./types";

export class IntegrityAPI {
  private client: AxiosInstance;
  private agentAddress: string;
  private privateKey?: string;

  constructor(apiUrl: string, agentAddress: string, apiKey?: string, timeoutMs = 30_000, privateKey?: string) {
    this.agentAddress = agentAddress;
    this.privateKey = privateKey;
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "@xibalba/integrity-sdk/1.0.0 Node.js",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
    });
  }

  /**
   * Cryptographically signs a payload using the agent's private key.
   */
  private async signPayload(payload: Record<string, any>): Promise<Record<string, any>> {
    if (!this.privateKey) {
      console.warn("No private key configured. Sending unsigned payload (legacy mode).");
      return payload;
    }

    // Add timestamp to prevent replay attacks
    payload.timestamp = Math.floor(Date.now() / 1000);

    // Canonicalize payload for signing (sort keys)
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: payload[key] }), {} as any);
    
    const messageText = JSON.stringify(sortedPayload);
    const wallet = new Wallet(this.privateKey);
    const signature = await wallet.signMessage(messageText);
    
    payload.signature = signature;
    return payload;
  }

  /**
   * Report a completed deal to Xibalba Solutions.
   *
   * The backend calculates the Tri-Metric scores, generates a unique
   * integrity hash, and stores the record. The returned hash should be
   * anchored on-chain via IntegrityProtocol.completeHandshake().
   */
  async reportDeal(
    dealId: string,
    performer: string,
    amount: number,
    latencyMs: number,
    accuracy: number,
    metadata?: Record<string, any>
  ): Promise<DealResult> {
    try {
      const payload: Record<string, any> = {
        agent_address: this.agentAddress,
        performer_address: performer,
        deal_id: dealId,
        contract_value_intg: amount,
        latency_ms: latencyMs,
        accuracy_score: accuracy,
        ...(metadata ? { metadata } : {}),
      };

      // Sign the payload for architectural provenance (v8.3)
      const signedPayload = await this.signPayload(payload);

      const resp = await this.client.post("/v1/transactions/report", signedPayload);

      const data = resp.data;
      return {
        dealId,
        integrityHash: data.integrity_hash ?? "",
        entropyScore: data.calculated_entropy ?? 0,
        groundingScore: data.calculated_grounding ?? 0,
        integrityScore: data.ais_impact ?? 0,
        status: data.status ?? "UNKNOWN",
        raw: data,
      };
    } catch (err: any) {
      return {
        dealId,
        integrityHash: "",
        entropyScore: 0,
        groundingScore: 0,
        integrityScore: 0,
        status: "ERROR",
        raw: { error: err.message },
      };
    }
  }

  /**
   * Perform a pre-transaction trust handshake.
   */
  async handshake(targetAddress: string): Promise<HandshakeResult> {
    try {
      const resp = await this.client.post("/v1/agent/handshake", {
        requester_eth_address: this.agentAddress,
        target_eth_address: targetAddress,
      });

      const data = resp.data;
      const ais: number = data.verified_ais ?? 0;

      let riskTier: RiskTier;
      if (ais > 800) riskTier = "AAA" as RiskTier;
      else if (ais > 700) riskTier = "AA" as RiskTier;
      else if (ais > 600) riskTier = "BBB" as RiskTier;
      else if (ais > 400) riskTier = "CCC" as RiskTier;
      else riskTier = "D" as RiskTier;

      return {
        targetAddress,
        ais,
        entropyScore: data.verified_entropy ?? 0,
        groundingScore: data.verified_grounding ?? 0,
        trustDecision: data.trust_decision ?? "REJECTED",
        handshakeHash: data.handshake_hash ?? "",
        riskTier,
        raw: data,
      };
    } catch (err: any) {
      return {
        targetAddress,
        ais: 0,
        entropyScore: 0,
        groundingScore: 0,
        trustDecision: "ERROR",
        handshakeHash: "",
        riskTier: "D" as RiskTier,
        raw: { error: err.message },
      };
    }
  }

  /**
   * Verify a deal's integrity hash against the Xibalba database.
   */
  async verify(dealId: string, onChainHash: string): Promise<VerificationResult> {
    try {
      const resp = await this.client.get(`/v1/verify/${dealId}`, {
        params: { on_chain_hash: onChainHash },
      });

      const data = resp.data;
      return {
        verified: data.verified ?? false,
        dealId,
        integrityScore: data.integrity_score ?? 0,
        agent: data.agent ?? "",
        performer: data.performer ?? "",
        reason: data.reason ?? "",
        raw: data,
      };
    } catch (err: any) {
      return {
        verified: false,
        dealId,
        integrityScore: 0,
        agent: "",
        performer: "",
        reason: err.message,
        raw: { error: err.message },
      };
    }
  }

  /**
   * Flush telemetry events in batch.
   */
  async flushTelemetry(events: TelemetryEvent[]): Promise<Record<string, any>> {
    if (events.length === 0) return { status: "empty", count: 0 };

    try {
      const payload: Record<string, any> = {
        agent_address: this.agentAddress,
        events: events.map((e) => ({
          event_type: e.eventType,
          latency_ms: e.latencyMs,
          tokens_in: e.tokensIn,
          tokens_out: e.tokensOut,
          model: e.model,
          accuracy: e.accuracy,
          metadata: e.metadata ?? {},
        })),
      };

      // Sign the payload for architectural provenance (v8.3)
      const signedPayload = await this.signPayload(payload);

      const resp = await this.client.post("/v1/telemetry/batch", signedPayload);
      return resp.data;
    } catch (err: any) {
      return { status: "error", message: err.message };
    }
  }
}
