"""
Example: Integrating the Integrity SDK into the Xibalba Agent.

This shows how a live trading agent would hook telemetry
into the Integrity Protocol without blocking inference.
"""
import sys
import os

# In production, `pip install integrity-sdk` would handle this.
# For local dev, we add the SDK path directly.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk", "python"))

from integrity_sdk import IntegrityClient


def main():
    # Initialize the Integrity Client — connects to the Axum Oracle
    integrity = IntegrityClient(
        agent_id="xibalba-trader-primary",
        oracle_url="http://localhost:3001/ingest"
    )

    # Simulate an agent inference loop
    for tick in range(20):
        # --- Agent does its actual work here (LLM inference, trading logic, etc.) ---
        # ...

        # Log telemetry without blocking with advanced inference metadata!
        entropy_score = 12.5 + (tick * 0.3)
        grounding_score = 95.0 - (tick * 0.5)

        # Simulate dynamic LLM logprobs that slightly decline over time to simulate drift
        simulated_logprobs = [-0.02 - (tick * 0.01), -0.05 - (tick * 0.005), -0.1, -0.03, -0.01]

        integrity.log_telemetry(
            entropy=entropy_score,
            grounding=grounding_score,
            metadata={
                "tick": tick,
                "strategy": "ema_crossover",
                "token_logprobs": simulated_logprobs,
                "text_output": "EXECUTE BUY ORDER FOR BTC SPREAD COMPLIANT GRID SUCCESSFUL",
                "parsing_errors": 0,
                "missing_keys": 0
            }
        )

        print(f"[tick {tick:02d}] entropy={entropy_score:.1f}  grounding={grounding_score:.1f}  (telemetry queued)")

    # Clean shutdown — flushes any remaining batched telemetry
    integrity.shutdown()
    print("\nIntegrity client shut down. All telemetry flushed.")


if __name__ == "__main__":
    main()
