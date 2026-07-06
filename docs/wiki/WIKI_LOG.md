# Xibalba Integrity Project Wiki - Log

> Chronological record of all wiki actions and updates. Append-only.
> Actions: ingest, update, query, lint, create, archive

## [2026-05-31] create | Wiki Initialized
- Domain: Xibalba Integrity Project
- Structure created with SCHEMA.md and index.md.

## [2026-05-31] ingest | Core Legacy and New Specifications
- Ingested raw legacy documents to `raw/legacy/`: README.md, IMPLEMENTATION_PLAN.md, COMPOSABILITY_PRIMITIVES.md, ROADMAP_AND_GOVERNANCE.md, ARCHITECTURE.md, WHITEPAPER.md.
- Ingested raw active specifications to `raw/new/`: integrity_protocol_sdk_spec.md, integrity_protocol_strategy.md, PAYMASTER.md, BCC_MCP_SERVER.md.
- Synthesized and created concept pages in `concepts/`:
  - behavioral-commitment-chain.md
  - model-contextual-integrity-protocol.md
  - aztec-noir-circuits.md
  - tri-metric-protocol.md
  - hardware-fingerprinting.md
  - identity-ceiling.md
  - Acronym aliases: bcc.md, mcip.md, zkp.md, ais.md, did.md, phi.md.
- Synthesized and created entity pages in `entities/`:
  - xibalba-shield.md
  - xibalba-quant.md
  - stablecoin-vault-paymaster.md
  - integrity-registry.md
  - state-anchor.md
  - rust-oracle.md
  - itk-token.md

## [2026-05-31] ingest | Legacy Github Repository Ingest (integrity-protocol)
- Recovered and cloned legacy `integrity-protocol` repository from `https://github.com/XibalbaTechSol/integrity-protocol`.
- Ingested 27 raw legacy markdown documents to `raw/legacy-protocol/` (including developer_guide.md, identity-architecture.md, and governance-dao.md).
- Updated concept pages:
  - identity-ceiling.md: Added EIP-712 cryptographic binding schema and exact math ceiling formulas.
  - Created concept page: ai-proxy-optimism.md (Guarded AI governance and vITK mechanics).
  - Created shortcut redirect: vitk.md.
  - Updated index.md and total page counter to 12.

## [2026-05-31] ingest | Xibalba Shield Business Proposal and Walkthrough
- Ingested raw business proposal to `raw/new/xibalba_shield_proposal.md` and live walkthrough to `raw/new/xibalba_shield_walkthrough.md`.
- Updated entity page:
  - xibalba-shield.md: Refactored with highly detailed clinical use cases (Ambient Scribes, Billing, Conversational Care), the complete EVM contract stack (SovereignAgent.sol, ReputationSBT.sol, AuditShield.sol, StakingReputation.sol), and the low-cost bootstrapped execution strategy (DeepInfra, Groq, AI-assisted R&D).

## [2026-05-31] create | Smart Contracts Master Specification
- Compiled and created master smart contracts page in `entities/`:
  - smart-contracts.md: Documenting Solidity Core architectures including IntegrityRegistry, StateAnchor, TimeWeightedQuadraticStake, StablecoinVaultPaymaster, SovereignAgent, ReputationSBT, AuditShield, and StakingReputation.
- Ingested raw smart contract code parameters directly from compiled codebase files in `/home/xibalba/integrity/contracts/src/`.
- Updated index.md and total page counter to 17.

## [2026-05-31] update | Comprehensive Wiki and Index Expansion
- Audited the entire local wiki workspace, identifying and correcting the total page counter inside `index.md` to reflect the active directory total.
- Extracted and synthesized critical product strategy, metadata catalogs, and integration manuals from the newly cloned legacy repositories.
- Created and linked 4 new concept pages in `concepts/`:
  - business-plan.md: Outlining the base+usage pricing model and bootstrapped pro forma financials.
  - integration-guide.md: Detailing handshakes, SDK examples, and drop-in interceptors (Anthropic, LlamaIndex, OpenAI).
  - metadata-catalog.md: Listing core telemetry fields, OPA schemas, and signed SVG badges.
  - adoption-strategy.md: Documenting the "Insured Agent" insurance underwriter flywheel and HSCC April 2026 compliance advantages.
