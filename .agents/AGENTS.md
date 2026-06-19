# INTEGRITY Project — Wiki-as-Memory Loop

> This file implements the **LLM Wiki Memory Loop** for the Integrity Protocol monorepo.
> It is the **Schema Layer** (procedural memory) that governs how the agent reads, writes, and maintains the wiki.

---

## 1. The Three-Layer Architecture

| Layer | Location | Purpose | Mutability |
|:------|:---------|:--------|:-----------|
| **Raw Sources** | Source code, `contracts/`, `integrity-*/`, `bcc_middleware/`, config files | Ground truth. The actual codebase. | Agent writes code here normally. |
| **Compiled Wiki** | `docs/wiki/` | Synthesized, interlinked knowledge base. The agent's long-term memory. | Agent MUST update on every material code change. |
| **Schema** | This file (`AGENTS.md`) + `docs/wiki/WIKI_SCHEMA.md` | Procedural rules governing wiki maintenance. | Human-only modifications. |

---

## 2. The Write–Manage–Read Loop

Every agent session touching the INTEGRITY project MUST execute this loop:

### Phase 1: READ (Session Boot)
1. Read `docs/wiki/WIKI_SCHEMA.md` to load conventions.
2. Read `docs/wiki/WIKI_INDEX.md` to load the current knowledge map.
3. Read `docs/wiki/WIKI_LOG.md` (last 10 entries) to load recent context.
4. If working on a specific component, read its wiki page(s) for accumulated knowledge.

### Phase 2: WORK (Normal Execution)
5. Perform the requested task (code changes, debugging, research, etc.).
6. Track what changed: new files, modified APIs, renamed exports, deleted features.

### Phase 3: WRITE (Memory Commit)
7. **Update wiki pages** affected by the work:
   - If a concept/entity page exists → update it with new facts, mark stale info for removal.
   - If no page exists for a new component → create one using the frontmatter template in `WIKI_SCHEMA.md`.
8. **Update `WIKI_INDEX.md`**: Ensure every wiki page is listed. Remove entries for deleted pages.
9. **Append to `WIKI_LOG.md`**: Log the action with date, type, and summary.
10. **Update page counters**: Keep the total page count in `WIKI_INDEX.md` accurate.

### Phase 4: LINT (Maintenance Pass — on dedicated sync runs)
11. **Orphan Detection**: Find wiki pages not listed in `WIKI_INDEX.md`.
12. **Dead Link Detection**: Find index entries pointing to nonexistent pages.
13. **Staleness Audit**: Flag pages whose `updated` frontmatter is >14 days old.
14. **Confidence Decay**: Downgrade `confidence: high` → `medium` if page hasn't been verified against code in >30 days.
15. **Counter Reconciliation**: Recount actual pages and fix the index counter.

---

## 3. Wiki Page Rules

### 3.1. Frontmatter (Required)
Every wiki page MUST have this YAML frontmatter:
```yaml
---
title: Page Title
acronyms: [optional abbreviations]
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query
tags: [from WIKI_SCHEMA.md taxonomy]
confidence: high | medium | low
source_files: [list of source files this page documents]
---
```

### 3.2. Source Binding
- Every entity page MUST include a `source_files` frontmatter field linking to the actual code files it documents.
- This enables automated drift detection: if a source file changes, the wiki page is flagged for review.

### 3.3. Content Standards
- **No aspirational content**: Only document what EXISTS in the codebase. If a feature is planned but not coded, mark it explicitly as `[PLANNED]`.
- **No duplication**: Each fact lives in exactly one canonical page. Other pages link to it.
- **Minimum 2 outbound wikilinks** per page to maintain the knowledge graph.
- **Code snippets**: Include actual function signatures, struct definitions, or CLI commands — not paraphrased descriptions.

