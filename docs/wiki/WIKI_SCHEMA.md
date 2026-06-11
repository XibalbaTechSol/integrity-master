# Xibalba Integrity Project Wiki - Schema

## Domain
This wiki covers the **Xibalba Integrity Project**: the core cryptographic trust, behavioral attestation, and economic compliance layer for autonomous AI agents (such as *Xibalba Shield* and *xibalba-quant*).

## Conventions
- **Filenames:** Lowercase, hyphenated, no spaces (e.g., `behavioral-commitment-chain.md`).
- **Wikilinks:** Use `**Wikilinks**` to interlink all entities, acronyms, and concepts. Minimum 2 outbound links per page.
- **Frontmatter:** Every wiki page must begin with a valid YAML frontmatter block.
- **Index Sync:** Every newly created page must be added to `index.md` under its respective category.
- **Append Log:** Every administrative modification, ingestion, or creation must be logged chronologically in `log.md`.

## Frontmatter Template
```yaml
---
title: Page Title
acronyms: [optional list of abbreviations, e.g., BCC, AIS]
created: 2026-05-31
updated: 2026-05-31
type: entity | concept | comparison | query
tags: [from taxonomy below]
confidence: high | medium | low
---
```

## Tag Taxonomy
- `cryptography`: Zero-knowledge proofs, hashing, key-signing, C2PA.
- `identity`: Decentralized identifiers (DIDs), hardware anchoring, non-repudiation.
- `compliance`: HIPAA guidelines, open policy agent (OPA) checks, security proxies.
- `metrics`: Tri-Metric equations, entropy models, performance logs.
- `control-systems`: PID loops, Mean-Reverting / OU processes, quantitative daemons.
- `tokenomics`: Staking, Account Abstraction (ERC-4337), fee vaults, deflationary burns.
- `layer-2`: Base L2 smart accounts, on-chain registries, state-anchoring.
- `adversarial`: Red-teaming, Devil's Advocate checks, policy breaches, fraud proofs.
