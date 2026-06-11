"""
Xibalba Integrity SDK — Scoring Engine (Offline)

A portable copy of the Tri-Metric Scoring Engine that runs client-side.
Developers can compute scores locally before reporting to Xibalba for
hash generation and on-chain anchoring.
"""
import math
import statistics
from typing import List


class ScoringEngine:
    """Client-side scoring engine for the Integrity Protocol.

    Computes the three core metrics:
        1. Entropy Score  — measures performance stability
        2. Grounding Score — measures human oversight quality
        3. Integrity Score — the composite AIS (Agent Integrity Score)
    """

    MAX_SCORE = 1000

    # Composite Integrity Score weights (sum = 1.0)
    W_TRUSTFLOW    = 0.25   # Recursive partner reputation
    W_XIBALBA      = 0.25   # Xibalba audit verification
    W_SACRIFICE    = 0.20   # Verified compute hours
    W_STAKING_AGE  = 0.15   # Staking + longevity
    W_VOLUME       = 0.15   # Transaction volume

    # ── Metric 1: Entropy (Stability) ──────────────────────────────

    @staticmethod
    def entropy_score(performance_variance: float) -> int:
        """Calculate the Entropy Score from performance variance.

        A low variance yields a high score (stable agent).
        Formula: S = e^(-1.5 * variance^2) * 1000

        Args:
            performance_variance: Coefficient of variation across recent
                                  latency and accuracy measurements (0.0–2.0).

        Returns:
            Integer score 0–1000.
        """
        stability = math.exp(-1.5 * (performance_variance ** 2))
        return round(stability * ScoringEngine.MAX_SCORE)

    @staticmethod
    def calculate_variance(latencies: List[float], accuracies: List[float]) -> float:
        """Derive combined performance variance from raw telemetry.

        Uses Coefficient of Variation (CV) weighted 60/40 between
        latency and accuracy.

        Args:
            latencies: List of response latencies in ms.
            accuracies: List of accuracy scores (0.0 – 1.0).

        Returns:
            Combined variance float (0.0 – 2.0).
        """
        if len(latencies) < 2:
            return 0.5  # Insufficient data — assume moderate variance

        mean_lat = statistics.mean(latencies)
        mean_acc = statistics.mean(accuracies)

        cv_lat = statistics.stdev(latencies) / mean_lat if mean_lat > 0 else 1.0
        cv_acc = statistics.stdev(accuracies) / mean_acc if mean_acc > 0 else 1.0

        return round(min(2.0, (cv_lat * 0.6) + (cv_acc * 0.4)), 4)

    # ── Metric 2: Grounding (Accountability) ──────────────────────

    @staticmethod
    def grounding_score(hgi_raw: float) -> int:
        """Calculate the Grounding Score from the Human Grounding Index.

        Args:
            hgi_raw: Human Grounding Index value (0.0 – 1.0).

        Returns:
            Integer score 0–1000.
        """
        return round(hgi_raw * ScoringEngine.MAX_SCORE)

    # ── Metric 3: Integrity (Composite AIS) ───────────────────────

    def integrity_score(
        self,
        avg_partner_ais: float = 500,
        xibalba_audit_score: float = 0.0,
        gpu_hours_verified: float = 0,
        hgi_raw: float = 0.0,
        performance_variance: float = 0.5,
        staked_ratio: float = 0.0,
        agent_age_days: int = 1,
        total_volume_intg: float = 0,
        days_since_active: int = 0,
        penalty_points: float = 0.0,
    ) -> dict:
        """Calculate the full Tri-Metric Trust Profile.

        Returns a dict with entropy_score, grounding_score,
        integrity_score, stability_drag, and grounding_boost.
        """
        # Entropy
        e_score = self.entropy_score(performance_variance)
        stability_drag = e_score / self.MAX_SCORE

        # Grounding
        g_score = self.grounding_score(hgi_raw)
        grounding_boost = 1.0 + (hgi_raw * 0.2)

        # Component indices
        trustflow_idx   = min(1.0, avg_partner_ais / 1000.0)
        audit_idx       = min(1.0, max(0.0, xibalba_audit_score))
        sacrifice_idx   = min(1.0, math.log10(gpu_hours_verified + 1) / 3.0)
        age_idx         = min(1.0, math.log10(agent_age_days + 1) / 2.56)
        staking_age_idx = (0.5 * staked_ratio) + (0.5 * age_idx)
        volume_idx      = min(1.0, math.log10(total_volume_intg + 1) / 6.0)

        base_integrity = (
            (self.W_TRUSTFLOW   * trustflow_idx)  +
            (self.W_XIBALBA     * audit_idx)       +
            (self.W_SACRIFICE   * sacrifice_idx)   +
            (self.W_STAKING_AGE * staking_age_idx) +
            (self.W_VOLUME      * volume_idx)
        )

        correlated = base_integrity * stability_drag * grounding_boost

        # Penalties & decay
        penalty_mul  = 1.0 - min(1.0, penalty_points)
        temporal_dec = math.exp(-0.005 * days_since_active)

        final = min(self.MAX_SCORE, correlated * self.MAX_SCORE * penalty_mul * temporal_dec)

        return {
            "entropy_score":   e_score,
            "grounding_score": g_score,
            "integrity_score": round(final),
            "stability_drag":  round(stability_drag, 4),
            "grounding_boost": round(grounding_boost, 4),
        }
