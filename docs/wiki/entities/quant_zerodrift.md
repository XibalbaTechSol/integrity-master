---
title: Quant ZeroDrift
acronyms: [AIS]
created: 2026-06-19
updated: 2026-06-19
type: entity
tags: [control-systems, compliance]
confidence: high
source_files:
  - quant_zerodrift/README.md
  - quant_zerodrift/main.cpp
---
`quant_zerodrift` is a high-performance C++ solver designed to prevent algorithmic runaway and drift in autonomous trading agents. It serves as the reference implementation for the Quantitative Finance Domain (Domain ID: `QUANT_01`), translating Trust Level from the Rust Oracle into actionable mathematical bounds to dynamically throttle trading algorithms.
