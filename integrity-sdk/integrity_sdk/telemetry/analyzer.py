import time
import math
import re
from typing import Dict, Any, List, Optional, Deque
from collections import deque
from .conventions import IntegrityAttributes

class CompositeSignalAnalyzer:
    """
    Asynchronously computes composite risk signals by correlating microscopic (inference)
    and macroscopic (host) telemetry.
    """
    def __init__(self, history_limit: int = 10):
        # Event histories for correlation
        self.tool_calls: Deque[Dict[str, Any]] = deque(maxlen=history_limit)
        self.inferences: Deque[Dict[str, Any]] = deque(maxlen=history_limit)
        self.grounding_history: Deque[float] = deque(maxlen=20)
        
        # Recognition patterns for lateral movement
        self.recon_tools = {"list_directory", "ls", "find", "grep_search", "read_file"}
        self.lateral_intent_pattern = re.compile(r"\b(connect|fetch|ssh|ftp|curl|wget|request|post|get)\b", re.IGNORECASE)

    def record_tool_call(self, name: str, args: Any, result_summary: str, rw_ratio: float):
        self.tool_calls.append({
            "name": name,
            "args": args,
            "result": result_summary,
            "rw_ratio": rw_ratio,
            "timestamp": time.time()
        })

    def record_inference(self, prompt: str, completion: str, metrics: Dict[str, Any], host_snapshot: Dict[str, Any]):
        self.inferences.append({
            "prompt": prompt,
            "completion": completion,
            "metrics": metrics, # ttft, jitter, tokens, etc.
            "host": host_snapshot,
            "timestamp": time.time()
        })
        if "grounding" in metrics:
            self.grounding_history.append(metrics["grounding"])

    def compute_all_signals(self, current_metrics: Dict[str, Any]) -> Dict[str, float]:
        """Calculates and returns all 7 composite signals based on current state and history."""
        signals = {}
        
        # 1. Reconnaissance Risk Index
        signals[IntegrityAttributes.RECONNAISSANCE_RISK] = self._calc_recon_risk(current_metrics)
        
        # 2. Compute Substitution Detection
        signals[IntegrityAttributes.COMPUTE_SUBSTITUTION] = self._calc_compute_spoof_risk()
        
        # 3. Cognitive Fatigue
        signals[IntegrityAttributes.COGNITIVE_FATIGUE] = self._calc_cognitive_fatigue()
        
        # 4. Lateral Movement Probability
        signals[IntegrityAttributes.LATERAL_MOVEMENT_PROB] = self._calc_lateral_movement_prob(current_metrics)
        
        # 5. Energy-to-Intent Efficiency
        signals[IntegrityAttributes.ENERGY_EFFICIENCY] = self._calc_energy_efficiency()
        
        # 6. Semantic Contradiction Score
        signals[IntegrityAttributes.SEMANTIC_CONTRADICTION] = self._calc_semantic_contradiction()
        
        # 7. Workspace Blast Radius
        signals[IntegrityAttributes.WORKSPACE_BLAST_RADIUS] = self._calc_blast_radius()
        
        return signals

    def _calc_recon_risk(self, current_metrics: Dict[str, Any]) -> float:
        # High path entropy + recent recon tool calls
        path_entropy = current_metrics.get("path_entropy", 0.0)
        recent_recon = any(t["name"] in self.recon_tools for t in self.tool_calls if time.time() - t["timestamp"] < 30)
        
        risk = path_entropy / 5.0 # Normalization heuristic
        if recent_recon:
            risk *= 2.0
        return min(max(risk, 0.0), 1.0)

    def _calc_compute_spoof_risk(self) -> float:
        if not self.inferences:
            return 0.0
        latest = self.inferences[-1]["metrics"]
        jitter = latest.get("inter_token_jitter_ms", 0.0)
        # Low jitter (highly stable) can indicate a spoofed, optimized small model 
        # while very high jitter can indicate an unstable proxy.
        # This is a complex signature; here we use a simple anomaly heuristic.
        if jitter < 5.0: # Suspiciously stable for a large model
            return 0.7
        return 0.1

    def _calc_cognitive_fatigue(self) -> float:
        if len(self.grounding_history) < 5:
            return 0.0
        # Calculate grounding decay over time
        first_avg = sum(list(self.grounding_history)[:3]) / 3
        last_avg = sum(list(self.grounding_history)[-3:]) / 3
        decay = first_avg - last_avg
        return min(max(decay * 2.0, 0.0), 1.0)

    def _calc_lateral_movement_prob(self, current_metrics: Dict[str, Any]) -> float:
        if not self.inferences:
            return 0.0
        latest = self.inferences[-1]
        intent_match = self.lateral_intent_pattern.search(latest["completion"])
        ip_entropy = current_metrics.get("ip_entropy", 0.0)
        
        prob = ip_entropy / 3.0
        if intent_match:
            prob += 0.5
        return min(max(prob, 0.0), 1.0)

    def _calc_energy_efficiency(self) -> float:
        if not self.inferences:
            return 1.0
        latest = self.inferences[-1]
        cpu = latest["host"].get("cpu_percent", 0.0)
        tokens_per_sec = latest["metrics"].get("tokens_per_sec", 1.0)
        
        # Low tokens per sec with high CPU = low efficiency
        efficiency = tokens_per_sec / (cpu + 1.0)
        # Normalize to 0-1 (higher is better, but we return 'risk' or 'score'?)
        # Let's return the efficiency score where 1.0 is ideal.
        return min(max(efficiency / 10.0, 0.0), 1.0)

    def _calc_semantic_contradiction(self) -> float:
        if not self.tool_calls or not self.inferences:
            return 0.0
        
        latest_tool = self.tool_calls[-1]
        latest_inf = self.inferences[-1]
        
        # If tool returned failure but model says "success" or vice-versa
        tool_fail = "fail" in latest_tool["result"].lower() or "error" in latest_tool["result"].lower()
        model_success = "success" in latest_inf["completion"].lower() or "done" in latest_inf["completion"].lower()
        
        if tool_fail and model_success:
            return 1.0
        return 0.0

    def _calc_blast_radius(self) -> float:
        if not self.tool_calls:
            return 0.0
        # RW ratio during the tool call
        return min(max(self.tool_calls[-1]["rw_ratio"] / 10.0, 0.0), 1.0)
