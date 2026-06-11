import math
import sys
import os

# Add the services directory to path
sys.path.append(os.path.join(os.getcwd(), "Projects/integrity-protocol/services"))
from scoring_engine import TriMetricScoringEngine

def validate_ceilings():
    engine = TriMetricScoringEngine()
    print("--- 🏛️ Task 1.3: AIS Composition & Ceilings Validation ---")
    
    # We will pass parameters that should result in a score of > 1000
    # then check if they are capped based on tier.
    # W_TRUSTFLOW (0.25) * 1.0 + W_XIBALBA (0.25) * 1.0 + W_SACRIFICE (0.20) * 1.0 
    # + W_STAKING_AGE (0.15) * 1.0 + W_VOLUME (0.15) * 1.0 = 1.0 base
    # Grounding boost 1.2x = 1.2 total.
    # entropy_score 1000 = 1.0 stability drag.
    # Total = 1200 AIS before capping.
    
    test_cases = [
        (1, 600),   # Tier 1 (Sovereign)
        (2, 850),   # Tier 2 (Linked)
        (3, 1000),  # Tier 3 (Institutional)
    ]
    
    success = True
    for tier, expected_ceiling in test_cases:
        res = engine.calculate_ais(
            avg_partner_ais=1000, 
            xibalba_audit_score=1.0, 
            gpu_hours_verified=1000, # log10(1001)/3 ~= 1.0
            hgi_raw=1.0, 
            performance_variance=0.0, 
            staked_ratio=1.0, 
            agent_age_days=1000, # log10(1001)/2.56 > 1.0
            total_volume_intg=1000000, # log10(1M)/6 = 1.0
            verification_tier=tier
        )
        
        actual_ais = res["integrity_score"]
        status = "✅ PASS" if actual_ais == expected_ceiling else "❌ FAIL"
        print(f"Tier: {tier} | Expected Ceiling: {expected_ceiling} | Actual AIS: {actual_ais} | Capped: {res['identity_ceiling_applied']} | {status}")
        
        if actual_ais != expected_ceiling:
            success = False
            
    if success:
        print("\n🏆 Task 1.3 Validation: SUCCESS")
    else:
        print("\n⚠️ Task 1.3 Validation: FAILED")
    return success

if __name__ == "__main__":
    if validate_ceilings():
        sys.exit(0)
    else:
        sys.exit(1)
