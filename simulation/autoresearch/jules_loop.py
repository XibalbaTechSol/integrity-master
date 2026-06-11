#!/usr/bin/env python3
"""
Xibalba Solutions - Jules & Autoresearch Loop Integration (Production Version)
Supports:
1. Parallel explorations (temporary branching and evaluation)
2. Closed-loop feedback (learning from last rejected session)
3. Multi-objective evaluation toggles
4. Live telemetry database evaluations
5. Daemon monitoring mode (based on agent drift thresholds)
"""

import os
import sys
import time
import json
import re
import subprocess
import argparse
from datetime import datetime

JULES_BIN = "/home/xibalba/.hermes/node/bin/jules"
RUN_LOOP_PY = "/home/xibalba/Projects/INTEGRITY/simulation/autoresearch/run_loop.py"
RESULTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.tsv")
DB_URL = "postgres://xibalba_admin:integrity_secret_123@localhost:5432/integrity_protocol"

def parse_args():
    parser = argparse.ArgumentParser(description="Jules Autoresearch Production Suite")
    parser.add_argument("--target", default="/home/xibalba/Projects/INTEGRITY/integrity-oracle/scoring-core/src/lib.rs", help="Path to the file being optimized")
    parser.add_argument("--task", default="Optimize the tri-metric weights in integrity-oracle/scoring-core/src/lib.rs to decrease distance error evaluated in simulation/autoresearch/evaluator.py", help="Task description for Jules")
    parser.add_argument("--parallel", type=int, default=10, help="Number of parallel search sessions")
    parser.add_argument("--closed-loop", action="store_true", help="Enable closed-loop feedback based on past rejections")
    parser.add_argument("--multi-objective", action="store_true", help="Optimize for multi-objective utility (accuracy, latency, gas)")
    parser.add_argument("--live-telemetry", action="store_true", help="Enable live PostgreSQL agent telemetry evaluations")
    parser.add_argument("--daemon", action="store_true", help="Run persistently in daemon monitoring mode")
    parser.add_argument("--daemon-interval", type=int, default=3600, help="Interval in seconds between daemon drift checks")
    parser.add_argument("--drift-threshold", type=float, default=0.04, help="Average performance entropy drift trigger for optimization")
    parser.add_argument("--poll-interval", type=int, default=30, help="Interval in seconds to check Jules task status")
    parser.add_argument("--max-wait", type=int, default=1800, help="Max wait time in seconds (default 30 mins)")
    parser.add_argument("--force", action="store_true", help="Force run loop step, bypassing rate limits")
    return parser.parse_args()

def get_git_repo_name(directory):
    res = subprocess.run(["git", "remote", "get-url", "origin"], cwd=directory, capture_output=True, text=True)
    if res.returncode != 0:
        return None
    url = res.stdout.strip()
    match = re.search(r"github\.com[:/]([^/]+/[^/.]+)(?:\.git)?", url)
    if match:
        return match.group(1)
    return None

