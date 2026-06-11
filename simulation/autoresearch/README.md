# 🏛️ Xibalba Solutions: Autoresearch Loop for Integrity Protocol

This sandbox contains the coordinator and evaluators to run an autonomous "modify-train-verify" optimization loop, as described in Andrej Karpathy's `autoresearch` protocol.

---

## 📂 Components

1. **`run_loop.py`**: The coordinator that executes the target command, checks the metric improvement, commits standard changes, or rolls back unsuccessful candidates.
2. **`evaluator.py`**: Compiles the Rust scoring core, runs unit tests, evaluates synthetic datasets, and outputs evaluation scores as JSON to `stdout`.
3. **`results.tsv`**: Persistent log of all trials, metrics, git hashes, and decisions.

---

## 🚀 How to Execute the Loop

To run an optimization step on the dynamic tri-metric scoring weights:

```bash
python3 run_loop.py \
  --target ../../integrity-oracle/scoring-core/src/lib.rs \
  --evaluator "python3 evaluator.py" \
  --metric "score" \
  --commit-msg "autoresearch: optimize dynamic scoring weights"
```

### 🧠 How an Agent Learns from This Loop

When executing this loop:
1. **Analyze:** Read `results.tsv` to see previous successful and failed attempts.
2. **Modify:** Edit the target file (e.g., `lib.rs` default weights, or custom coefficients) with a proposed enhancement.
3. **Validate:** Execute the `run_loop.py` command.
4. **Iterate:** If the change is committed, the new score becomes the baseline. If reverted, analyze why it failed and propose a different variation.