### 3.4. Confidence Scoring
| Level | Meaning |
|:------|:--------|
| `high` | Verified against source code within the last 14 days. |
| `medium` | Previously verified, but source may have changed. Review needed. |
| `low` | Imported from legacy docs or external sources. Not yet verified against current code. |

---

## 4. Naming Conventions

- **Filenames**: Lowercase, hyphenated, `.md` extension (e.g., `behavioral-commitment-chain.md`).
- **Solidity contracts**: Use the exact contract name with `.sol.md` suffix (e.g., `SovereignAgent.sol.md`).
- **Acronym aliases**: Create a short redirect page (e.g., `bcc.md` → links to `behavioral-commitment-chain.md`).
- **Directories**:
  - `concepts/` — Protocols, algorithms, cryptographic primitives.
  - `entities/` — Systems, services, contracts, infrastructure.
  - `comparisons/` — Side-by-side analyses.
  - `queries/` — Research questions and investigation notes.

---

## 5. What NOT to Put in the Wiki

- Raw meeting notes (put in `raw/` if needed)
- TODO lists (use GitHub Issues)
- Personal opinions or speculation
- Redundant copies of the master spec (link to it instead)
- Healthcare/HIPAA-specific logic (that belongs in `xibalba-shield/` docs only)

---

## 6. Sync Triggers

The wiki MUST be updated when:
- [ ] A new subproject or module is created
- [ ] A smart contract's interface changes
- [ ] An API endpoint is added, modified, or removed
- [ ] A dependency is added or removed
- [ ] A configuration schema changes
- [ ] The project's architecture or data flow changes
- [ ] A feature is deprecated or removed

---

## 7. Repository Structure (Canonical)

This is the **authoritative** list of subprojects. If reality diverges from this list, update this list AND the wiki:

| Directory | Description | Status |
|:----------|:------------|:-------|
| `integrity-oracle/` | Rust-based L0 telemetry + ZK-verification engine | Active |
| `integrity-sdk/` | Client library for agent instrumentation | Active |
| `integrity-cli/` | Admin toolkit for identity registration | Active |
| `integrity-framework/` | Vertical service layer (lending, marketplaces) | Active |
| `integrity-dashboard/` | Management UI for API keys + monitoring | Active |
| `bcc_middleware/` | OPA evaluation sidecar | Active |
| `contracts/` | Core Solidity smart contracts (Base L2) | Active |
| `xibalba-shield/` | HIPAA compliance portal | Active |
| `simulation/` | Actuarial stress-testing suite | Active |
| `quant_zerodrift/` | PDE solver + control theory engine | Active |
| `personal-site/` | Xibalba Solutions landing page | Active |
| `integrity-legacy-ui/` | Legacy UI (deprecated) | Legacy |
| `legacy_backup/` | Archived legacy code | Archive |

---

*This schema is the procedural memory of the Xibalba agent. It ensures the wiki never drifts from the codebase.*

---

## 8. Continuous Test Coverage Loop

Every agent session touching code implementation MUST engage the **Continuous Test Coverage Loop**:

### Phase 1: COVERAGE DISCOVERY
1. Run language-specific test runners (`pytest`, `cargo test`, `forge test`) to assess current coverage.
2. Identify newly added features, endpoints, or contracts lacking test coverage.

### Phase 2: PARALLEL TEST GENERATION & VERIFICATION
3. For every identified gap, define and spawn **independent background subagents** (Jules Tasks) using `define_subagent` with `enable_write_tools=true`.
4. Subagents must operate autonomously to:
   - Write deterministic, isolated unit tests.
   - Save the test files to the appropriate directories (`tests/`, `test/`, etc.).
   - Execute the test suites themselves (e.g. `pytest`, `cargo test`, `forge test`).
   - Iterate and fix their own errors without user or orchestrator intervention.

### Phase 3: CONSOLIDATION
5. The orchestrator agent simply waits for the subagents to report final success.
6. Once all subagents confirm their tests pass, the orchestrator logs the success to the wiki.
