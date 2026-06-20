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
from integrity_sdk.telemetry.core import get_tracer
from integrity_sdk.telemetry.conventions import GenAIAttributes, IntegrityAttributes, get_gen_ai_span_name

class IntegrityCompletionsWrapper:
    """
    Wraps the OpenAI completions interface to intercept inference streams and metrics
    using high-fidelity OpenTelemetry spans.
    """
    def __init__(self, original_completions: Completions, integrity_client: IntegrityClient):
        self.original_completions = original_completions
        self.integrity_client = integrity_client
        self.tracer = get_tracer("integrity_openai_wrapper")

    def create(self, *args, **kwargs):
        start_time = time.time()
        requested_model = kwargs.get("model", "unknown-model")
        span_name = get_gen_ai_span_name("openai", requested_model)
        
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
            response_generator = self.original_completions.create(*args, **kwargs)
            return self._stream_interceptor(response_generator, prompt_text, start_time, requested_model=requested_model)
        
        with self.tracer.start_as_current_span(span_name) as span:
            span.set_attribute(GenAIAttributes.SYSTEM, "openai")
            span.set_attribute(GenAIAttributes.REQUEST_MODEL, requested_model)
            span.set_attribute(GenAIAttributes.PROMPT, prompt_text)
            
            response = self.original_completions.create(*args, **kwargs)
            latency_ms = (time.time() - start_time) * 1000

            try:
                completion_text = response.choices[0].message.content or ""
                actual_model = getattr(response, "model", requested_model)
                
                span.set_attribute(GenAIAttributes.RESPONSE_MODEL, actual_model)
                span.set_attribute(GenAIAttributes.COMPLETION, completion_text)
                
                usage = getattr(response, "usage", None)
                if usage:
                    span.set_attribute(GenAIAttributes.INPUT_TOKENS, usage.prompt_tokens)
                    span.set_attribute(GenAIAttributes.OUTPUT_TOKENS, usage.completion_tokens)
                
                self._calculate_and_set_behavior_metrics(span, prompt_text, completion_text)
            except Exception as e:
                span.record_exception(e)

            return response

    def _stream_interceptor(self, generator, prompt_text: str, start_time: float, requested_model: str):
        span_name = get_gen_ai_span_name("openai", requested_model)
        
        span = self.tracer.start_span(span_name)
        span.set_attribute(GenAIAttributes.SYSTEM, "openai")
        span.set_attribute(GenAIAttributes.REQUEST_MODEL, requested_model)
        span.set_attribute(GenAIAttributes.PROMPT, prompt_text)

        collected_chunks = []
        actual_model = requested_model
        
        chunk_latencies = []
        last_chunk_time = start_time
        ttft = 0.0
        
        try:
            for chunk in generator:
                now = time.time()
                latency = (now - last_chunk_time) * 1000
                chunk_latencies.append(latency)
                
                if not collected_chunks:
                    ttft = (now - start_time) * 1000
                
                last_chunk_time = now
                yield chunk
                try:
                    if chunk.choices and chunk.choices[0].delta.content:
                        collected_chunks.append(chunk.choices[0].delta.content)
                    if hasattr(chunk, "model") and chunk.model:
                        actual_model = chunk.model
                except Exception:
                    pass
        finally:
            completion_text = "".join(collected_chunks)
            total_latency_ms = (time.time() - start_time) * 1000
            
            # Calculate Jitter (standard deviation of chunk latencies)
            jitter = 0.0
            avg_chunk_latency = 0.0
            if len(chunk_latencies) > 1:
                avg_chunk_latency = sum(chunk_latencies[1:]) / (len(chunk_latencies) - 1)
                variance = sum((x - avg_chunk_latency)**2 for x in chunk_latencies[1:]) / (len(chunk_latencies) - 1)
                jitter = math.sqrt(variance)

            span.set_attribute(GenAIAttributes.RESPONSE_MODEL, actual_model)
            span.set_attribute(GenAIAttributes.COMPLETION, completion_text)
            span.set_attribute("gen_ai.usage.ttft_ms", ttft)
            span.set_attribute("gen_ai.usage.token_jitter_ms", jitter)
            
            self._calculate_and_set_behavior_metrics(span, prompt_text, completion_text, {
                "ttft_ms": ttft,
                "token_jitter_ms": jitter,
                "tokens_per_sec": (len(collected_chunks) / (total_latency_ms / 1000.0)) if total_latency_ms > 0 else 0
            })
            span.end()

    def _calculate_and_set_behavior_metrics(self, span, prompt: str, completion: str, extra_metrics: Optional[Dict] = None):
        extra_metrics = extra_metrics or {}
        # Calculate local perplexity heuristics
        words = completion.split()
        unique_words = set(words)
        entropy = 0.5
        if words:
            entropy = len(unique_words) / len(words)
        
        grounding = 0.95
        if "hallucinate" in completion.lower() or "not sure" in completion.lower():
            grounding = 0.40

        if span:
            span.set_attribute(IntegrityAttributes.ENTROPY, entropy)
            span.set_attribute(IntegrityAttributes.GROUNDING, grounding)
        
        # Still log to the custom batcher for ZK proof generation (backward compatibility)
        log_metadata = {
            "prompt_length_chars": len(prompt),
            "completion_length_chars": len(completion),
            "provider": "openai-integrity-wrapper",
            "model_name": span.attributes.get(GenAIAttributes.RESPONSE_MODEL) if span else "unknown",
            "text_output": completion # for vocabulary diversity calculation in log_telemetry
        }
        log_metadata.update(extra_metrics)

        self.integrity_client.log_telemetry(
            metadata=log_metadata,
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