- Created shortcut redirect: vitk.md.
- Updated index.md and total page counter to 26.

## [2026-06-19] lint | Wiki Sync Loop
- Pages created: 9
- Pages updated: 12
- Dead links fixed: 11
- Orphans resolved: 8

## [2026-06-19] lint | Final Sync
- Total issues: 0
- Status: 100% Synchronized

## [2026-06-19] test | Continuous Test Coverage Loop
- `contracts`: AuditShield.sol and AgentMarketplace.sol tests generated and passed using Foundry.
- `quant_zerodrift`: C++ risk controller test suite generated, compiled, and passed via Makefile.
- `bcc_middleware`: Python test suite (`pytest`, `pytest-asyncio`) generated and passed successfully.
- `integrity-sdk`: Python SDK validation test suite (`pytest`) generated and passed successfully.
- Status: Initial Test Coverage Loop completed via parallel subagent Jules tasks.

## [2026-06-19] update | Trajectory Intent Validation
- `integrity-sdk`: Added `TrajectoryEvaluator` wrapper in `integrity_sdk/evals.py` based on DeepAgents evaluation framework.
- Evaluator captures full execution trajectory (tool calls, file mutations) and natively passes them as actual_execution_context for BCC intent drift evaluation.

## [2026-06-19] lint | Wiki Sync Loop Run
- Pages created: 0
- Pages updated: 20
- Dead links fixed: 20
- Orphans resolved: 1 (Removed VerifiableBridge.sol)
- Stale pages refreshed: 20
- Aspirational content flagged: 0

## [2026-06-19] qa | Boundary Validation Loop
- Executed `devil-sync` adversarial testing on `bcc_middleware` and `integrity-sdk`.
- PII Exfiltration (Scenario 1): Blocked successfully.
- Contract Manipulation (Scenario 2): Vulnerability discovered. Patched `main.py` and `OPA_HIPAA_Guardrails.rego` to block unauthorized contract modifications during audits.
- Telemetry Spoofing (Scenario 3): Vulnerability discovered. Patched `main.py` and `OPA_HIPAA_Guardrails.rego` to block spoofed tracking hooks.
- See detailed artifact: `docs/wiki/queries/devil_advocate_results.md`.

## [2026-06-19] cleanup | Repository Cleanup Loop
- Repository Cleanup Loop: Pruned 2 branches, removed 8 dead files, and organized the repo.

## [2026-06-22] Optimization | Optimize Tri-Metric Weights
* Updated the `TriMetricScoringEngine` default implementation in `integrity-oracle/scoring-core/src/lib.rs`.
* Replaced the relative proportionality weights with optimized weights using Lagrange multipliers (orthogonal projection).
* The new weights strictly minimize Euclidean distance to the legacy 5-metric system targets under a strict 3-metric constraint (summing to 1.0).
* New values: `w_trustflow = 0.36666666666666664`, `w_xibalba = 0.36666666666666664`, `w_sacrifice = 0.26666666666666666`.

## [2026-06-25] update | Interactive Disputes and Contract Details
- `integrity-dashboard`: Expanded "Core Integrity Protocol Contracts" view with live searchable list and inline expandable detail panel detailing technical descriptions, ABI signatures (reads/writes), event specifications, and recent tx logs.
- `integrity-dashboard`: Fixed Base Sepolia RPC event query block limit overflow by capping the lookback window to 1000 blocks.
- `integrity-dashboard`: Integrated "Dispute Transaction" workflow inside the Ledger detail overlay, enabling users to post ITK collateral bonds and file dispute reasons directly.
- `integrity-oracle`: Added `/v1/disputes/raise` endpoint handler to the mock backend to match the live Rust Oracle API.

## [2026-07-01] update | Refined Tri-Metric Weights
- `integrity-oracle/scoring-core`: Removed artificial sum-to-1.0 constraint and updated default weights to exact optimal targets (w_E=0.30, w_G=0.40, w_S=0.35) achieving zero distance error.
- Updated `concepts/tri-metric-protocol.md` to reflect the new exact default weight targets.

