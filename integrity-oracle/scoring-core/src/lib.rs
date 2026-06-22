// v8.4: The Tri-Metric Protocol (Rust Implementation)
// Provides three distinct, correlated trust metrics for the Agentic Web.

pub struct TriMetricScoringEngine {
    pub max_score: f64,
    pub w_trustflow: f64,
    pub w_xibalba: f64,
    pub w_sacrifice: f64,
    pub w_staking_age: f64,
    pub w_volume: f64,
}

impl Default for TriMetricScoringEngine {
    fn default() -> Self {
        // Mathematical Rationale for Weight Optimizations:
        // The legacy 5-metric system had weights: W_TRUSTFLOW=0.30, W_XIBALBA=0.30, W_SACRIFICE=0.20,
        // W_STAKING_AGE=0.10, and W_VOLUME=0.10.
        // In this strict 3-metric system, w_staking_age and w_volume must remain exactly 0.0.
        // Using Lagrange multipliers (orthogonal projection) to strictly minimize Euclidean distance
        // to the legacy targets under a strict 3-metric constraint (summing to 1.0), we shift each
        // coordinate by exactly +1/15.
        // w_trustflow = 0.30 + 1/15 = 11/30 = 0.36666666666666664
        // w_xibalba = 0.30 + 1/15 = 11/30 = 0.36666666666666664
        // w_sacrifice = 0.20 + 1/15 = 8/30 = 0.26666666666666666
        // These values use exact IEEE-754 f64 literals to avoid precision regressions.
        Self {
            max_score: 1000.0,
            w_trustflow: 0.36666666666666664,
            w_xibalba: 0.36666666666666664,
            w_sacrifice: 0.26666666666666666,
            w_staking_age: 0.0,
            w_volume: 0.0,
        }
    }
}

impl TriMetricScoringEngine {
    /// Metric 1: The Entropy Score (Stability).
    /// Increased sensitivity to variance for v8.4.
    pub fn calculate_entropy_score(&self, performance_variance: f64) -> f64 {
        let stability_factor = (-1.5 * performance_variance.powi(2)).exp();
        (stability_factor * self.max_score).round()
    }

    /// Metric 2: The Grounding Score (Human-in-the-Loop).
    pub fn calculate_grounding_score(&self, hgi_raw: f64) -> f64 {
        (hgi_raw * self.max_score).round()
    }

    /// Calculates the full Tri-Metric Trust Profile (AIS v8.4).
    /// Enforces the Identity Ceiling to prevent sybil inflation.
    #[allow(clippy::too_many_arguments)]
    pub fn calculate_ais(
        &self,
        avg_partner_ais: f64,
        xibalba_audit_score: f64,
        gpu_hours_verified: f64,
        hgi_raw: f64,
        performance_variance: f64,
        staked_ratio: f64,
        agent_age_days: f64,
        total_volume_intg: f64,
        days_since_active: f64,
        penalty_points: f64,
        verification_tier: u32,
    ) -> u32 {
        let entropy_score = self.calculate_entropy_score(performance_variance);
        let stability_drag = entropy_score / self.max_score;

        let grounding_boost = 1.0 + (hgi_raw * 0.2);

        let trustflow_idx = (avg_partner_ais / 1000.0).min(1.0);
        let audit_idx = xibalba_audit_score.max(0.0).min(1.0);

        // Logarithmic scale (1000 hours = 1.0)
        let sacrifice_idx = ((gpu_hours_verified + 1.0).log10() / 3.0).min(1.0);

        // Age (~365 days = 1.0)
        let age_idx = ((agent_age_days + 1.0).log10() / 2.56).min(1.0);
        let staking_age_idx = (0.5 * staked_ratio) + (0.5 * age_idx);

        // Volume: Logarithmic (1M ITK = 1.0)
        let volume_idx = ((total_volume_intg + 1.0).log10() / 6.0).min(1.0);

        let base_integrity = (self.w_trustflow * trustflow_idx)
            + (self.w_xibalba * audit_idx)
            + (self.w_sacrifice * sacrifice_idx)
            + (self.w_staking_age * staking_age_idx)
            + (self.w_volume * volume_idx);

        let correlated_integrity = base_integrity * stability_drag * grounding_boost;

        // Decays & Penalties
        // Prevent denominator issue identified in the audit
        let penalty_multiplier = (1.0 - penalty_points).max(0.0);
        let temporal_decay = (-0.005 * days_since_active).exp();

        let final_ais = correlated_integrity * self.max_score * penalty_multiplier * temporal_decay;

        // Enforce Identity Ceiling
        let ceiling = match verification_tier {
            3 => 1000.0,
            2 => 850.0,
            _ => 600.0,
        };

        final_ais.min(ceiling).round() as u32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perfect_tier3_agent() {
        let engine = TriMetricScoringEngine::default();
        let score = engine.calculate_ais(
            1000.0,
            1.0,
            1000.0,
            1.0,
            0.0,
            1.0,
            365.0,
            1_000_000.0,
            0.0,
            0.0,
            3,
        );
        assert!(score > 950);
        assert!(score <= 1000);
    }

    #[test]
    fn test_penalty_and_decay_safety() {
        let engine = TriMetricScoringEngine::default();
        // High penalty should drop score to 0 cleanly without underflow
        let score = engine.calculate_ais(
            1000.0,
            1.0,
            1000.0,
            1.0,
            0.0,
            1.0,
            365.0,
            1_000_000.0,
            0.0,
            1.5,
            3,
        );
        assert_eq!(score, 0);
    }

    #[test]
    fn test_ceiling_enforcement() {
        let engine = TriMetricScoringEngine::default();
        let score = engine.calculate_ais(
            1000.0,
            1.0,
            1000.0,
            1.0,
            0.0,
            1.0,
            365.0,
            1_000_000.0,
            0.0,
            0.0,
            1,
        );
        // Even with perfect metrics, Tier 1 should cap at 600
        assert_eq!(score, 600);
    }

    #[test]
    fn test_benchmark_latency() {
        use std::time::Instant;
        let engine = TriMetricScoringEngine::default();
        let mut min_elapsed = u128::MAX;

        for _ in 0..5 {
            let start = Instant::now();
            for _ in 0..10000 {
                let _ = engine.calculate_ais(
                    1000.0,
                    1.0,
                    1000.0,
                    1.0,
                    0.0,
                    1.0,
                    365.0,
                    1_000_000.0,
                    0.0,
                    0.0,
                    3,
                );
            }
            let elapsed = start.elapsed().as_nanos();
            if elapsed < min_elapsed {
                min_elapsed = elapsed;
            }
        }
        println!("LATENCY_NS: {}", min_elapsed);
    }
}
