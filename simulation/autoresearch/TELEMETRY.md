# Integrity Protocol Telemetry System

This document outlines the telemetry architecture used for tracing agent reasoning and measuring success within the integrity simulation.

## Overview

We have implemented a high-performance telemetry system that logs agent intent (reasoning), hierarchical spans, system resource usage, and outcomes (metrics) in parallel with legacy file-based logging. All telemetry ingestion is now asynchronous and non-blocking.

## Core Components

1.  **`integrity_sdk.py` (TelemetryClient)**:
    *   **Asynchronous Ingestion**: Logs are pushed to a background queue for non-blocking I/O.
    *   **Hierarchical Tracing**: Use `sdk.span("name")` as a context manager to group related logs and events.
    *   **Reasoning**: `log_step(step_name, reasoning, context)` records the agent's intent.
    *   **Metrics**: `log_metric(name, value, metadata)` records quantitative outcomes.
    *   **LLM Metrics**: `log_llm_metrics(model, prompt_tokens, completion_tokens, latency)` for LLM-specific observability.
    *   **Resource Monitoring**: `capture_resources()` returns a snapshot of CPU/RAM usage.
2.  **`reflective_agent.py` (ReflectiveAgent)**:
    *   Wraps agent execution to force a reflection phase based on historical telemetry.
    *   Automatically injects `MemoryEngine` history into the agent's context to facilitate self-correction.
3.  **`memory_engine.py` (MemoryEngine)**:
    *   Retrieves and summarizes past reasoning steps from the telemetry store.
4.  **`agent_telemetry.jsonl`**: The central sink for structured telemetry data.

## Workflow Integration

When building new agent loops:
1.  **Initialize**: Set up `TelemetryClient`, `MemoryEngine`, and wrap the agent logic with `ReflectiveAgent`.
2.  **Reflect**: Let `ReflectiveAgent` inject past context before executing the task.
3.  **Trace**: Use `with sdk.span("scope_name"):` to create hierarchical context for nested operations.
4.  **Log**:
    *   Use `sdk.log_step` for high-level reasoning.
    *   Use `sdk.capture_resources()` to log system state.
    *   Use `sdk.log_llm_metrics` if the agent invokes an LLM.

## Validation

Run `python3 validate_telemetry_correlation.py` to verify that recent reasoning steps correctly map to performance outcomes in `results.tsv`.