## [2026-07-02] fix | Render Backend and UI Integration
- Fixed Render deployment crash by correcting SQLAlchemy ForeignKey column mapping in `database.py`.
- Enforced `IS_PRODUCTION = true` in `integrity-dashboard` constants to ensure production builds point to the correct `integrity-protocol-backend.onrender.com` backend.
- Validated that the Render API is functional and correctly handles requests.
- 2026-07-02: Added /v1/contact endpoint to trust_api.py and updated Personal Site & Dashboard to use Render backend.
## [2026-07-02] fix | Route and Link Audit
- Audited and fixed all links on the personal site and dashboard landing pages.
- Mapped dashboard generic nav routes to absolute github wiki pages and /dashboard application.
## [2026-07-02] refactor | Rename Dashboard to Integrity
- Renamed the dashboard app deployment path from /dashboard/ to /integrity/ to avoid conflicts with old repository naming.

## [2026-07-02] update | Xibalba Shield Features
- Implemented Audit Log Viewer, RBAC UI, Secure Document Vault, and Compliance Dashboard tabs directly into `xibalba-shield` using responsive UI components and Tailwind.

## [2026-07-02] create | Healthcare Value Proposition
- Added `concepts/healthcare-value-proposition.md` to articulate the real measured value of Integrity Protocol (Insurance + Smart BAAs).
- Linked in `WIKI_INDEX.md` and updated page count.

## [2026-07-02] update | BCC Middleware Circuit Breaker
- Implemented stateful `AgentCircuitBreaker` in `bcc_middleware/main.py`.
- Enforces an automated lockout (default 15 mins) on any agent that violates HIPAA policies or attempts actions without an active Smart BAA.
- Updated `bcc_middleware` tests and wiki documentation.

## [2026-07-02] create | Aztec Noir Circuit Scaffold (ZK-PHI)
- Created `integrity-zkp/Nargo.toml` and `integrity-zkp/src/main.nr`.
- Implemented mathematical scaffolding for the Private Attestation Engine (PAE) that calculates a deterministic zero-knowledge hash of PHI and the agent's action payload, allowing downstream verification without revealing the raw inputs on-chain.
- Updated `ShieldPage.tsx` in `integrity-dashboard` to include a "Quarantine Zone" visualizing locked-out agents.

## [2026-07-05] update | Contract Factory and Token Wallet Enhancements
- `integrity-dashboard`: Added an "AI Contract Copilot" to `FactoryPanel.tsx` enabling SDK telemetry-driven code refactoring and smart contract generation.
- `integrity-dashboard`: Updated `TokenWallet.tsx` to prominently display and support transfers using the active dedicated agent's wallet address alongside the connected MetaMask account.

## [2026-07-05] update | Connect Dashboard to Live Production Backend
- `integrity-dashboard`: Disabled local mock environment by setting `IS_PRODUCTION = true` in `constants.ts` to route all dashboard components, metrics, and streams directly to the live Render production backend (`https://integrity-protocol-backend.onrender.com`).
- `integrity-oracle`: Updated mock backend configuration to load agents, transactions, audits, and benchmarks from local JSON databases on startup.

## [2026-07-05] lint | Wiki and Dashboard Quality Sync Pass
- `docs/wiki`: Updated validation paths inside `validate_static.py` and `validate_project_mds.py` to point to `/home/xibalba/Projects/INTEGRITY/docs/wiki`.
- `docs/wiki`: Ingested and indexed 30 missing markdown pages, updating `WIKI_INDEX.md` (Total pages: 105). Running static validations results in 0 broken links and 100% project file alignment.
- `integrity-dashboard`: Fixed all 34 ESLint errors and resolved nested React component layout bugs and impure renders.

