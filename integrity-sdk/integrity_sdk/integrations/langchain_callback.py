"""
langchain_callback.py — Integrity Protocol Integration for LangChain

This callback handler drops seamlessly into any LangChain agent to provide
frictionless, automatic zero-knowledge telemetry logging to the Integrity Oracle.
"""

import time
from typing import Any, Dict, List, Optional
try:
    from langchain.callbacks.base import BaseCallbackHandler
    from langchain.schema import LLMResult
except ImportError:
    # Graceful degradation if LangChain isn't installed
    class BaseCallbackHandler:
        pass
    LLMResult = Any

class IntegrityLangChainCallback(BaseCallbackHandler):
    """
    Callback handler for LangChain that logs LLM interactions to the Integrity Protocol.
    
    Usage:
        client = IntegrityClient(agent_id="my-agent")
        callback = IntegrityLangChainCallback(client)
        llm = ChatOpenAI(callbacks=[callback])
    """
    
    def __init__(self, integrity_client):
        """Initialize with an active IntegrityClient."""
        self.client = integrity_client
        self.start_times: Dict[str, float] = {}

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        """Run when LLM starts running."""
        run_id = str(kwargs.get("run_id", "default"))
        self.start_times[run_id] = time.time()

    def on_chat_model_start(
        self, serialized: Dict[str, Any], messages: List[List[Any]], **kwargs: Any
    ) -> None:
        """Run when Chat Model starts running."""
        run_id = str(kwargs.get("run_id", "default"))
        self.start_times[run_id] = time.time()

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Run when LLM ends running, calculate latency and log telemetry."""
        run_id = str(kwargs.get("run_id", "default"))
        start_time = self.start_times.pop(run_id, time.time())
        latency_ms = (time.time() - start_time) * 1000

        # Attempt to extract generic usage and text
        try:
            for i, generation in enumerate(response.generations):
                for gen in generation:
                    text_output = gen.text
                    
                    # Extract token metadata if available
                    token_usage = response.llm_output.get("token_usage", {}) if response.llm_output else {}
                    
                    # Build mock "raw" payload standard to be parsed by extractor
                    mock_payload = {
                        "text": text_output,
                        "usage": token_usage,
                        "model": response.llm_output.get("model_name", "langchain-generic") if response.llm_output else "langchain-generic"
                    }

                    # Log via IntegrityClient (which handles ZK proving and DID binding)
                    self.client.log_inference(
                        provider="langchain",
                        raw_data=mock_payload,
                        latency_ms=latency_ms,
                        extra_metadata={
                            "framework": "langchain",
                            "run_id": run_id
                        }
                    )
        except Exception as e:
            # Fallback to avoid crashing agent
            print(f"[IntegrityLangChainCallback] Failed to extract telemetry: {e}")

    def on_llm_error(self, error: Exception, **kwargs: Any) -> None:
        """Run when LLM errors."""
        run_id = str(kwargs.get("run_id", "default"))
        start_time = self.start_times.pop(run_id, time.time())
        latency_ms = (time.time() - start_time) * 1000
        
        self.client.log_telemetry(
            metadata={
                "framework": "langchain",
                "error": str(error),
                "latency_ms": latency_ms,
                "status": "failed"
            }
        )
