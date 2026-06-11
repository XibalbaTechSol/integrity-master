#!/usr/bin/env python3
"""
Synthetic Reasoning Generator
Simulates agent execution cycles to populate telemetry with diverse reasoning scenarios.
"""

import random
from integrity_sdk import TelemetryClient

def generate_data():
    sdk = TelemetryClient(log_file="agent_telemetry.jsonl")
    
    scenarios = [
        {"step": "init", "reasoning": "Analyzing codebase structure"},
        {"step": "evaluation", "reasoning": "Validating scoring weights"},
        {"step": "commit", "reasoning": "Optimized weight distribution for better stability"},
        {"step": "revert", "reasoning": "Performance degraded, reverting to baseline weights"}
    ]
    
    print("🚀 Generating synthetic reasoning data...")
    
    for i in range(10):
        with sdk.span(f"cycle_{i}"):
            # Simulate a cycle
            sdk.log_step("init", f"Starting cycle {i}")
            
            outcome = random.choice(["commit", "revert"])
            score = random.uniform(800.0, 990.0)
            
            if outcome == "commit":
                sdk.log_step("commit", f"Successfully improved performance in cycle {i}", {"score": score})
                sdk.log_metric("current_run_score", score)
            else:
                sdk.log_step("revert", f"Failed to improve performance in cycle {i}, reverting", {"score": score})
                sdk.log_metric("current_run_score", score)

    print("✅ Synthetic telemetry generation complete.")

if __name__ == "__main__":
    generate_data()
