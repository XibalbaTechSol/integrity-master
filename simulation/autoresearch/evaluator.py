#!/usr/bin/env python3
"""
Xibalba Solutions - Integrity Autoresearch Evaluator
Runs cargo tests, compiles, parses metrics, and evaluates scoring parameters.
"""

import os
import sys
import json
import subprocess
import argparse
import re

SCORING_CORE_DIR = "/home/xibalba/Projects/INTEGRITY/integrity-oracle/scoring-core"
DB_URL = "postgres://xibalba_admin:integrity_secret_123@localhost:5432/integrity_protocol"

def parse_args():
    parser = argparse.ArgumentParser(description="Autoresearch Evaluator")
    parser.add_argument("--multi-objective", action="store_true", help="Enable multi-objective optimization (accuracy, latency, gas)")
    parser.add_argument("--live-telemetry", action="store_true", help="Fetch and evaluate against live PostgreSQL agent data")
    return parser.parse_args()

def run_cargo_tests():
    # Make sure tests compile and pass
    res = subprocess.run(["cargo", "test", "--", "--nocapture"], cwd=SCORING_CORE_DIR, capture_output=True, text=True)
    if res.returncode != 0:
        return False, f"Cargo tests failed:\n{res.stderr}\n{res.stdout}", 0.0
    
    # Parse latency
    latency_ns = 0.0
    match = re.search(r"LATENCY_NS:\s*(\d+)", res.stdout)
    if match:
        latency_ns = float(match.group(1))
    return True, "All unit tests passed", latency_ns

