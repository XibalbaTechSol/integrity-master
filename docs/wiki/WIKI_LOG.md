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
## [2026-06-25] update | contract_monitor.py: Optimize scan_all to avoid N+1 DB queries
- Pre-fetched agents in `scan_all` to build an `agent_map`.
- Updated `check_sla_breach` signature to accept `agent: Agent = None`.
- Used `agent_map` inside `scan_all` loop to pass `Agent` object directly to `check_sla_breach`.
* New values: `w_trustflow = 0.36666666666666664`, `w_xibalba = 0.36666666666666664`, `w_sacrifice = 0.26666666666666666`.
## [2024-06-25] update | Testing Telemetry Analyzer
- Added 7 unit test functions to `integrity-sdk/tests/unit/test_telemetry.py` to cover calculation methods in `CompositeSignalAnalyzer`.
