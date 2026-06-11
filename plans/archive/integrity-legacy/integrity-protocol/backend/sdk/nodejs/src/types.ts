/**
 * Xibalba Integrity SDK — Type Definitions
 * @module @xibalba/integrity-sdk
 */

// ─── Configuration ───────────────────────────────────────────────

export interface IntegrityConfig {
  /** URL of the Xibalba Solutions backend API. */
  apiUrl?: string;
  /** Ethereum address of the agent using this SDK. */
  agentAddress: string;
  /** API key issued by Xibalba Solutions (optional for dev mode). */
  apiKey?: string;
  /** Ethereum JSON-RPC provider URL. */
  rpcUrl?: string;
  /** Agent wallet private key (for on-chain writes). Never logged. */
  privateKey?: string;
  /** Deployed IntegrityProtocol.sol contract address. */
  protocolAddress?: string;
  /** Deployed IntegrityToken.sol (ITK) contract address. */
  tokenAddress?: string;
  /** HTTP request timeout in milliseconds. */
  timeoutMs?: number;
}

// ─── Results ─────────────────────────────────────────────────────

export interface DealResult {
  dealId: string;
  integrityHash: string;
  entropyScore: number;
  groundingScore: number;
  integrityScore: number;
  status: string;
  txHash?: string;
  raw: Record<string, unknown>;
}

export interface HandshakeResult {
  targetAddress: string;
  ais: number;
  entropyScore: number;
  groundingScore: number;
  trustDecision: "TRUSTED" | "CAUTION" | "REJECTED" | "ERROR";
  handshakeHash: string;
  riskTier: RiskTier;
  raw: Record<string, unknown>;
}

export interface VerificationResult {
  verified: boolean;
  dealId: string;
  integrityScore: number;
  agent: string;
  performer: string;
  reason: string;
  raw: Record<string, unknown>;
}

export interface AgentProfile {
  address: string;
  ais: number;
  totalStaked: bigint;
  isVerified: boolean;
  jobCount: number;
  lastUpdate: number;
}

// ─── Enums ───────────────────────────────────────────────────────

export enum RiskTier {
  AAA = "AAA", // 800+ AIS
  AA = "AA",   // 700-799
  BBB = "BBB", // 600-699
  CCC = "CCC", // 400-599
  D = "D",     // Below 400
}

// ─── Telemetry ───────────────────────────────────────────────────

export interface TelemetryEvent {
  eventType: "inference" | "tool_call" | "handshake";
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  model: string;
  accuracy: number;
  metadata?: Record<string, unknown>;
}

// ─── Scoring ─────────────────────────────────────────────────────

export interface TriMetricResult {
  entropyScore: number;
  groundingScore: number;
  integrityScore: number;
  stabilityDrag: number;
  groundingBoost: number;
}

export interface IntegrityScoreParams {
  avgPartnerAis?: number;
  xibalbaAuditScore?: number;
  gpuHoursVerified?: number;
  hgiRaw?: number;
  performanceVariance?: number;
  stakedRatio?: number;
  agentAgeDays?: number;
  totalVolumeIntg?: number;
  daysSinceActive?: number;
  penaltyPoints?: number;
  verificationTier?: number;
}
