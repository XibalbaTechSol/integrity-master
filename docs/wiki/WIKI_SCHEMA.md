# Xibalba Integrity Project Wiki - Schema (v2.0)

## Domain
This wiki is the **compiled knowledge base** (long-term memory) for the Xibalba Integrity Protocol monorepo. It covers the core cryptographic trust, behavioral attestation, economic compliance, and autonomous agent sovereignty layers.

## The Three-Layer Memory Model
| Layer | Location | Purpose |
|:------|:---------|:--------|
| **Raw Sources** | Source code, configs, READMEs within subprojects | Immutable ground truth |
| **Compiled Wiki** | This directory (`docs/wiki/`) | Synthesized, interlinked knowledge the agent reads/writes |
| **Schema** | This file + `.agents/AGENTS.md` | Procedural rules (how to maintain the wiki) |

## Conventions
- **Filenames:** Lowercase, hyphenated, no spaces (e.g., `behavioral-commitment-chain.md`).
- **Solidity Contracts:** Use exact contract name with `.sol.md` suffix (e.g., `SovereignAgent.sol.md`).
- **Wikilinks:** Use `**Wikilinks**` to interlink all entities, acronyms, and concepts. Minimum 2 outbound links per page.
- **Frontmatter:** Every wiki page must begin with a valid YAML frontmatter block (see template below).
- **Index Sync:** Every newly created page must be added to `WIKI_INDEX.md` under its respective category.
- **Append Log:** Every modification, ingestion, or creation must be logged in `WIKI_LOG.md`.
- **No Aspirational Content:** Only document what EXISTS in the codebase. Planned features must be marked `[PLANNED]`.
- **No Duplication:** Each fact lives in one canonical page. Other pages link to it.
- **Code Over Prose:** Include actual function signatures, struct definitions, or CLI commands — not paraphrased descriptions.

## Frontmatter Template
```yaml
---
title: Page Title
acronyms: [optional list of abbreviations, e.g., BCC, AIS]
created: YYYY-MM-DD
updated: 2026-06-19
type: entity | concept | comparison | query
tags: [from taxonomy below]
confidence: high | medium | low
source_files:
  - relative/path/to/source/file.rs
  - relative/path/to/another/file.sol
---
```

### Confidence Scoring
| Level | Meaning |
|:------|:--------|
| `high` | Verified against source code within the last 14 days |
| `medium` | Previously verified, source may have changed. Review needed. |
| `low` | Imported from legacy docs or external sources. Not yet verified. |

## Tag Taxonomy
- `cryptography`: Zero-knowledge proofs, hashing, key-signing, C2PA.
- `identity`: Decentralized identifiers (DIDs), hardware anchoring, non-repudiation.
- `compliance`: HIPAA guidelines, Open Policy Agent (OPA) checks, security proxies.
- `metrics`: Tri-Metric equations, entropy models, performance logs.
- `control-systems`: PID loops, Mean-Reverting / OU processes, quantitative daemons.
- `tokenomics`: Staking, Account Abstraction (ERC-4337), fee vaults, deflationary burns.
- `layer-2`: Base L2 smart accounts, on-chain registries, state-anchoring.
- `adversarial`: Red-teaming, Devil's Advocate checks, policy breaches, fraud proofs.
- `sdk`: Client libraries, integrations, MCP server, framework interceptors.
- `infrastructure`: Oracle, middleware, deployment, CI/CD, Docker.
- `governance`: DAO, voting, protocol upgrades, tiered oversight.
- `simulation`: Stress-testing, actuarial modeling, autoresearch.

## Directory Structure
- `concepts/` — Protocols, algorithms, cryptographic primitives, strategies.
- `entities/` — Systems, services, contracts, infrastructure components.
- `comparisons/` — Side-by-side analyses (e.g., Foundry vs Hardhat).
- `queries/` — Research questions and investigation notes.

## Source Binding Rule
Every entity page MUST include a `source_files` frontmatter field listing the actual code files it documents. This enables drift detection: if a source file changes but the wiki page's `updated` date is older, the page is flagged stale.
