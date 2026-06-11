---
title: Model Contextual Integrity Protocol (MCIP)
acronyms: [MCIP]
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [compliance, cryptography, identity]
confidence: high
---

# Model Contextual Integrity Protocol (MCIP)

The **Model Contextual Integrity Protocol (MCIP)** is an agentic design and security standard engineered to regulate and secure fluid, AI-generated user interfaces (**GenUI**).

## 1. The Security Challenge of GenUI
In next-generation agent loops, agents do not merely return text outputs; they dynamically generate entire user interfaces (structured layouts, input fields, and action buttons) on-the-fly depending on user queries. Traditional static access controls (RBAC) and web firewalls fail to secure these components because the interface structure is completely non-deterministic.

If an agent is hijacked via a prompt injection, it could generate a malicious interface designed to siphon private user keys or display forged health data (violating contextual integrity and safety rules).

## 2. Core Security Pillars
MCIP establishes absolute security for agentic interfaces through three architectural standards:

*   **AG-UI (Agent-User Interface) Guardrails:** Enforces a secure sandbox for dynamic visual renders, ensuring the agent cannot generate arbitrary execution blocks without passing through verification nodes.
*   **A2UI (Agent-to-User-Interface) Attestation:** Every dynamically generated input or button is hashed and registered under our [Behavioral Commitment Chain](behavioral-commitment-chain.md). The frontend will refuse to render any UI component that does not possess a valid cryptographic commitment signature.
*   **Contextual Boundary Enforcement:** Evaluates prompt context in parallel. If the generated UI components request inputs that exceed the current conversation's verified permissions, MCIP blocks the interface render and prompts an [Xibalba Shield](../entities/xibalba-shield.md) administrator.

## 3. Related Terms
-   **BCC:** MCIP represents the frontend application layer of the [Behavioral Commitment Chain](behavioral-commitment-chain.md) protocol.
-   **PHI:** MCIP ensures that dynamic UI components processing [phi](phi.md) operate strictly within secure, verified visual layouts.
