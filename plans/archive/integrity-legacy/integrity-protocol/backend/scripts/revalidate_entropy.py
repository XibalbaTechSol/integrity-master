import math
import statistics
import sys
import os

# Add the services directory to path to import the real engine
sys.path.append(os.path.join(os.getcwd(), "Projects/integrity-protocol/services"))
from scoring_engine import TriMetricScoringEngine

def validate_entropy():
    engine = TriMetricScoringEngine()
    print("--- 🏛️ Task 1.1: Entropy Calibration Validation ---")
    
    # Test cases: (Variance, Expected Score)
    # S_entropy = e^(-1.5 * variance^2) * 1000
    test_cases = [
        (0.0, 1000),   # Perfect stability
        (0.2, 942),    # Low variance
        (0.5, 687),    # Moderate variance
        (0.8, 383),    # High variance
        (1.0, 223),    # Very high variance
    ]
    
    success = True
    for var, expected in test_cases:
        actual = engine.calculate_entropy_score(var)
        diff = abs(actual - expected)
        status = "✅ PASS" if diff <= 1 else "❌ FAIL"
        print(f"Variance: {var:.1f} | Expected: {expected} | Actual: {actual} | {status}")
        if diff > 1:
            success = False
            
    # Simulate 1000 performance packets
    print("\n--- Simulating 1000 Performance Packets ---")
    import random
    latencies = [random.gauss(200, 20) for _ in range(1000)] # Mean 200, StdDev 20
    mean = statistics.mean(latencies)
    stdev = statistics.stdev(latencies)
    cv = stdev / mean # Coefficient of Variation
    
    score = engine.calculate_entropy_score(cv)
    print(f"Mean Latency: {mean:.2f}ms | StdDev: {stdev:.2f}ms | CV: {cv:.4f}")
    print(f"Calculated Entropy Score: {score}")
    
    if success:
        print("\n🏆 Task 1.1 Validation: SUCCESS")
    else:
        print("\n⚠️ Task 1.1 Validation: FAILED")
    return success

if __name__ == "__main__":
    if validate_entropy():
        sys.exit(0)
    else:
        sys.exit(1)
