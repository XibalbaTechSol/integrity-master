/**
 * Xibalba Integrity SDK — Client-Side Scoring Engine
 *
 * Portable TypeScript implementation of the Tri-Metric Scoring Engine.
 * Developers can compute scores locally before reporting to Xibalba.
 *
 * @module @xibalba/integrity-sdk/scoring
 */

import type { TriMetricResult, IntegrityScoreParams } from "./types";

const MAX_SCORE = 1000;

// Composite Integrity Score weights (sum = 1.0)
const W_TRUSTFLOW = 0.25;
const W_XIBALBA = 0.25;
const W_SACRIFICE = 0.20;
const W_STAKING_AGE = 0.15;
const W_VOLUME = 0.15;

export class ScoringEngine {
  /**
   * Metric 1: Entropy Score (Stability).
   * A low variance yields a high score — the agent is predictable and reliable.
   *
   * @param performanceVariance - Combined CV of latency + accuracy (0.0–2.0).
   * @returns Integer score 0–1000.
   */
  static entropyScore(performanceVariance: number): number {
    const stability = Math.exp(-1.5 * (performanceVariance ** 2));
    return Math.round(stability * MAX_SCORE);
  }

  /**
   * Derive combined performance variance from raw telemetry arrays.
   *
   * @param latencies - Array of response latencies in ms.
   * @param accuracies - Array of accuracy scores (0.0–1.0).
   * @returns Combined variance (0.0–2.0).
   */
  static calculateVariance(latencies: number[], accuracies: number[]): number {
    if (latencies.length < 2) return 0.5;

    const meanLat = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const meanAcc = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

    const stdLat = Math.sqrt(
      latencies.reduce((sum, v) => sum + (v - meanLat) ** 2, 0) / (latencies.length - 1)
    );
    const stdAcc = Math.sqrt(
      accuracies.reduce((sum, v) => sum + (v - meanAcc) ** 2, 0) / (accuracies.length - 1)
    );

    const cvLat = meanLat > 0 ? stdLat / meanLat : 1.0;
    const cvAcc = meanAcc > 0 ? stdAcc / meanAcc : 1.0;

    return Math.min(2.0, parseFloat((cvLat * 0.6 + cvAcc * 0.4).toFixed(4)));
  }

  /**
   * Metric 2: Grounding Score (Accountability).
   *
   * @param hgiRaw - Human Grounding Index value (0.0–1.0).
   * @returns Integer score 0–1000.
   */
  static groundingScore(hgiRaw: number): number {
    return Math.round(hgiRaw * MAX_SCORE);
  }

  /**
   * Calculate the full Tri-Metric Trust Profile.
   *
   * @param params - All scoring parameters.
   * @returns TriMetricResult with all three scores and correlation factors.
   */
  static integrityScore(params: IntegrityScoreParams = {}): TriMetricResult {
    const {
      avgPartnerAis = 500,
      xibalbaAuditScore = 0.0,
      gpuHoursVerified = 0,
      hgiRaw = 0.0,
      performanceVariance = 0.5,
      stakedRatio = 0.0,
      agentAgeDays = 1,
      totalVolumeIntg = 0,
      daysSinceActive = 0,
      penaltyPoints = 0.0,
      verificationTier = 1,
    } = params;

    // Entropy
    const eScore = ScoringEngine.entropyScore(performanceVariance);
    const stabilityDrag = eScore / MAX_SCORE;

    // Grounding
    const gScore = ScoringEngine.groundingScore(hgiRaw);
    const groundingBoost = 1.0 + hgiRaw * 0.2;

    // Component indices
    const trustflowIdx = Math.min(1.0, avgPartnerAis / 1000.0);
    const auditIdx = Math.min(1.0, Math.max(0.0, xibalbaAuditScore));
    const sacrificeIdx = Math.min(1.0, Math.log10(gpuHoursVerified + 1) / 3.0);
    const ageIdx = Math.min(1.0, Math.log10(agentAgeDays + 1) / 2.56);
    const stakingAgeIdx = 0.5 * stakedRatio + 0.5 * ageIdx;
    const volumeIdx = Math.min(1.0, Math.log10(totalVolumeIntg + 1) / 6.0);

    const baseIntegrity =
      W_TRUSTFLOW * trustflowIdx +
      W_XIBALBA * auditIdx +
      W_SACRIFICE * sacrificeIdx +
      W_STAKING_AGE * stakingAgeIdx +
      W_VOLUME * volumeIdx;

    const correlated = baseIntegrity * stabilityDrag * groundingBoost;

    // Penalties & decay
    const penaltyMul = 1.0 - Math.min(1.0, penaltyPoints);
    const temporalDec = Math.exp(-0.005 * daysSinceActive);

    let final = correlated * MAX_SCORE * penaltyMul * temporalDec;

    // ENFORCE IDENTITY CEILING
    let ceiling = 600; // Tier 1 Default
    if (verificationTier === 2) {
      ceiling = 850;
    } else if (verificationTier === 3) {
      ceiling = 1000;
    }
    final = Math.min(final, ceiling);

    return {
      entropyScore: eScore,
      groundingScore: gScore,
      integrityScore: Math.round(Math.max(0, final)),
      stabilityDrag: parseFloat(stabilityDrag.toFixed(4)),
      groundingBoost: parseFloat(groundingBoost.toFixed(4)),
    };
  }
}
