# Cognitive Local Metrology Heuristics 🧠

A core design principle of the Integrity Protocol is **client-side metrics evaluation**. The SDK must evaluate and calculate cognitive telemetry parameters locally on raw prompt/completion arrays before they are signed and transmitted, keeping the off-chain oracle server fully stateless and zero-trust.

---

## 1. Token Logprobability Entropy

Perplexity and token distribution entropy are critical metrics for tracking model cognitive stability, repeating loops, or sudden perplexity spikes (indicating potential model hijacking or jailbreaks).

- **The Calculation**:
  For a completion containing $N$ generated tokens, the local metrology parser extracts the logprobabilities $p(t_i)$ of each generated token:
  $$\text{Entropy} = -\frac{1}{N} \sum_{i=1}^{N} p(t_i) \log p(t_i)$$
- **Repetitive Loops**: If an agent gets stuck in a repetitive loop (e.g. repeating the same sentence), token entropy collapses to nearly zero.
- **Jailbreak Perplexity**: A sudden, extreme spike in logprobability entropy suggests that the model is processing unexpected structures, indicating a high-risk security breach.

---

## 2. Sliding-Window Grounding & Context Adherence

To mathematically ensure that an agent is not hallucinating or outputting fabrications outside its retrieved knowledge bases (RAG context), the SDK runs a local sliding-window context adherence parser:

1. **RAG Extraction**: Intercepts the retrieved documents injected into the system prompt.
2. **N-Gram Overlap**: Breaks both the RAG context and the generated completion into $N$-grams (default: $N=3$).
3. **Alignment Score**: Calculates the proportion of completion $N$-grams that directly exist inside the retrieved RAG context:
   $$\text{Grounding Index} = \frac{|N\text{-grams}_{\text{completion}} \cap N\text{-grams}_{\text{RAG}}|}{|N\text{-grams}_{\text{completion}}|}$$
4. If the grounding index falls below standard thresholds (e.g., $< 0.70$), the SDK marks the batch as containing high perplexity or potential hallucinations.

---

## 3. Heuristic Task Completion (Heuristic Loop)

The SDK implements automated heuristics to verify successful execution bounds:
- **Git Commit Check**: Hooks terminal harnesses to verify code commit success.
- **HTTP Return Codes**: Parses agent tool-use HTTP return statuses.
- **User-in-the-Loop Hooks**: Intercepts user feedback inputs to evaluate reputation adjustments.

By processing these dimensions locally, the agent self-documents its **Agent Integrity Score (AIS)**, which is then cryptographically sealed via Aztec Noir ZK-proofs and signed in transit!

---

## 4. Advanced Composite Risk Scoring (v2.1)

The Integrity SDK v2.1 introduces an automated correlation layer that mathematically combines microscopic inference state (from LLM spans) with macroscopic host telemetry (from `psutil`) to generate 7 predictive risk indicators.

### 4.1. Reconnaissance Risk Index
**Definition**: $R = (\text{PathEntropy} \times \omega_{\text{recon\_tools}})$, where $\omega$ is a multiplier for recent tool calls in the reconnaissance set (`ls`, `find`, etc.).

### 4.2. Compute Substitution Detection
**Definition**: An anomaly detector on token latency jitter. 
$S = 1.0$ if $\sigma(\text{latencies}) < \tau_{\text{threshold}}$, flagging unusually stable inference patterns typical of smaller, spoofed models.

### 4.3. Cognitive Fatigue
**Definition**: $F = \Delta(\text{MeanGrounding}_{t_0..t_n}, \text{MeanGrounding}_{t_m..t_z})$. Tracks the decay of RAG grounding scores over long-running sessions.

### 4.4. Lateral Movement Probability
**Definition**: $P = \frac{\text{IPEntropy}}{3.0} + \text{intent\_match}(\text{completion})$. Correlation between network destination diversity and completion text intent signals.

### 4.5. Energy-to-Intent Efficiency
**Definition**: $E = \frac{\text{TokensPerSec}}{\text{CPUUsage} + 1.0}$. Flags compute-heavy logic loops or stalled inference processes.

### 4.6. Semantic Contradiction Score
**Definition**: $C = 1.0$ iff $\text{tool\_status} == \text{FAIL} \land \text{model\_completion} == \text{SUCCESS}$.

### 4.7. Workspace Blast Radius
**Definition**: $B = \frac{\text{WriteBytes}}{\text{ReadBytes}} / 10.0$. Quantifies the potential impact of a tool call based on I/O flux.