def run_jules_new(task_desc, target_file, parallel):
    target_dir = os.path.dirname(os.path.abspath(target_file))
    repo_name = get_git_repo_name(target_dir)
    
    # Jules CLI limits parallel tasks count to between 1 and 5
    parallel = min(parallel, 5)
    
    cmd = [JULES_BIN, "new"]
    if repo_name:
        cmd.extend(["--repo", repo_name])
    if parallel > 1:
        cmd.extend(["--parallel", str(parallel)])
        
    cmd.append(task_desc)
    
    print(f"🚀 Spawning Jules task (Parallel={parallel}): '{task_desc}'...")
    
    max_retries = 3
    retry_delay = 60
    
    for attempt in range(max_retries):
        res = subprocess.run(cmd, capture_output=True, text=True)
        
        if res.returncode == 0:
            stdout = res.stdout.strip()
            print(stdout)
            
            # Extract all IDs
            ids = re.findall(r"ID:\s*(\d+)", stdout, re.IGNORECASE)
            if ids:
                return ids
                
            # Fallback checks
            match = re.search(r"session\s*(\d+)", stdout, re.IGNORECASE)
            if match:
                return [match.group(1)]
                
            digits = re.findall(r"\b\d{10,}\b", stdout)
            if digits:
                return [digits[0]]
        
        print(f"⚠️ Attempt {attempt+1} failed. Error:\n{res.stderr}\n{res.stdout}")
        if attempt < max_retries - 1:
            print(f"⏳ Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
            
    print("❌ Failed to create Jules task after multiple attempts.")
    sys.exit(1)

def check_session_status(session_id):
    res = subprocess.run([JULES_BIN, "remote", "list", "--session"], capture_output=True, text=True)
    if res.returncode != 0:
        return None
        
    lines = res.stdout.splitlines()
    for line in lines:
        if session_id in line:
            parts = line.split()
            if len(parts) >= 5:
                return parts[-1]
    return None

def get_best_score():
    if not os.path.exists(RESULTS_FILE):
        return -float('inf')
    
    best = -float('inf')
    try:
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
    except Exception:
        pass
    return best

def get_last_rejected_feedback():
    if not os.path.exists(RESULTS_FILE):
        return ""
    try:
        with open(RESULTS_FILE, "r") as f:
            lines = f.readlines()
            if len(lines) > 1:
                # Find the last rejected line
                for line in reversed(lines[1:]):
                    parts = line.strip().split("\t")
                    if len(parts) >= 4 and parts[3] == "REJECTED":
                        return f" (Note: The previous attempt with score {parts[2]} was REJECTED. Avoid repeating its parameters.)"
    except Exception:
        pass
    return ""

def check_drift():
    # Queries the database for average agent performance entropy
    cmd = [
        "psql", DB_URL, "-A", "-t", "-c",
        "SELECT AVG(performance_entropy) FROM agents WHERE is_active=true;"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not res.stdout.strip():
        return 0.0
    try:
        return float(res.stdout.strip())
    except ValueError:
        return 0.0

def log_experiment_data(session_id, metrics):
    log_file = "experiments_history.jsonl"
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    record = {
        "timestamp": timestamp,
        "session_id": session_id,
        "metrics": metrics
    }
    with open(log_file, "a") as f:
        f.write(json.dumps(record) + "\n")

def git_cleanup(target_dir):
    print("🧹 Cleaning up git workspace...")
    # Attempt checking out main, fallback to master if main doesn't exist
    res_checkout = subprocess.run(["git", "checkout", "main"], cwd=target_dir, capture_output=True, text=True)
    if res_checkout.returncode != 0:
        subprocess.run(["git", "checkout", "master"], cwd=target_dir)
    
    # Get list of branches
    res = subprocess.run(["git", "branch"], cwd=target_dir, capture_output=True, text=True)
    if res.returncode == 0:
        for line in res.stdout.splitlines():
            branch_name = line.replace("*", "").strip()
            if branch_name.startswith("temp_eval_"):
                print(f"🗑️ Deleting temp branch {branch_name}...")
                subprocess.run(["git", "branch", "-D", branch_name], cwd=target_dir)

def evaluate_session(sid, target_dir, orig_branch, eval_cmd):
    temp_branch = f"temp_eval_{sid}"
    print(f"🌿 Creating temp branch {temp_branch} and evaluating...")
    subprocess.run(["git", "checkout", "-b", temp_branch], cwd=target_dir, capture_output=True)
    
    print(f"📥 Pulling and applying patch for session {sid}...")
    subprocess.run([JULES_BIN, "remote", "pull", "--session", sid, "--apply"], cwd=target_dir, capture_output=True)
    
    print(f"📊 Running evaluator for session {sid}...")
    eval_res = subprocess.run(eval_cmd, shell=True, cwd=os.path.dirname(RUN_LOOP_PY), capture_output=True, text=True)
    stdout = eval_res.stdout.strip()
    
    metrics = {}
    try:
        for line in reversed(stdout.splitlines()):
            try:
                metrics = json.loads(line)
                if isinstance(metrics, dict):
                    break
            except json.JSONDecodeError:
                continue
    except Exception:
        pass
        
    score = metrics.get("score", 0.0)
    print(f"⭐ Session {sid} score: {score}")
    log_experiment_data(sid, metrics)
    
    # Clean up branch
    subprocess.run(["git", "checkout", orig_branch], cwd=target_dir, capture_output=True)
    subprocess.run(["git", "branch", "-D", temp_branch], cwd=target_dir, capture_output=True)
    
    return score, metrics

def run_loop_step(args):
    # Rate limit check
    if not args.force:
        if os.path.exists(RESULTS_FILE):
            mtime = os.path.getmtime(RESULTS_FILE)
            elapsed = time.time() - mtime
            limit_seconds = 12 * 3600  # 12 hours
            if elapsed < limit_seconds:
                hours_left = (limit_seconds - elapsed) / 3600
                print(f"⚠️ Rate limit: Last sweep was {elapsed/3600:.2f} hours ago (less than 12 hours). Skipping sweep. Use --force to override.")
                return

    task_desc = args.task
    autonomy_directive = (
        "\n\n[CRITICAL DIRECTIVE]: This task is running in a fully automated, non-interactive pipeline. "
        "The simulation folder and evaluator.py do not exist in your workspace. "
        "Do not ask the user for information. You must operate completely autonomously. "
        "Make your optimizations, verify the code compiles, and finish the session."
    )
    task_desc += autonomy_directive

    if args.closed_loop:
        feedback = get_last_rejected_feedback()
        if feedback:
            task_desc += feedback
            
    session_ids = run_jules_new(task_desc, args.target, args.parallel)
    print(f"✅ Registered Session IDs: {session_ids}")
    
    target_dir = os.path.dirname(os.path.abspath(args.target))
    
    # Save current branch name
    branch_res = subprocess.run(["git", "branch", "--show-current"], cwd=target_dir, capture_output=True, text=True)
    orig_branch = branch_res.stdout.strip()
    
    eval_cmd = "python3 evaluator.py"
    if args.multi_objective:
        eval_cmd += " --multi-objective"
    if args.live_telemetry:
        eval_cmd += " --live-telemetry"
        
    best_score = get_best_score()
    best_sid = None
    
    pending_sessions = list(session_ids)
    finished_count = 0
    start_time = time.time()
    
    while pending_sessions and (time.time() - start_time < args.max_wait):
        print(f"🕒 Polling pending sessions {pending_sessions} (Finished: {finished_count}/{len(session_ids)})")
        still_pending = []
        for sid in pending_sessions:
            status = check_session_status(sid)
            print(f"📊 Session {sid} Status: {status}")
            if status in ["Com", "Completed"]:
                score, _ = evaluate_session(sid, target_dir, orig_branch, eval_cmd)
                if score > best_score:
                    best_score = score
                    best_sid = sid
                finished_count += 1
            elif status in ["Fai", "Failed"]:
                finished_count += 1
            else:
                still_pending.append(sid)
        
        pending_sessions = still_pending
        
        # Early exit: if > 60% are done and we have a significant improvement, don't wait for laggards
        if len(session_ids) > 1 and finished_count >= (len(session_ids) * 0.6):
            if best_sid and best_score > get_best_score() + 5.0:
                print(f"🏃 Early Exit: Found improvement {best_score} with {finished_count} sessions. Skipping laggards.")
                break

        if pending_sessions:
            time.sleep(args.poll_interval)
            
    if best_sid:
        print(f"🏆 Winning candidate is Session {best_sid} with score {best_score}")
        # Apply the winner to the main branch
        subprocess.run([JULES_BIN, "remote", "pull", "--session", best_sid, "--apply"], cwd=target_dir)
        # Execute the coordinator one last time to log it
        subprocess.run([
            "python3", RUN_LOOP_PY,
            "--target", args.target,
            "--evaluator", eval_cmd,
            "--metric", "score",
            "--commit-msg", f"Jules Autoresearch Winner (Session {best_sid})"
        ])
    else:
        print("❌ No improvement found in this sweep.")

def main():
    args = parse_args()
    
    # Resolve args.closed_loop variable parsing (python argparse replaces dashes with underscores)
    args.closed_loop = args.closed_loop
    
    # Git tree cleanup at startup
    target_dir = os.path.dirname(os.path.abspath(args.target))
    git_cleanup(target_dir)
    
    if args.daemon:
        print("🛡️ Starting Integrity Autoresearch Suite in persistent Daemon Mode...")
        while True:
            drift = check_drift()
            print(f"🔬 Checked drift: Average Performance Entropy = {drift:.4f} (Threshold: {args.drift_threshold:.4f})")
            if drift > args.drift_threshold:
                print("🚨 Performance Drift detected! Launching optimization loop...")
                try:
                    run_loop_step(args)
                except Exception as e:
                    print(f"❌ Exception in daemon optimization loop: {e}")
            else:
                print("💤 System is stable. Entering sleep cycle.")
            time.sleep(args.daemon_interval)
    else:
        # Run one step
        run_loop_step(args)

if __name__ == "__main__":
    main()
