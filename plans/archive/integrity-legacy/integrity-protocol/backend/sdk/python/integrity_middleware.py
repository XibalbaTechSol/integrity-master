import time
import json
import uuid
from typing import Any, Dict, List, Optional
from .integrity_sdk import IntegritySDK

class IntegrityOpenAIMiddleware:
    """
    OpenAI-compatible interceptor that automatically reports telemetry to Integrity Protocol.
    Wraps the OpenAI client's chat.completions.create method.
    """
    def __init__(self, sdk: IntegritySDK):
        self.sdk = sdk

    def wrap_client(self, client: Any) -> Any:
        original_create = client.chat.completions.create

        def intercepted_create(*args, **kwargs):
            start_time = time.time()
            
            # Execute the original call
            response = original_create(*args, **kwargs)
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Extract metadata for Integrity
            deal_id = f"openai_{uuid.uuid4().hex[:8]}"
            usage = getattr(response, "usage", None)
            total_tokens = usage.total_tokens if usage else 0
            
            # Simple grounding check (can be expanded)
            content = response.choices[0].message.content if response.choices else ""
            accuracy_score = 1.0 if len(content) > 10 else 0.5 # Placeholder logic
            
            # Report to Integrity
            self.sdk.report_metrics(
                deal_id=deal_id,
                performer_address="0xOpenAI_Global",
                amount=float(total_tokens) / 1000.0, # 1 ITK per 1k tokens (example)
                latency_ms=latency_ms,
                accuracy_score=accuracy_score,
                metadata={
                    "model": kwargs.get("model"),
                    "total_tokens": total_tokens,
                    "provider": "openai"
                }
            )
            
            return response

        client.chat.completions.create = intercepted_create
        return client

class IntegrityLangChainCallback:
    """
    Standard LangChain callback handler for seamless telemetry reporting.
    """
    def __init__(self, sdk: IntegritySDK, agent_address: str):
        self.sdk = sdk
        self.agent_address = agent_address

    def on_llm_end(self, response: Any, **kwargs: Any) -> Any:
        """Called at the end of LLM execution."""
        latency_ms = 100 # Mock latency for now (LangChain doesn't always provide it in basic callbacks)
        
        for generation in response.generations:
            for g in generation:
                deal_id = f"lc_{uuid.uuid4().hex[:8]}"
                
                # Report to Integrity
                self.sdk.report_metrics(
                    deal_id=deal_id,
                    performer_address="0xLangChain_Node",
                    amount=1.0, # Flat fee for execution
                    latency_ms=latency_ms,
                    accuracy_score=1.0,
                    metadata={
                        "model": "langchain_proxy",
                        "agent": self.agent_address
                    }
                )

# --- Example Usage ---
if __name__ == "__main__":
    # This is a simulation since we don't have a real OpenAI key here
    sdk = IntegritySDK(local_mode=True)
    middleware = IntegrityOpenAIMiddleware(sdk)
    
    print("🛡️ Integrity Middleware Initialized.")
    print("Example: client = middleware.wrap_client(OpenAI())")
