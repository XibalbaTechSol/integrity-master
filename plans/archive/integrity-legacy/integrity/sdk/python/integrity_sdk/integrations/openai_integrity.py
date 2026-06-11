import time
import math
from typing import Any, Dict, Optional, Union, List

# Standard OpenAI client import
try:
    from openai import OpenAI
    from openai.resources.chat import Completions
except ImportError:
    # Graceful mock fallback if openai is not present in local virtualenv
    class OpenAI:
        def __init__(self, *args, **kwargs):
            pass
    class Completions:
        def __init__(self, client):
            pass

from integrity_sdk.client import IntegrityClient

class IntegrityCompletionsWrapper:
    """
    Wraps the OpenAI completions interface to intercept inference streams and metrics.
    """
    def __init__(self, original_completions: Completions, integrity_client: IntegrityClient):
        self.original_completions = original_completions
        self.integrity_client = integrity_client

    def create(self, *args, **kwargs):
        start_time = time.time()
        
        # Capture prompt details
        messages = kwargs.get("messages", [])
        prompt_text = ""
        try:
            prompt_text = " ".join([m.get("content", "") for m in messages if isinstance(m, dict)])
        except Exception:
            pass

        # Check if streaming response is requested
        stream = kwargs.get("stream", False)
        
        if stream:
            # Wrap standard streaming generator to intercept output chunks
            response_generator = self.original_completions.create(*args, **kwargs)
            return self._stream_interceptor(response_generator, prompt_text, start_time)
        
        # Direct non-streaming execution
        response = self.original_completions.create(*args, **kwargs)
        latency_ms = (time.time() - start_time) * 1000

        try:
            completion_text = response.choices[0].message.content or ""
            self._log_and_shield(prompt_text, completion_text, latency_ms)
        except Exception as e:
            print(f"[Integrity OpenAI Wrapper] Logging failed: {e}")

        return response

    def _stream_interceptor(self, generator, prompt_text: str, start_time: float):
        collected_chunks = []
        for chunk in generator:
            yield chunk
            try:
                if chunk.choices and chunk.choices[0].delta.content:
                    collected_chunks.append(chunk.choices[0].delta.content)
            except Exception:
                pass
        
        latency_ms = (time.time() - start_time) * 1000
        completion_text = "".join(collected_chunks)
        
        try:
            self._log_and_shield(prompt_text, completion_text, latency_ms)
        except Exception as e:
            print(f"[Integrity OpenAI Wrapper] Streaming log failed: {e}")

    def _log_and_shield(self, prompt: str, completion: str, latency_ms: float):
        # Calculate local perplexity heuristics
        words = completion.split()
        unique_words = set(words)
        entropy = 0.5
        if words:
            # Simple unique ratio as a proxy for cognitive entropy / repetitiveness
            entropy = len(unique_words) / len(words)
        
        # Context grounding semantic alignment (sliding window mock)
        grounding = 0.95
        if "hallucinate" in completion.lower() or "not sure" in completion.lower():
            grounding = 0.40

        # Post telemetry asynchronously
        self.client_metadata = {
            "prompt_length_chars": len(prompt),
            "completion_length_chars": len(completion),
            "latency_ms": latency_ms,
            "unique_words_count": len(unique_words),
            "provider": "openai-integrity-wrapper"
        }

        self.integrity_client.log_telemetry(
            metadata=self.client_metadata,
            entropy=entropy,
            grounding=grounding
        )


class IntegrityOpenAI(OpenAI):
    """
     ड्रॉप-इन (drop-in) OpenAI Client wrapper with non-blocking, zero-friction telemetry.
    """
    def __init__(self, *args, agent_id: str = "openai_agent_edge", oracle_url: str = "http://localhost:3001/ingest", **kwargs):
        # Initialize standard OpenAI client
        super().__init__(*args, **kwargs)
        self.integrity_client = IntegrityClient(agent_id=agent_id, oracle_url=oracle_url)
        
        # Override chat.completions using custom interceptor wrapper
        if hasattr(self, "chat") and hasattr(self.chat, "completions"):
            self.chat.completions = IntegrityCompletionsWrapper(
                original_completions=self.chat.completions,
                integrity_client=self.integrity_client
            )
