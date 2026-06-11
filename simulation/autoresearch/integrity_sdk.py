import json
import uuid
import time
import os
import psutil
import queue
import threading
from datetime import datetime
from contextvars import ContextVar

# Track active span for hierarchical tracing
active_span_var: ContextVar[str] = ContextVar("active_span", default=None)

class TelemetryClient:
    """
    High-performance telemetry client with background asynchronous ingestion.
    """
    
    def __init__(self, session_id: str = None, log_file: str = "agent_telemetry.jsonl"):
        self.session_id = session_id or str(uuid.uuid4())
        self.log_file = log_file
        self.queue = queue.Queue()
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()

    def _worker(self):
        """Background thread for non-blocking file I/O."""
        while True:
            event = self.queue.get()
            if event is None: break
            with open(self.log_file, "a") as f:
                f.write(json.dumps(event) + "\n")
            self.queue.task_done()

    def _log_event(self, event_type: str, payload: dict, parent_id: str = None):
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": self.session_id,
            "event_type": event_type,
            "span_id": str(uuid.uuid4()),
            "parent_id": parent_id or active_span_var.get(),
            **payload
        }
        self.queue.put(event)

    def span(self, name: str):
        class SpanContext:
            def __init__(self, client, name):
                self.client = client
                self.name = name
                self.token = None
            def __enter__(self):
                span_id = str(uuid.uuid4())
                self.token = active_span_var.set(span_id)
                self.client._log_event("span_start", {"name": self.name}, parent_id=None)
                return span_id
            def __exit__(self, exc_type, exc_val, exc_tb):
                active_span_var.reset(self.token)
                self.client._log_event("span_end", {"name": self.name})
        return SpanContext(self, name)

    def log_step(self, step_name: str, reasoning: str, context: dict = None):
        self._log_event("reasoning_step", {
            "step": step_name,
            "reasoning": reasoning,
            "context": context or {}
        })

    def log_metric(self, name: str, value: float, metadata: dict = None):
        self._log_event("metric", {
            "name": name,
            "value": value,
            "metadata": metadata or {}
        })

    def log_llm_metrics(self, model: str, prompt_tokens: int, completion_tokens: int, latency: float):
        self._log_event("llm_metrics", {
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "latency_seconds": latency
        })

    def capture_resources(self):
        proc = psutil.Process()
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_mb": proc.memory_info().rss / 1024 / 1024
        }