## [2026-07-05] test | Closed-Loop Telemetry & Wallet Integration Verification
- `integrity-sdk`: Added `capture_thought` method to `TrajectoryEvaluator` for intermediate trace streaming.
- `integrity-oracle`: Integrated dynamic score recalculation logic and compliance violation endpoints into the mock backend schema.
- `integrity-dashboard`: Successfully ran full-loop E2E Playwright validation workflows, passing all transactional steps (Registration, Loans, Transfers, and Market creation) against mock telemetry feeds.
- `integrity-dashboard`: Set `IS_PRODUCTION = false` in `constants.ts` to route all dashboard components to the local mock backend and ensure data and reasoning trace visibility.

## [2026-07-05] update | Closed-Loop Integrity: All Three Architectural Gaps Resolved
- `bcc_middleware/main.py`: Extracted `_report_violation_to_oracle()` helper. All 6 rejection paths (circuit breaker, BAA, expiration, entropy, AIS threshold, policy) now report violations to Oracle `/v1/ingest` with tiered severity (critical/medium/low).
- `integrity-sdk/client.py`: Added `query_ais()` and `guarded_execute()` methods implementing the dynamic feedback loop (Gap 3). SDK now self-constrains high-privilege actions when AIS drops below configurable threshold.
- `integrity-oracle/mock-backend-seeded.js`: Enhanced `/v1/ingest` handler with tiered AIS penalties (critical=-250, medium=-150, low=-50), violation telemetry logging to dashboard stream, and console audit trail.
- `integrity-oracle/mock-backend-seeded.js`: Wrapped local agent autodiscovery in `ENABLE_MOCK_SEEDS` toggle. Dashboard now shows only organic session data.
- `integrity-dashboard`: Fixed duplicate import block in `IntegrityRadar.tsx`. ESLint: 0 errors. Unit tests: 42/42 passed.
- `bcc_middleware`: 24/24 tests passed. `integrity-sdk`: 44/44 tests passed.

## [2026-07-05] test | Meticulous UI State Validation
- `integrity-dashboard`: Spawned autonomous subagents to meticulously write and verify unit tests for all UI states and components.
- Validated components include `AgentModal`, `TokenWallet`, `MatchService`, `AgentOnboarding`, `DIDExplorer`, `IdentityPanel`, `CreditPanel`, `ActuarialHub`, `FactoryPanel`, `StakingPanel`, `APIKeyPanel`, `GovernancePanel`, and `api.ts`.
- Status: 100% line coverage and UI state validation achieved across all requested dashboard components via parallel subagent UI testers.

## [2026-07-05] update | Interactive Cognition & Telemetry Enhancements
- `integrity-dashboard`: Refactored `COTPlatform.tsx` to build a highly interactive platform for AI agent researchers looking at agent intent using COT traces. Features timeline replay controls, OPA policy compliance logs, step searches, and detailed trace inspector sub-tabs (thoughts, metrics, diffs, policies).
- `integrity-dashboard`: Overhauled `TelemetryStream.tsx` to support interactive row expansions to view cryptographic provenance, policy checks, and raw ingestion payloads, and added filters.
- `integrity-dashboard`: Deduplicated fetched agents list in `DashboardProvider.tsx` case-insensitively.
- `integrity-oracle`: Fixed case-sensitivity bug in mock backend agent find methods preventing duplicate agent insertions.

## [2026-07-05] update | Contract Editor Full-Window Layout Fix
- `integrity-dashboard`: Fixed `FactoryPanel.tsx` IDE grid height from a fixed `620px` to `calc(100vh - 480px)` with a `minHeight: 500px` fallback, making the editor fill the available window height.
- `integrity-dashboard`: Removed redundant `<Panel>` wrappers from `ContractsPage.tsx` around `<FactoryPanel />` in both the `editor` and `protocol` views.
- Source files: `src/components/tabs/FactoryPanel.tsx`, `src/pages/ContractsPage.tsx`.

