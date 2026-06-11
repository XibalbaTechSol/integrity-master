import math

class TriMetricScoringEngine:
    """
    v8.3: The Tri-Metric Protocol.
    Provides three distinct, correlated trust metrics for the Agentic Web.
    """
    def __init__(self):
        self.MAX_SCORE = 1000
        
        # Component Weights for the Comprehensive Integrity Score (Total: 1.0)
        self.W_TRUSTFLOW = 0.30     # Recursive inheritance (300 pts)
        self.W_XIBALBA = 0.30       # Xibalba Verification (300 pts)
        self.W_SACRIFICE = 0.20     # Compute hours/Sunk energy (200 pts)
        self.W_STAKING_AGE = 0.10   # Staking + Longevity (100 pts)
        self.W_VOLUME = 0.10        # Transaction Volume (100 pts)
        
    def calculate_entropy_score(self, performance_variance):
        """
        Metric 1: The Entropy Score (Stability).
        Input: Coefficient of Variation (0.0 to 1.0+)
        """
        # S_entropy = e^(-1.5 * variance^2) * 1000
        # Increased sensitivity to variance for v8.3
        stability_factor = math.exp(-1.5 * (performance_variance ** 2))
        return round(stability_factor * self.MAX_SCORE)

    def calculate_grounding_score(self, hgi_raw):
        """
        Metric 2: The Grounding Score (Human-in-the-Loop).
        Input: HGI (0.0 to 1.0)
        """
        return round(hgi_raw * self.MAX_SCORE)

    def calculate_ais(self, 
                      avg_partner_ais, 
                      xibalba_audit_score, 
                      gpu_hours_verified, 
                      hgi_raw, 
                      performance_variance, 
                      staked_ratio, 
                      agent_age_days,
                      total_volume_intg,
                      days_since_active=0,
                      penalty_points=0.0,
                      verification_tier=1):
        """
        Calculates the full Tri-Metric Trust Profile (AIS v8.3).
        Enforces the Identity Ceiling:
        Tier 1 (Sovereign): 600 Max
        Tier 2 (Linked): 850 Max
        Tier 3 (Institutional): 1000 Max
        """
        
        # 1. Metric: Entropy (Stability)
        entropy_score = self.calculate_entropy_score(performance_variance)
        stability_drag = entropy_score / self.MAX_SCORE
        
        # 2. Metric: Grounding (Accountability)
        grounding_score = self.calculate_grounding_score(hgi_raw)
        # Grounding boost is up to 20%
        grounding_boost = 1.0 + (hgi_raw * 0.2) 
        
        # 3. Base Comprehensive Components (Normalized 0.0 - 1.0)
        trustflow_idx = min(1.0, avg_partner_ais / 1000.0)
        audit_idx = min(1.0, max(0.0, xibalba_audit_score))
        
        # Sacrifice: Logarithmic scale (1000 hours = 1.0)
        sacrifice_idx = min(1.0, math.log10(gpu_hours_verified + 1) / 3.0)
        
        # Staking & Age: 50/50 mix
        age_idx = min(1.0, math.log10(agent_age_days + 1) / 2.56) # ~365 days = 1.0
        staking_age_idx = (0.5 * staked_ratio) + (0.5 * age_idx)
        
        # Volume: Logarithmic (1M ITK = 1.0)
        volume_idx = min(1.0, math.log10(total_volume_intg + 1) / 6.0)
        
        # 4. Base Integrity Calculation
        base_integrity = (
            (self.W_TRUSTFLOW * trustflow_idx) +
            (self.W_XIBALBA * audit_idx) +
            (self.W_SACRIFICE * sacrifice_idx) +
            (self.W_STAKING_AGE * staking_age_idx) +
            (self.W_VOLUME * volume_idx)
        )
        
        # Apply Correlation: Stability Drag and Grounding Boost
        # Formula: Final AIS = (Base Integrity × Stability Drag × Grounding Boost)
        correlated_integrity = base_integrity * stability_drag * grounding_boost
        
        # 5. Penalties & Temporal Decay
        penalty_multiplier = 1.0 - min(1.0, penalty_points)
        temporal_decay = math.exp(-0.005 * days_since_active)
        
        final_ais = correlated_integrity * self.MAX_SCORE * penalty_multiplier * temporal_decay
        
        # 6. ENFORCE IDENTITY CEILING
        ceiling = 600 # Tier 1 Default
        if verification_tier == 2:
            ceiling = 850
        elif verification_tier == 3:
            ceiling = 1000
            
        final_ais = min(final_ais, ceiling)
        
        return {
            "entropy_score": entropy_score,
            "grounding_score": grounding_score,
            "integrity_score": round(max(0, final_ais)),
            "stability_drag": round(stability_drag, 4),
            "grounding_boost": round(grounding_boost, 4),
            "base_integrity": round(base_integrity, 4),
            "identity_ceiling_applied": final_ais == ceiling,
            "verification_tier": verification_tier
        }
