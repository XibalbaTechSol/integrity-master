#!/usr/bin/env python3
"""
Xibalba Solutions - Integrity Autoresearch Loop Coordinator
This script orchestrates the modify-train-verify loop to optimize code, scoring weights, or OPA rules.
"""

import os
import sys
import json
import subprocess
import argparse
from datetime import datetime
from integrity_sdk import TelemetryClient
from memory_engine import MemoryEngine
from reflective_agent import ReflectiveAgent
import uuid

RESULTS_FILE = "results.tsv"

def parse_args():
    parser = argparse.ArgumentParser(description="Autoresearch Loop Coordinator")
    parser.add_argument("--target", required=True, help="Path to the file being modified/optimized")
    parser.add_argument("--evaluator", required=True, help="Command to run the validation/scoring suite")
    parser.add_argument("--metric", default="score", help="Key of the metric in JSON output to optimize (or parsed from stdout)")
    parser.add_argument("--commit-msg", default="autoresearch: optimize candidate parameters", help="Git commit message for improvements")
    return parser.parse_args()

def check_git_status(target_file):
    # Ensure no dirty changes on target file before running
    target_dir = os.path.dirname(os.path.abspath(target_file))
    target_name = os.path.basename(target_file)
    res = subprocess.run(["git", "status", "--porcelain", target_name], cwd=target_dir, capture_output=True, text=True)
    if res.stdout.strip():
        print(f"⚠️ Target file {target_file} has uncommitted changes. Please clean your git tree first.")
        sys.exit(1)

def run_evaluation(evaluator_cmd):
    print(f"🔄 Running evaluation command: {evaluator_cmd}")
    res = subprocess.run(evaluator_cmd, shell=True, capture_output=True, text=True)
    stdout = res.stdout.strip()
    stderr = res.stderr.strip()
    
    if res.returncode != 0:
        print(f"❌ Evaluation script failed with exit code {res.returncode}")
        print(f"Stderr:\n{stderr}")
        return None, stdout

    lines = stdout.splitlines()
    for line in reversed(lines):
        try:
            data = json.loads(line)
            if isinstance(data, dict):
                return data, stdout
        except json.JSONDecodeError:
            continue
            
    try:
        data = json.loads(stdout)
        if isinstance(data, dict):
            return data, stdout
    except json.JSONDecodeError:
        pass
        
    print("⚠️ Warning: Output was not valid JSON. Checking if target metric exists as key-value in stdout.")
    return None, stdout

def get_best_score():
    if not os.path.exists(RESULTS_FILE):
        return -float('inf')
    
    best = -float('inf')
    with open(RESULTS_FILE, "r") as f:
        lines = f.readlines()
        if len(lines) <= 1:
            return best
        for line in lines[1:]:
            parts = line.strip().split("\t")
            if len(parts) >= 3:
                try:
                    score = float(parts[2])
                    if score > best:
                        best = score
                except ValueError:
                    continue
    return best

def log_result(git_hash, score, status, description):
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    header_needed = not os.path.exists(RESULTS_FILE)
    
    with open(RESULTS_FILE, "a") as f:
        if header_needed:
            f.write("timestamp\tgit_hash\tscore\tstatus\tdescription\n")
        f.write(f"{timestamp}\t{git_hash}\t{score}\t{status}\t{description}\n")

def get_current_git_hash(target_dir):
    res = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=target_dir, capture_output=True, text=True)
    return res.stdout.strip()

def main():
    args = parse_args()
    
    # Initialize SDK, Memory & Reflective Agent
    sdk = TelemetryClient()
    memory = MemoryEngine()
    agent = ReflectiveAgent(memory)
    
    # Task to be wrapped in reflection
    def execute_optimization_loop():
        with sdk.span("autoresearch_loop"):
            sdk.log_step("init", "Starting Autoresearch Loop Step", {"target": args.target})
            
            print("🚀 Starting Autoresearch Loop Step...")
            target_dir = os.path.dirname(os.path.abspath(args.target))
            target_name = os.path.basename(args.target)
            
            check_git_status(args.target)
            
            # Resource tracking example
            resources = sdk.capture_resources()
            sdk.log_metric("cpu_usage", resources["cpu_percent"], {"memory_mb": resources["memory_mb"]})
            
            with sdk.span("evaluation"):
                sdk.log_step("evaluation", "Running evaluation command", {"cmd": args.evaluator})
                metrics, raw_output = run_evaluation(args.evaluator)
            
            if metrics is None:
                sdk.log_step("error", "Could not extract metrics JSON from evaluation run. Reverting change.")
                print("❌ Could not extract metrics JSON from evaluation run. Reverting change.")
                subprocess.run(["git", "checkout", "--", target_name], cwd=target_dir)
                sys.exit(1)
                
            score_val = metrics.get(args.metric)
            if score_val is None:
                sdk.log_step("error", f"Key '{args.metric}' not found in metrics dictionary.")
                print(f"❌ Key '{args.metric}' not found in metrics dictionary: {metrics}. Reverting.")
                subprocess.run(["git", "checkout", "--", target_name], cwd=target_dir)
                sys.exit(1)
                
            try:
                current_score = float(score_val)
            except ValueError:
                sdk.log_step("error", "Score value is not float-compatible.")
                print(f"❌ Score value '{score_val}' is not float-compatible. Reverting.")
                subprocess.run(["git", "checkout", "--", target_name], cwd=target_dir)
                sys.exit(1)
                
            best_score = get_best_score()
            sdk.log_metric("current_run_score", current_score, {"best_score": best_score})
            print(f"📈 Current Run Score ({args.metric}): {current_score:.4f} | Previous Best: {best_score:.4f}")
            
            if current_score > best_score:
                sdk.log_step("commit", "Improvement achieved, committing changes", {"new_score": current_score, "previous_best": best_score})
                print(f"🎉 Success! Metric improved from {best_score:.4f} to {current_score:.4f}.")
                # Commit the improvement
                subprocess.run(["git", "add", target_name], cwd=target_dir)
                commit_res = subprocess.run(["git", "commit", "-m", f"{args.commit_msg} (score: {current_score})"], cwd=target_dir, capture_output=True, text=True)
                git_hash = get_current_git_hash(target_dir)
                
                log_result(git_hash, current_score, "APPROVED", f"Improved metric '{args.metric}'")
                print(f"✅ Changes committed: {git_hash}")
            else:
                sdk.log_step("revert", "No improvement, reverting changes", {"score": current_score, "best_score": best_score})
                print(f"💤 No improvement. Reverting changes to {args.target}.")
                subprocess.run(["git", "checkout", "--", target_name], cwd=target_dir)
                git_hash = get_current_git_hash(target_dir)
                log_result(git_hash, current_score, "REJECTED", "Did not exceed best score")

    agent.run("Optimize Weights Loop", execute_optimization_loop)
        
if __name__ == "__main__":
    main()
