---
title: Integrity Oracle
acronyms: [AIS, ZK-ML]
created: 2026-06-19
updated: 2026-06-19
type: entity
tags: [infrastructure, metrics]
confidence: high
source_files:
  - integrity-oracle/README.md
  - integrity-oracle/Cargo.toml
  - integrity-oracle/anchor_xibalba_ais.py
---
The `integrity-oracle` is the foundational backend service of the Integrity Protocol. It serves as Node 5 in the End-to-End (E2E) Validation Lifecycle. Built in Rust and Axum for maximum concurrency and safety, it processes high-frequency agent telemetry, verifies cryptographic proofs (ZK-ML), enforces domain-specific scoring policies, and anchors agent behaviors to the Base L2 blockchain. It calculates the Agent Integrity Score (AIS).
