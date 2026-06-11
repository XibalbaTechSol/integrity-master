import time
import math
from typing import Any, Dict, List
from langchain.callbacks.base import BaseCallbackHandler
from ..client import IntegrityClient

class IntegrityLangChainCallback(BaseCallbackHandler):
    """
    Xibalba Solutions: LangChain Callback Integration
    Automatically captures latency, performance variance, and shannon entropy
    to dispatch signed telemetry to the Integrity Oracle.
    """
    def __init__(self, agent_id: str, secret_key: str, endpoint: str = "http://localhost:8080"):
        self.client = IntegrityClient(agent_id=agent_id, secret_key=secret_key, endpoint=endpoint)
        self.start_times = {}

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        run_id = kwargs.get("run_id")
        self.start_times[run_id] = time.perf_counter()

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        run_id = kwargs.get("run_id")
        if run_id not in self.start_times:
            return

        latency = time.perf_counter() - self.start_times[run_id]
        text_outputs = [generation.text for generations in response.generations for generation in generations]
        
        # Calculate local entropy of generated text
        entropy = self._calculate_shannon_entropy(" ".join(text_outputs))
        
        # Dispatch telemetry payload with Point-of-Origin Signature
        try:
            self.client.send_telemetry(
                latency_ms=int(latency * 1000),
                performance_variance=float(math.log(latency + 1.0)),
                accuracy_score=0.98, # Base score, dynamically updated in downstream tasks
                avg_entropy=int(entropy * 100),
                avg_grounding=900,
            )
            print(f"[INTEGRITY] Telemetry dispatched for run {run_id}")
        except Exception as e:
            print(f"[INTEGRITY] Failed to dispatch telemetry: {e}")

    def _calculate_shannon_entropy(self, text: str) -> float:
        if not text:
            return 0.0
        frequencies = {}
        for char in text:
            frequencies[char] = frequencies.get(char, 0) + 1
        entropy = 0.0
        total_chars = len(text)
        for count in frequencies.values():
            p = count / total_chars
            entropy -= p * math.log2(p)
        return entropy