def fetch_live_telemetry():
    # Call psql to pull agents JSON
    cmd = [
        "psql", DB_URL, "-A", "-t", "-c",
        "SELECT json_agg(t) FROM (SELECT current_ais, gpu_hours_verified, performance_entropy, penalty_points, staked_itk FROM agents LIMIT 50) t;"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not res.stdout.strip():
        return []
    
    try:
        return json.loads(res.stdout.strip())
    except json.JSONDecodeError:
        return []

def simulate_ais(w_tf, w_xi, w_sf, w_sa, w_vl, avg_partner_ais, xibalba_audit, gpu_hours, hgi, entropy, staked_ratio, age, volume, active_days, penalty, tier):
    # Simulated calculation mimicking lib.rs to score live data
    entropy_score = ((-1.5 * (entropy**2)).exp() * 1000.0) if hasattr(entropy, 'exp') else 1000.0
    import math
    entropy_score = math.exp(-1.5 * (entropy**2)) * 1000.0
    stability_drag = entropy_score / 1000.0
    grounding_boost = 1.0 + (hgi * 0.2)
    
    trustflow_idx = min(avg_partner_ais / 1000.0, 1.0)
    audit_idx = min(max(xibalba_audit, 0.0), 1.0)
    sacrifice_idx = min(math.log10(gpu_hours + 1.0) / 3.0, 1.0)
    age_idx = min(math.log10(age + 1.0) / 2.56, 1.0)
    staking_age_idx = (0.5 * staked_ratio) + (0.5 * age_idx)
    volume_idx = min(math.log10(volume + 1.0) / 6.0, 1.0)
    
    base_integrity = (w_tf * trustflow_idx) + (w_xi * audit_idx) + (w_sf * sacrifice_idx) + (w_sa * staking_age_idx) + (w_vl * volume_idx)
    correlated = base_integrity * stability_drag * grounding_boost
    
    penalty_mult = max(1.0 - penalty, 0.0)
    decay = math.exp(-0.005 * active_days)
    
    final_ais = correlated * 1000.0 * penalty_mult * decay
    ceiling = 1000.0 if tier == 3 else (850.0 if tier == 2 else 600.0)
    return min(final_ais, ceiling)

def main():
    args = parse_args()
    
    # 1. Run cargo tests and capture latency
    tests_ok, msg, latency_ns = run_cargo_tests()
    if not tests_ok:
        print(json.dumps({"score": 0.0, "status": "COMPILE_ERROR", "message": msg}))
        sys.exit(0)
        
    try:
        # Read current weights from lib.rs
        with open(os.path.join(SCORING_CORE_DIR, "src/lib.rs"), "r") as f:
            content = f.read()
            
        w_tf = float(re.search(r"w_trustflow:\s*([0-9.]+)", content).group(1))
        w_xi = float(re.search(r"w_xibalba:\s*([0-9.]+)", content).group(1))
        w_sf = float(re.search(r"w_sacrifice:\s*([0-9.]+)", content).group(1))
        w_sa = float(re.search(r"w_staking_age:\s*([0-9.]+)", content).group(1))
        w_vl = float(re.search(r"w_volume:\s*([0-9.]+)", content).group(1))
        
        sum_weights = w_tf + w_xi + w_sf + w_sa + w_vl
        sum_penalty = abs(1.0 - sum_weights) * 1000.0
        
        # Targets
        target_tf = 0.36666666666666664
        target_xi = 0.36666666666666664
        target_sf = 0.26666666666666666
        target_sa = 0.0
        target_vl = 0.0
        
        dist = ((w_tf - target_tf)**2 + (w_xi - target_xi)**2 + (w_sf - target_sf)**2 + (w_sa - target_sa)**2 + (w_vl - target_vl)**2) ** 0.5
        
        # Accuracy base score (up to 1000)
        accuracy_score = 1000.0 - (dist * 1000.0) - sum_penalty
        accuracy_score = max(0.0, accuracy_score)
        
        score = accuracy_score
        gas_cost_factor = 0.0
        
        # Live Telemetry evaluation
        if args.live_telemetry:
            agents = fetch_live_telemetry()
            if agents:
                # Calculate metric: score stability/variance across agents.
                # If weights cause severe fluctuations (high variance of delta), it implies higher gas cost.
                deviations = []
                for a in agents:
                    # Parse database fields
                    current_ais = float(a.get("current_ais", 500))
                    gpu = float(a.get("gpu_hours_verified", 0.0))
                    entropy = float(a.get("performance_entropy", 0.0))
                    penalty = float(a.get("penalty_points", 0.0))
                    # Staked ITK - scale to ratio (e.g. up to 1M ITK = 1.0)
                    staked = float(a.get("staked_itk", 0.0))
                    staked_ratio = min(staked / 100000.0, 1.0)
                    
                    # Compute simulated AIS under the candidate weights
                    candidate_ais = simulate_ais(
                        w_tf, w_xi, w_sf, w_sa, w_vl,
                        avg_partner_ais=800.0, xibalba_audit=0.9, gpu_hours=gpu, hgi=0.95,
                        entropy=entropy, staked_ratio=staked_ratio, age=180.0, volume=staked,
                        active_days=0.0, penalty=penalty, tier=3
                    )
                    
                    # Compute deviation from database value
                    deviations.append(abs(candidate_ais - current_ais))
                
                avg_deviation = sum(deviations) / len(deviations) if deviations else 0.0
                # Reduce score based on excessive drift from established reputation baseline
                accuracy_score -= avg_deviation * 2.0
                accuracy_score = max(0.0, accuracy_score)
                score = accuracy_score
                
                # Estimate gas cost factor based on number of updates triggered (> 5 points diff)
                updates_triggered = sum(1 for d in deviations if d > 5.0)
                gas_cost_factor = float(updates_triggered) * 20.0
        
        # Multi-Objective Penalties
        if args.multi_objective:
            # Latency penalty: 5ms (5,000,000ns) = 1 point penalty
            latency_penalty = (latency_ns / 5000000.0)
            score -= latency_penalty
            # Gas cost penalty: 1000 factor * 0.05 = 50 points penalty
            score -= (gas_cost_factor * 0.05)
            score = max(0.0, score)
            
        metrics = {
            "score": float(round(score, 4)),
            "accuracy": float(round(accuracy_score, 4)),
            "latency_ns": latency_ns,
            "gas_cost_factor": gas_cost_factor,
            "status": "SUCCESS"
        }
        print(json.dumps(metrics))
        
    except Exception as e:
        print(json.dumps({"score": 0.0, "status": "EXCEPTION", "message": str(e)}))

if __name__ == "__main__":
    main()
