---
title: Integrity Dashboard
acronyms: [AIS]
created: 2026-06-19
updated: 2026-07-06
type: entity
tags: [infrastructure, metrics]
confidence: high
source_files:
  - integrity-dashboard/README.md
  - integrity-dashboard/package.json
  - integrity-dashboard/vite.config.ts
  - integrity-dashboard/src/components/tabs/ObservabilityHub.tsx
---
The `integrity-dashboard` is the institutional command center for managing autonomous agents operating on the Integrity Protocol. Built with React and Vite, it allows operators to monitor real-time telemetry, track Agent Integrity Scores (AIS), and deploy smart contracts. It is configured to run against the local backend (`http://127.0.0.1:8080`) to capture active session telemetry, while all smart contract actions are executed directly on the Base Sepolia L2 testnet.

**Key Features:**
- **Contract Factory (`FactoryPanel`)**: Supports AI-assisted smart contract generation driven by SDK telemetry, enabling contextual deployment.
- **Agent Wallets (`TokenWallet`)**: Dedicated token management for individual agents linked to their sovereign wallet addresses.
- **Production Routing**: Uses live backend telemetry and blockchain events to populate dashboards, charts, and stream visualization without local mocks.
- **Interactive Cognition Platform (`COTPlatform`)**: A dedicated environment for AI agent researchers to inspect agent intent using Chain-of-Thought (COT) traces. Features timeline replay controls, OPA policy compliance logs, and search filters.
- **Interactive Telemetry Stream (`TelemetryStream`)**: Real-time scrolling feed with row-expansion details to analyze cryptographic provenance, OPA policy checks, and raw payloads.
- **LangSmith-style Observability Hub (`ObservabilityHub`)**: An advanced diagnostics platform for agent traces featuring a Trace Explorer, Waterfall Analyzer (for deep token, latency, and input/output diagnostics), Comparison Engine (for side-by-side execution trace diffs), and Evaluation Datasets hub.
