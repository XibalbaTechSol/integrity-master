---
title: Aztec Noir Circuits
acronyms: [ZKP, PAE]
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [cryptography, compliance, layer-2]
confidence: high
---

# Aztec Noir Circuits

**Aztec Noir Circuits** are our core mathematical privacy-preserving engines, referred to in commercial packaging as **Private Attestation Engines (PAEs)**. 

They allow downstream entities (like hospitals, compliance officers, and insurers) to mathematically verify that an AI agent calculated its trust and quality metrics honestly, **without ever exposing the sensitive private data** processed by the agent.

## 1. Under-the-Hood Cryptography
Noir is a domain-specific, Rust-like language created by **Aztec Network** for writing **Zero-Knowledge Proofs (ZKPs)**. When our code is compiled into a "circuit" (a system of arithmetic polynomial equations), it handles execution in two segments:

1.  **Secret Private Inputs:** The local agent's host processes sensitive parameters (e.g. raw Protected Health Information [phi](phi.md), database inputs, LLM prompt texts, or model logprobs) entirely in local memory.
2.  **Public Proof Generation:** The local host runs the Noir prover to compile these secret inputs into a compact cryptographic proof (using Aztec’s hyper-optimized C++ proving backend, **Barretenberg**).

## 2. Institutional Application
Our Axum Oracle server and Base L2 smart contracts run standard **UltraPlonk** verifiers. They can verify the mathematical proof in milliseconds. 
If the proof passes, it guarantees that:
*   The agent evaluated its outputs against our designated compliance policies.
*   The metrics contributing to the agent's [ais](ais.md) were calculated honestly and have not been tampered with.
*   Zero private medical data or proprietary IP was leaked to the public network.

## 3. Related Terms
-   **BCC:** Aztec Noir Circuits can verify that a pre-execution commitment registered on the [Behavioral Commitment Chain](behavioral-commitment-chain.md) complies with local OPA rules without revealing the raw state parameters.
-   **Sync-Stack:** Our Rust Oracle utilizes a high-throughput C++ FFI bridge to verify these mathematical circuits on-the-fly, integrating cleanly with the [Xibalba Quant](../entities/xibalba-quant.md) and [Xibalba Shield](../entities/xibalba-shield.md) pipelines.
