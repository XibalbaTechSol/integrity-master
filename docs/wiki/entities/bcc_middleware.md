---
title: BCC Middleware
acronyms: [BCC]
created: 2026-06-19
updated: 2026-06-19
type: entity
tags: [compliance, adversarial]
confidence: high
source_files:
  - bcc_middleware/README.md
  - bcc_middleware/main.py
  - bcc_middleware/pyproject.toml
---
The `bcc_middleware` is the primary security gatekeeper (Node 3) for the Xibalba Integrity Protocol. It is a Python sidecar that forces autonomous agents to cryptographically commit their reasoning and intended actions before any smart contract execution or database mutation, preventing prompt injections and unauthorized API calls.
