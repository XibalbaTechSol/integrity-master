import math
import sys
import os

# Add the services directory to path
sys.path.append(os.path.join(os.getcwd(), "Projects/integrity-protocol/services"))
from scoring_engine import TriMetricScoringEngine

def validate_decay():
    engine = TriMetricScoringEngine()
    print("--- 🏛️ Task 1.4: Temporal Decay Validation ---")
    
    # Formula in engine: temporal_decay = e^(-0.005 * days_since_active)
    test_cases = [
        (0.0, 1.0),      # Active now
        (30.0, 0.8607),  # 30 days inactive (~86%)
        (100.0, 0.6065), # 100 days inactive (~60%)
        (365.0, 0.1612), # 1 year inactive (~16%)
    ]
    
    success = True
    for days, expected_decay in test_cases:
        # Base AIS setup to result in 1000 before decay
        # Tier 3 to avoid ceilings
        res = engine.calculate_ais(
            avg_partner_ais=1000, 
            xibalba_audit_score=1.0, 
            gpu_hours_verified=1000, 
            hgi_raw=0.0, # grounding_boost = 1.0
            performance_variance=0.0, # stability_drag = 1.0
            staked_ratio=1.0, 
            agent_age_days=1000, 
            total_volume_intg=1000000,
            days_since_active=days,
            verification_tier=3
        )
        
        actual_ais = res["integrity_score"]
        # Expected AIS = round(833.3 * expected_decay) 
        # Wait, base_integrity calculation:
        # 0.25*1 + 0.25*1 + 0.20*1 + 0.15*1 + 0.15*1 = 1.0
        # base_integrity * MAX_SCORE = 1000.
        # So AIS should be round(1000 * expected_decay)
        
        expected_ais = round(1000 * expected_decay)
        diff = abs(actual_ais - expected_ais)
        status = "✅ PASS" if diff <= 2 else "❌ FAIL"
        print(f"Days Inactive: {days:>5} | Expected AIS: {expected_ais:>4} | Actual AIS: {actual_ais:>4} | {status}")
        
        if diff > 2:
            success = False
            
    if success:
        print("\n🏆 Task 1.4 Validation: SUCCESS")
    else:
        print("\n⚠️ Task 1.4 Validation: FAILED")
    return success

if __name__ == "__main__":
    if validate_decay():
        sys.exit(0)
    else:
        sys.exit(1)
