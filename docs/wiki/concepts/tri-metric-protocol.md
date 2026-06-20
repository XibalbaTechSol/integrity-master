---
title: The Tri-Metric Protocol
acronyms: [AIS]
created: 2026-05-31
updated: 2026-06-20
type: concept
tags: [metrics, compliance, control-systems]
confidence: high
source_files:
  - integrity-oracle/scoring-core/src/lib.rs
---

# The Tri-Metric Protocol

The **Tri-Metric Protocol** (also packaged as the **Attestation Vector**) is Xibalba's proprietary mathematical evaluation framework. It compiles high-dimensional agent telemetry into a multi-dimensional trust coordinate, representing how safely, predictably, and accountably an agent is operating. The canonical Rust implementation lives in `integrity-oracle/scoring-core/src/lib.rs` as `TriMetricScoringEngine` (v8.4).

## 1. The `TriMetricScoringEngine` Struct (v8.4)

```rust
// integrity-oracle/scoring-core/src/lib.rs
pub struct TriMetricScoringEngine {
    pub max_score: f64,       // = 1000.0
    pub w_trustflow: f64,     // = 0.375
    pub w_xibalba: f64,       // = 0.375
    pub w_sacrifice: f64,     // = 0.25
    pub w_staking_age: f64,   // = 0.0 (reserved, disabled)
    pub w_volume: f64,        // = 0.0 (reserved, disabled)
}
```

**Weight Derivation (v8.4):** The 3-metric engine normalizes the legacy 5-metric Python baseline (w_trustflow=0.30, w_xibalba=0.30, w_sacrifice=0.20) by discarding staking age and volume, then re-normalizing: `new_w_i = old_w_i / 0.80`. This yields IEEE-754 f64 literals that sum cleanly to 1.0.

---

## 2. The Three Metrics

### A. Entropy Score (Stability) — `calculate_entropy_score`
Measures rolling variance in response logs and transaction outputs. v8.4 uses increased sensitivity (exponent factor raised to **-1.5**):

```rust
pub fn calculate_entropy_score(&self, performance_variance: f64) -> f64 {
    let stability_factor = (-1.5 * performance_variance.powi(2)).exp();
    (stability_factor * self.max_score).round()
}
```

**Formula:** $E = e^{-1.5 \times \text{variance}^2} \times 1000$

### B. Grounding Score (Human-in-the-Loop) — `calculate_grounding_score`
Measures verified HITL approval density:

```rust
pub fn calculate_grounding_score(&self, hgi_raw: f64) -> f64 {
    (hgi_raw * self.max_score).round()
}
```

### C. Sacrifice Score (Economic Skin-in-the-Game)
Quantifies proven computational overhead (GPU hours), preventing cheap Sybil replication:

$$S = \min\left(1.0, \frac{\log_{10}(\text{GPU\_Hours}+1)}{3}\right) \times 1000$$

---

## 3. Agent Integrity Score (AIS) — `calculate_ais` (v8.4)

The full calculation signature:

```rust
pub fn calculate_ais(
    &self,
    avg_partner_ais: f64,       // TrustFlow: social graph AIS average
    xibalba_audit_score: f64,   // Xibalba internal audit score [0,1]
    gpu_hours_verified: f64,    // Sacrifice: verified GPU compute hours
    hgi_raw: f64,               // Human-grounding index [0,1]
    performance_variance: f64,  // Entropy: behavioral variance
    staked_ratio: f64,          // Staking ratio [0,1]
    agent_age_days: f64,        // Agent age in days
    total_volume_intg: f64,     // Transaction volume in ITK
    days_since_active: f64,     // Temporal decay input
    penalty_points: f64,        // Penalty multiplier [0,1+]
    verification_tier: u32,     // 1, 2, or 3
) -> u32
```

**Composite Formula:**

```
base_integrity = (0.375 × trustflow_idx) + (0.375 × audit_idx) + (0.25 × sacrifice_idx)
correlated_integrity = base_integrity × stability_drag × grounding_boost
  where stability_drag = entropy_score / 1000.0
        grounding_boost = 1.0 + (hgi_raw × 0.2)

penalty_multiplier = max(0.0, 1.0 - penalty_points)
temporal_decay = exp(-0.005 × days_since_active)

final_ais = correlated_integrity × 1000 × penalty_multiplier × temporal_decay
AIS = min(final_ais, tier_ceiling).round()
```

---

## 4. Identity Ceiling (Tier Caps)

To prevent Sybil inflation, the final AIS is capped by the agent's verified identity tier:

| Tier | Identity Status | AIS Ceiling | Risk Profile |
| :--- | :--- | :--- | :--- |
| **Tier 1: Sovereign** | Cryptographically unique but anonymous | **600** | Speculative (CCC) |
| **Tier 2: Linked** | Bound to verified digital domain or social identity | **850** | Production (AA) |
| **Tier 3: Institutional** | Fully Audited Legal Entity (DUNS/KYC) | **1000** | Negligible (AAA) |

```rust
let ceiling = match verification_tier {
    3 => 1000.0,
    2 => 850.0,
    _ => 600.0,  // Tier 1 and unrecognized
};
```

**Test coverage:** 4 unit tests in `scoring-core/src/lib.rs`:
- `test_perfect_tier3_agent`: perfect inputs → score > 950 and ≤ 1000
- `test_penalty_and_decay_safety`: `penalty_points=1.5` → score == 0 (no underflow)
- `test_ceiling_enforcement`: Tier 1, perfect inputs → score == 600
- `test_benchmark_latency`: 10,000-iteration throughput benchmark (nanosecond-precision)

---

## 5. Related Terms
- **[BCC](behavioral-commitment-chain.md):** Telemetry from the Behavioral Commitment Chain serves as the direct data source for Tri-Metric calculations.
- **[ZKP](zkp.md):** The AIS calculation vector can be compiled into [Aztec Noir Circuits](aztec-noir-circuits.md) to protect operator privacy.
- **[Rust Oracle](../entities/rust-oracle.md):** The `integrity-oracle` hosts the `TriMetricScoringEngine` and applies domain-specific scoring policies on top of it.
- **[AIS](ais.md):** The composite output of this protocol (range: 0–1000).