## [2026-07-05] test | Xibalba Agent Visibility and Playwright E2E Fixes
- `integrity-dashboard`: Fixed agent sidebar deduplication bug in `DashboardProvider.tsx` that filtered out active session agents sharing the same alias ("Xibalba Hermes Master").
- `integrity-oracle`: Fixed missing `eth_address` field in telemetry and violation log entries within `mock-backend-seeded.js`, enabling the dashboard's `COTPlatform` to correctly match and display reasoning trace timelines for selected agents.
- `integrity-dashboard`: Fixed E2E test suite by changing the default `baseURL` in `playwright.config.ts` from `localhost` to `127.0.0.1` to prevent IPv6 connection errors, and changed `waitUntil` strategy from `networkidle` to `domcontentloaded` in `validate_dashboard_e2e.cjs` to prevent timing out on persistent Server-Sent Events (SSE) streams.
- `integrity-dashboard`: Corrected status badge selector from `.status-badge` to `.badge` in `validate_dashboard_e2e.cjs` to match CSS class definitions and eliminate timeout delays.
- Status: All targeted telemetry graphs, COT evals, and trajectory panel Playwright E2E tests are passing successfully.

## [2026-07-05] update | Observability Hub (LangSmith integration)
- `integrity-dashboard`: Created `ObservabilityHub.tsx` within the Cognition tab. Implemented an advanced tracing platform inspired by LangSmith featuring Trace Explorer, Waterfall Diagnostics (hierarchical span breakdown), Comparison Engine, and Evaluator Datasets.
- `docs/wiki`: Updated `integrity-dashboard.md` to reflect the new feature.

## [2026-07-05] update | Telemetry, Diagnostics & Identity Management Upgrades
- `integrity-dashboard`: Refactored `TelemetryGraphs.tsx` to support plotting multiple selected agents simultaneously on multi-metric telemetry graphs using checkbox selectors.
- `integrity-dashboard`: Enhanced `DiagnosticsPanel.tsx` with dynamic log search filtering, interactive real-time SHA-256 state hash calculations, and a simulated manual verification sweep.
- `integrity-dashboard`: Updated `IntegrityRadar.tsx` with an interactive toggle switching between standard Integrity Vectors (blue/green) and Tri-Metric Risk Scores (Entropy Behavioral Drift, Grounding Hallucination Risk, and Sacrifice Sybil Exposure in crimson/amber colorways).
- `integrity-dashboard`: Upgraded `DIDExplorer.tsx` with a manual "Download DID Document (.json)" file export action in both the structured Explorer and raw text views.
- `integrity-dashboard`: Updated `ClaimAgentModal.tsx` to support prefilling selected agent addresses from the left pane (Sovereign Fleet sidebar) and simulated an EVM transaction anchoring the agent's identity to the user via the `SovereignAgent` smart contract's `rotateController` interface.
- `integrity-dashboard`: Refactored `TokenWallet.tsx` transfer form to replace the manual address helper with an interactive select dropdown listing all registered agents alongside their unique anchored wallet addresses.
- `integrity-dashboard`: Enhanced `DiagnosticsPanel.tsx` with dynamic log search filtering, interactive real-time SHA-256 state hash calculations, a simulated manual verification sweep, and an expanded interactive **System Status Alerts** panel featuring live alarm simulation, status category badges, individual and batch acknowledgment controls, and status filtering (All, Active, Acknowledged).
- `integrity-dashboard`: Created `e2e/diagnostics_panel.spec.ts` validating all new Diagnostics tab features, and resolved strict mode element lookup and timeout errors. All Playwright E2E suites passing cleanly.

## [2026-07-06] update | Direct Base Sepolia Deployment Configuration
- `integrity-dashboard`: Set `IS_PRODUCTION = true` in `constants.ts` to disable mock routing and direct all dashboard metrics, telemetry streams, and transaction actions to the live Base Sepolia production backend.
- `docs/wiki`: Updated `integrity-dashboard.md` and indexed logs to document the lock configuration.

## [2026-07-06] update | Local Session Telemetry Routing Setup
- `integrity-dashboard`: Reverted `IS_PRODUCTION = false` in `constants.ts` to route dashboard queries to the local Docker backend on port 8080. This enables real-time visual telemetry tracking and COT trace displays for the active pair programming session, while preserving direct Base Sepolia L2 contract integrations.
- `docs/wiki`: Updated `integrity-dashboard.md` to document the local backend routing setup.

