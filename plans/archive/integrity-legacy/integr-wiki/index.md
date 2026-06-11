# <p align="center"><img src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" width="280" alt="Xibalba Solutions Logo"></p>

# Xibalba Integrity Project Wiki - Index

> Content Catalog & Registry. Every page represents a core component, protocol, or cryptographic parameter of the Integrity Project.
> Last updated: 2026-05-31 | Total pages: 35

## Acronym Glossary
- [ais](concepts/ais.md): Agent Integrity Score (Composite rating, 0-1000)
- [bcc](concepts/bcc.md): Behavioral Commitment Chain (State commitment protocol)
- [did](concepts/did.md): Decentralized Identifier (Hardware-tethered identity. Developer API Keys bypass this for testing but cap AIS at 300)
- [Mcip](concepts/mcip.md): Model Contextual Integrity Protocol (Secures fluid, agentic GenUI)
- [phi](concepts/phi.md): Protected Health Information (First vertical focus: Sensory provenance and signing)
- [vitk](concepts/vitk.md): Voting Power (Non-transferable locked ITK voting credit)
- [zkp](concepts/zkp.md): Zero-Knowledge Proof (Math engine for privacy preservation)

## Entities (Systems & Implementations)
- [Xibalba Shield](entities/xibalba-shield.md): Secure gateway for the autonomous agent economy (starting with HIPAA-compliant healthcare).
- [Xibalba Shield Proposal](entities/xibalba-shield-proposal.md): Complete base+usage business proposal and pro forma model.
- [Xibalba Quant](entities/xibalba-quant.md): Automated, isolated quantitative mean-reverting daemon.
- [Stablecoin Vault Paymaster](entities/stablecoin-vault-paymaster.md): ERC-4337 stablecoin gas-abstraction billing engine on Base L2.
- [Smart Contracts](entities/smart-contracts.md): Comprehensive Solidity core smart contracts (Registry, Anchor, Paymaster, Staking).
  - [IntegrityRegistry.sol (Source)](entities/integrity-registry-sol.md): Smart contract governing agent identities and compliance stake.
  - [StateAnchor.sol (Source)](entities/state-anchor-sol.md): Merkle root anchoring registry contract for PostgreSQL Trust Vault.
  - [AgentMarket.sol (Source)](entities/agent-market-sol.md): AI-Oracle-backed prediction market contract resolving on agent consensus.
- [Integrity Registry](entities/integrity-registry.md): On-chain staking, onboarding, and economic slashing contract.
- [State Anchor](entities/state-anchor.md): On-chain Merkle root state anchoring contract.
- [Rust Oracle](entities/rust-oracle.md): High-performance off-chain Axum verification and telemetry server.
- [Itk Token](entities/itk-token.md): Native utility token ($ITK) for collateral staking and deflationary burns.

## Concepts (Protocols & Cryptography)
- [Behavioral Commitment Chain](concepts/behavioral-commitment-chain.md): Pre-execution state-declaration and lock-in.
- [BCC SDK Technical Specification](concepts/integrity-protocol-sdk-spec.md): Complete data models, schemas, and verification code signatures.
- [Developing on the Integrity Protocol (10 MVPs)](concepts/developing-on-integrity-protocol.md): Core developer blueprints, verification cycles, and 10 state-of-the-art MVP ideas.
- [Model Contextual Integrity Protocol](concepts/model-contextual-integrity-protocol.md): Fluid interface guardrails and context protection.
- [Generative UI Security & AG-UI/A2UI](concepts/generative-ui-security.md): Event-streaming, JSON Patches, and clickjacking safeguards.
- [Aztec Noir Circuits](concepts/aztec-noir-circuits.md): Zero-leak mathematical proving circuits (PAEs).
- [Tri Metric Protocol](concepts/tri-metric-protocol.md): Evaluation triad (Entropy, Grounding, Sacrifice).
- [Hardware Fingerprinting](concepts/hardware-fingerprinting.md): Real-world physical identity anchoring (Developer API Keys bypass for testing, capping AIS at 300).
- [Identity Ceiling](concepts/identity-ceiling.md): Hierarchical accountability and verification ladder.
- [Integrity Protocol Strategy](concepts/integrity-protocol-strategy.md): Architectural roadmap, RF constraints, and tokenomics.
- [First Vertical Security Architecture](concepts/phi-provenance-devil-advocate-plan.md): Devil's Advocate audit, key rotation, and ingestion security for PHI.
- [Ai Proxy Base L2](concepts/ai-proxy-base-l2.md): AI-delegated DAO governance and Guardian Agents ($vITK) on Base L2.
- [Business Plan](concepts/business-plan.md): Platform monetization, base+usage models, pro forma financials.
- [Integration Guide](concepts/integration-guide.md): Developer SDK installation, trust handshakes, and framework wrappers.
- [Metadata Catalog](concepts/metadata-catalog.md): Standardized telemetry parameters, OPA schemas, and signed SVG badges.
- [Adoption Strategy](concepts/adoption-strategy.md): The "Insured Agent" insurance flywheel and HSCC risk guides.
