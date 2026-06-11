import sys
import os

# Add services to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../services')))

from scoring_engine import TriMetricScoringEngine

def test_identity_ceilings():
    engine = TriMetricScoringEngine()
    
    # Simulation: Perfect metrics
    # Stability: 0 variance (Entropy Score 1000)
    # Grounding: 1.0 HGI (Grounding Score 1000)
    # Partner AIS: 1000
    # GPU Hours: 1000 (Sacrifice 1.0)
    # Age: 365 days (Age 1.0)
    # Volume: 1M ITK (Volume 1.0)
    # Staked: 1.0
    
    metrics = {
        "avg_partner_ais": 1000,
        "xibalba_audit_score": 1.0,
        "gpu_hours_verified": 1000.0,
        "hgi_raw": 1.0,
        "performance_variance": 0.0,
        "staked_ratio": 1.0,
        "agent_age_days": 365,
        "total_volume_intg": 1000000,
        "days_since_active": 0,
        "penalty_points": 0.0
    }

    print("--- Identity Ceiling Validation (v8.3) ---")
    
    # Tier 1: Sovereign (Capped at 600)
    res1 = engine.calculate_ais(**metrics, verification_tier=1)
    print(f"Tier 1 (Sovereign): Integrity Score = {res1['integrity_score']} (Ceiling Applied: {res1['identity_ceiling_applied']})")
    assert res1['integrity_score'] == 600
    
    # Tier 2: Linked (Capped at 850)
    res2 = engine.calculate_ais(**metrics, verification_tier=2)
    print(f"Tier 2 (Linked): Integrity Score = {res2['integrity_score']} (Ceiling Applied: {res2['identity_ceiling_applied']})")
    assert res2['integrity_score'] == 850
    
    # Tier 3: Institutional (Capped at 1000)
    res3 = engine.calculate_ais(**metrics, verification_tier=3)
    print(f"Tier 3 (Institutional): Integrity Score = {res3['integrity_score']} (Ceiling Applied: {res3['identity_ceiling_applied']})")
    assert res3['integrity_score'] > 850
    
    print("\n✅ Identity Ceiling validation passed.")

if __name__ == "__main__":
    test_identity_ceilings()
