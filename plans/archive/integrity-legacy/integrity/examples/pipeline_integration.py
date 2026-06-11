"""
Example: Integrating the Integrity SDK into LLM/Inference Pipelines.

This shows how an AI agent harness (like Xibalba Solutions or other developers) 
hooks the Integrity SDK directly into LLM outputs from OpenAI, Anthropic, or 
together.ai to automatically extract, price, and log telemetry.
"""
import sys
import os
import time

# Add SDK path directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk", "python"))

from integrity_sdk import IntegrityClient

def main():
    print("🚀 Initializing Integrity Client...")
    integrity = IntegrityClient(
        agent_id="xibalba",
        oracle_url="http://localhost:3001/ingest",
        enable_full_recording=True
    )

    print("🤖 Simulating OpenAI API response hook...")
    # Mocking standard OpenAI response structure
    mock_openai_response = {
        "id": "chatcmpl-12345",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "gpt-4o",
        "system_fingerprint": "fp_44709d6fcb",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "SELL 5 BTC AT MARKET LIMIT. DRAWDOWN WITHIN SAFETY THRESHOLD.",
                    "logprobs": {
                        "content": [
                            {"token": "SELL", "logprob": -0.015},
                            {"token": "5", "logprob": -0.03},
                            {"token": "BTC", "logprob": -0.02},
                        ]
                    }
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 152,
            "completion_tokens": 12,
            "total_tokens": 164
        }
    }

    # Pass the raw OpenAI response block directly to the SDK!
    integrity.log_inference(
        provider="openai",
        raw_data=mock_openai_response,
        latency_ms=284.5,
        ttft_ms=45.2,
        extra_metadata={"custom_trigger": "volatility_stop_loss"},
        subagent_id="XibalbaTrader"
    )
    print("✅ OpenAI pipeline logged successfully.")

    print("🤖 Simulating Anthropic Claude API response hook...")
    # Mocking standard Anthropic response structure
    mock_anthropic_response = {
        "id": "msg_01Xxxxx",
        "type": "message",
        "role": "assistant",
        "model": "claude-3-5-sonnet-20241022",
        "content": [
            {
                "type": "text",
                "text": "Audit checks verified. Position sizing compliant with risk directives."
            }
        ],
        "stop_reason": "end_turn",
        "stop_sequence": None,
        "usage": {
            "input_tokens": 482,
            "output_tokens": 25
        }
    }

    # Pass raw Anthropic response to the SDK!
    integrity.log_inference(
        provider="anthropic",
        raw_data=mock_anthropic_response,
        latency_ms=620.1,
        extra_metadata={"compliance_status": "PASSED"},
        subagent_id="IntegrityAuditor"
    )
    print("✅ Anthropic pipeline logged successfully.")

    print("\n⏳ Flushing batched telemetry to the database...")
    integrity.shutdown()
    print("🏁 Completed. All data verified and successfully stored.")

if __name__ == "__main__":
    main()
