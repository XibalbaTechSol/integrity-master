#!/usr/bin/env python3
"""
Integrity Protocol Telemetry Validator
Correlates agent reasoning (from agent_telemetry.jsonl) with performance results (from results.tsv).
"""

import json
import csv
from datetime import datetime

TELEMETRY_FILE = "agent_telemetry.jsonl"
RESULTS_FILE = "results.tsv"

def load_telemetry():
    telemetry = []
    try:
        with open(TELEMETRY_FILE, "r") as f:
            for line in f:
                telemetry.append(json.loads(line))
    except FileNotFoundError:
        print(f"❌ Telemetry file {TELEMETRY_FILE} not found.")
    return telemetry

def load_results():
    results = []
    try:
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                results.append(row)
    except FileNotFoundError:
        print(f"❌ Results file {RESULTS_FILE} not found.")
    return results

def validate():
    telemetry = load_telemetry()
    results = load_results()
    
    print("--- Correlation Report ---")
    
    # Filter for commit/revert reasoning steps
    commit_steps = [e for e in telemetry if e['event_type'] == 'reasoning_step' and e['step'] in ['commit', 'revert']]
    
    for step in commit_steps:
        # Match by score
        score = step['context'].get('new_score') or step['context'].get('score')
        
        # Find corresponding result in results.tsv
        matched_result = None
        for res in results:
            if float(res['score']) == float(score):
                matched_result = res
                break
        
        if matched_result:
            print(f"[{step['timestamp']}] Reasoning: '{step['step']}' | Outcome: {matched_result['status']}")
            print(f"   Reasoning: {step['reasoning']}")
            print(f"   Context: {step['context']}")
            print("-" * 20)

if __name__ == "__main__":
    validate()
