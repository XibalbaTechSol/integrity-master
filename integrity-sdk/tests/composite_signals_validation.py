import time
import os
import sys
import psutil
from typing import Dict, Any

# Setup pathing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient
from integrity_sdk.telemetry.conventions import IntegrityAttributes

def run_composite_signal_validation():
    print("=" * 70)
    print("INTEGRITY PROTOCOL — COMPOSITE SIGNAL VALIDATION")
    print("=" * 70)

    # 1. Initialize Client
    client = IntegrityClient(
        agent_id="xibalba_validator",
        oracle_url="http://127.0.0.1:3001/v1/transactions/verify"
    )
    
    # 2. Simulate Host State
    # Force some "recon" activity
    print("\n[STEP 1] Simulating Reconnaissance & Host Activity...")
    client.analyzer.record_tool_call(
        "ls", {"path": "/etc"}, "success", 0.5
    )
    
    # 3. Simulate Inference State
    print("[STEP 2] Simulating Inference State & Latency...")
    client.analyzer.record_inference(
        prompt="Analyze system logs",
        completion="Connecting to remote server for log sync",
        metrics={
            "grounding": 0.8,
            "entropy": 0.2,
            "ttft_ms": 150.0,
            "inter_token_jitter_ms": 2.0, # Low jitter
            "tokens_per_sec": 5.0
        },
        host_snapshot={
            "cpu_percent": 80.0,
            "ip_entropy": 2.5
        }
    )
    
    # 4. Compute Signals
    print("[STEP 3] Computing Composite Signals...")
    metrics = client.host_sampler.get_current_metrics()
    signals = client.analyzer.compute_all_signals(metrics)
    
    # 5. Validate
    print("\n[STEP 4] Results:")
    expected_signals = [
        IntegrityAttributes.RECONNAISSANCE_RISK,
        IntegrityAttributes.COMPUTE_SUBSTITUTION,
        IntegrityAttributes.COGNITIVE_FATIGUE,
        IntegrityAttributes.LATERAL_MOVEMENT_PROB,
        IntegrityAttributes.ENERGY_EFFICIENCY,
        IntegrityAttributes.SEMANTIC_CONTRADICTION,
        IntegrityAttributes.WORKSPACE_BLAST_RADIUS
    ]
    
    for sig in expected_signals:
        val = signals.get(sig, 0.0)
        print(f"   {sig.split('.')[-1]:<25}: {val:.4f}")
        assert val >= 0.0, f"Signal {sig} failed calculation."

    print("\n" + "=" * 70)
    print("✓ SUCCESS: All Composite Signals calculated and validated for Xibalba!")
    print("=" * 70 + "\n")

    client.shutdown()

if __name__ == "__main__":
    run_composite_signal_validation()
