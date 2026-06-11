# 🏛️ Autoresearch Skill: Dynamic Integrity Optimization Loop

This file registers the **Autoresearch Skill** inside the `INTEGRITY` project. It equips Xibalba with the precise protocol needed to run mathematical optimization and policy validation loops autonomously.

---

## 🛠️ Skill Capabilities

Xibalba can activate this skill to:
1. **Optimize Scoring Constants:** Calibrate tri-metric scoring weights against historical datasets to improve anomaly classification.
2. **Harden Security Guardrails:** Red-team the OPA policies by discovering bypass pathways and committing corresponding defenses.
3. **Minimize Risk in Control Loops:** Iteratively adjust quantitative parameters to maximize financial metrics (e.g., Sharpe Ratio, liquidity stability).

---

## 🔄 Execution Protocol

To invoke this skill, follow these sequential steps:

### Step 1: Read Historical Context
Examine the `results.tsv` file in `simulation/autoresearch/` to review previous attempts, scores, and status flags.
```bash
cat results.tsv
```

### Step 2: Run Autonomous Jules Optimization (Alternative to manual edits)
Instead of manually editing target files, you can delegate the code modification to Jules:
```bash
python3 jules_loop.py \
  --task "Optimize the weights in scoring-core/src/lib.rs default implementation. Reduce target_tf, target_xi, etc. to match targets in simulation/autoresearch/evaluator.py" \
  --poll-interval 15
```
This script will:
1. Spawn a Jules session with the target instruction.
2. Monitor and wait until the session is completed (`Com`).
3. Automatically pull the patch and apply it to the workspace.
4. Execute `run_loop.py` to evaluate the change, committing or reverting accordingly.

### Step 3: Run the Coordinator (Manual Mode)
If you made manual changes, run the `run_loop.py` coordinator script:
```bash
python3 run_loop.py \
  --target ../../integrity-oracle/scoring-core/src/lib.rs \
  --evaluator "python3 evaluator.py" \
  --metric "score" \
  --commit-msg "autoresearch: optimize dynamic scoring weights"
```

### Step 4: Evaluate the Outcome
* **APPROVED (Commit):** If the score improves, the loop commits the change to the git history and appends to `results.tsv`.
* **REJECTED (Rollback):** If the score does not improve, the loop automatically runs `git checkout` to restore the last approved state.

---

## 📈 Metric Target Definitions
* **Scoring Heuristics (`evaluator.py`):** Target close adherence to theoretical optimum weights or optimized classification bounds.
  * **$w_{xibalba}$ (Audit):** `0.30` (target) vs `0.25` (default)
  * **$w_{sacrifice}$ (Compute):** `0.25` (target) vs `0.20` (default)
  * **$w_{trustflow}$ (Peers):** `0.20` (target) vs `0.25` (default)
  * **$w_{volume}$ (Activity):** `0.10` (target) vs `0.15` (default)
  * **$w_{staking\_age}$ (Stake):** `0.15` (target) vs `0.15` (default)
* **Security OPA rules:** Maximizing the block rate of invalid/malicious payloads while keeping the benign request success rate at 100%.


