import math
import sys
import os

# Add the services directory to path
sys.path.append(os.path.join(os.getcwd(), "Projects/integrity-protocol/services"))
from scoring_engine import TriMetricScoringEngine

def validate_grounding():
    engine = TriMetricScoringEngine()
    print("--- 🏛️ Task 1.2: Grounding Multiplier Validation ---")
    
    # Formula in engine: grounding_boost = 1.0 + (hgi_raw * 0.2)
    test_cases = [
        (0.0, 1.0),    # No boost
        (0.5, 1.1),    # 10% boost
        (1.0, 1.2),    # 20% max boost
    ]
    
    success = True
    for hgi, expected_boost in test_cases:
        # We need to call calculate_ais or extract the grounding_boost logic
        # Testing grounding_score first
        g_score = engine.calculate_grounding_score(hgi)
        expected_g_score = round(hgi * 1000)
        
        # Now checking the actual boost used in AIS
        # Using placeholder values for other components to isolate grounding
        res = engine.calculate_ais(
            avg_partner_ais=500, 
            xibalba_audit_score=1.0, 
            gpu_hours_verified=0, 
            hgi_raw=hgi, 
            performance_variance=0.0, # entropy_score = 1000, stability_drag = 1.0
            staked_ratio=0.0, 
            agent_age_days=0,
            total_volume_intg=0,
            verification_tier=3 # Avoid ceiling interference
        )
        
        actual_boost = res["grounding_boost"]
        status = "✅ PASS" if actual_boost == expected_boost else "❌ FAIL"
        print(f"HGI: {hgi:.1f} | Grounding Score: {res['grounding_score']} | Expected Boost: {expected_boost:.2f} | Actual Boost: {actual_boost:.2f} | {status}")
        
        if actual_boost != expected_boost:
            success = False
            
    if success:
        print("\n🏆 Task 1.2 Validation: SUCCESS")
    else:
        print("\n⚠️ Task 1.2 Validation: FAILED")
    return success

if __name__ == "__main__":
    if validate_grounding():
        sys.exit(0)
    else:
        sys.exit(1)
