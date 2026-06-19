# Xibalba Integrity Project Wiki - Index

> Content Catalog & Registry. Every page represents a core component, protocol, or cryptographic parameter of the Integrity Project.
> Last updated: 2026-06-19 | Total pages: 72

## Acronym Glossary
- [ais](concepts/ais.md): Agent Integrity Score (Composite rating, 0-1000)
- [bcc](concepts/bcc.md): Behavioral Commitment Chain (State commitment protocol)
- [did](concepts/did.md): Decentralized Identifier (W3C-compliant hardware-tethered identity)
- [Mcip](concepts/mcip.md): Model Contextual Integrity Protocol (Secures fluid, agentic GenUI)
- [phi](concepts/phi.md): Protected Health Information (Sensory provenance and signing)
- [vitk](concepts/vitk.md): Voting Power (Non-transferable locked ITK voting credit)
- [zkp](concepts/zkp.md): Zero-Knowledge Proof (Math engine for privacy preservation)

## Entities (Systems & Implementations)
- [Integrity Oracle](entities/integrity-oracle.md): The foundational backend service (Node 5).
- [Integrity SDK](entities/integrity-sdk.md): The primary integration bridge (Node 4).
- [Integrity CLI](entities/integrity-cli.md): Terminal-based orchestration.
- [Integrity Dashboard](entities/integrity-dashboard.md): The institutional command center.
- [Integrity Framework](entities/integrity-framework.md): Deprecated agent framework.
- [BCC Middleware](entities/bcc_middleware.md): Security gatekeeper (Node 3).
- [Actuarial Simulations](entities/simulation.md): Actuarial scripts to model and stress-test.
- [Quant ZeroDrift](entities/quant_zerodrift.md): High-performance C++ solver.
- [Personal Site](entities/personal-site.md): Landing page.
- [Xibalba Shield](entities/xibalba-shield.md): Secure, HIPAA-compliant security gateway and CaaS.
- [Xibalba Shield Proposal](entities/xibalba-shield-proposal.md): Complete base+usage business proposal and pro forma model.
- [Xibalba Quant](entities/xibalba-quant.md): Automated, isolated quantitative mean-reverting daemon.
- [Stablecoin Vault Paymaster](entities/stablecoin-vault-paymaster.md): ERC-4337 stablecoin gas-abstraction billing engine.
- [Smart Contracts](entities/smart-contracts.md): Comprehensive Solidity core smart contracts (Registry, Anchor, Paymaster, Staking).
  - [AgentMarketplace.sol (Source)](entities/AgentMarketplace.sol.md): AI-Oracle-backed prediction market contract resolving on agent consensus.
  - [AuditShield.sol (Source)](entities/AuditShield.sol.md): HIPAA-compliance oracle module.
  - [ReputationRegistry.sol (Source)](entities/ReputationRegistry.sol.md): Smart contract governing agent identities and compliance stake.
  - [ReputationSBT.sol (Source)](entities/ReputationSBT.sol.md): Soul-bound tokens for agent reputation.
  - [SovereignAgent.sol (Source)](entities/SovereignAgent.sol.md): Core on-chain representation of an AI agent.
  - [StakingReputation.sol (Source)](entities/StakingReputation.sol.md): Reputation-weighted collateral staking.
  - [StateAnchor.sol (Source)](entities/StateAnchor.sol.md): Merkle root anchoring registry contract for PostgreSQL Trust Vault.
  - [AgentCreditFacility.sol (Source)](entities/AgentCreditFacility.sol.md): Auto-generated.
  - [AgentFactory.sol (Source)](entities/AgentFactory.sol.md): Auto-generated.
  - [CCIPReputationBridge.sol (Source)](entities/CCIPReputationBridge.sol.md): Auto-generated.
  - [ClaimsAdjudicator.sol (Source)](entities/ClaimsAdjudicator.sol.md): Auto-generated.
  - [ClinicalTrialBond.sol (Source)](entities/ClinicalTrialBond.sol.md): Auto-generated.
  - [CoveredEntityRegistry.sol (Source)](entities/CoveredEntityRegistry.sol.md): Auto-generated.
  - [DomainRegistry.sol (Source)](entities/DomainRegistry.sol.md): Auto-generated.
  - [EnterpriseRegistry.sol (Source)](entities/EnterpriseRegistry.sol.md): Auto-generated.
  - [IAccount.sol (Source)](entities/IAccount.sol.md): Auto-generated.
  - [IntegrityPaymaster.sol (Source)](entities/IntegrityPaymaster.sol.md): Auto-generated.
  - [IntegrityProtocol.sol (Source)](entities/IntegrityProtocol.sol.md): Auto-generated.
  - [IntegrityToken.sol (Source)](entities/IntegrityToken.sol.md): Auto-generated.
  - [MedicalCreditLine.sol (Source)](entities/MedicalCreditLine.sol.md): Auto-generated.
  - [MockITK.sol (Source)](entities/MockITK.sol.md): Auto-generated.
  - [MockPaymaster.sol (Source)](entities/MockPaymaster.sol.md): Auto-generated.
  - [OracleRegistry.sol (Source)](entities/OracleRegistry.sol.md): Auto-generated.
  - [ReputationLendingPool.sol (Source)](entities/ReputationLendingPool.sol.md): Auto-generated.
  - [Slasher.sol (Source)](entities/Slasher.sol.md): Auto-generated.
  - [SmartBAA.sol (Source)](entities/SmartBAA.sol.md): Auto-generated.
  - [SmartBAAFactory.sol (Source)](entities/SmartBAAFactory.sol.md): Auto-generated.
  - [StablecoinPaymaster.sol (Source)](entities/StablecoinPaymaster.sol.md): Auto-generated.
  - [UltraPlonkVerifier.sol (Source)](entities/UltraPlonkVerifier.sol.md): Auto-generated.
  - [XibalbaAgentRegistry.sol (Source)](entities/XibalbaAgentRegistry.sol.md): Auto-generated.
  - [XibalbaNameService.sol (Source)](entities/XibalbaNameService.sol.md): Auto-generated.
- [Integrity Registry](entities/integrity-registry.md): On-chain staking, onboarding, and economic slashing contract.
- [State Anchor](entities/state-anchor.md): On-chain Merkle root state anchoring contract.
- [Rust Oracle](entities/rust-oracle.md): **Architecturally Isolated Layer 0.** High-performance off-chain Axum verification and telemetry server, dedicated strictly to domain-agnostic protocol enforcement.
- [Itk Token](entities/itk-token.md): Native utility token ($ITK) for collateral staking and deflationary burns.
## Architecture
- [BCC Ingestion & Evaluation Pipeline](architecture/bcc_ingestion_eval.md): Comprehensive architectural documentation of the middleware's intent ingestion and OPA-driven trajectory evaluation.

## Concepts (Protocols & Cryptography)
- [Behavioral Commitment Chain](concepts/behavioral-commitment-chain.md): Pre-execution state-declaration and lock-in.
- [BCC SDK Technical Specification](concepts/integrity-protocol-sdk-spec.md): Complete data models, schemas, and verification code signatures.
- [Developing on the Integrity Protocol (10 MVPs)](concepts/developing-on-integrity-protocol.md): Core developer blueprints, verification cycles, and 10 state-of-the-art MVP ideas.
- [Model Contextual Integrity Protocol](concepts/model-contextual-integrity-protocol.md): Fluid interface guardrails and context protection.
- [Generative UI Security & AG-UI/A2UI](concepts/generative-ui-security.md): Event-streaming, JSON Patches, and clickjacking safeguards.
- [Aztec Noir Circuits](concepts/aztec-noir-circuits.md): Zero-leak mathematical proving circuits (PAEs).
- [Tri Metric Protocol](concepts/tri-metric-protocol.md): Evaluation triad (Entropy, Grounding, Sacrifice).
- [Hardware Fingerprinting](concepts/hardware-fingerprinting.md): Real-world physical identity anchoring.
- [Identity Ceiling](concepts/identity-ceiling.md): Hierarchical accountability and verification ladder.
- [Integrity Protocol Strategy](concepts/integrity-protocol-strategy.md): Architectural roadmap, RF constraints, and tokenomics.
- [PHI Provenance Secure Architecture](concepts/phi-provenance-devil-advocate-plan.md): Devil's Advocate audit, key rotation, and ingestion security.
- [Ai Proxy Optimism](concepts/ai-proxy-optimism.md): AI-delegated DAO governance and Guardian Agents ($vITK).
- [Business Plan](concepts/business-plan.md): Platform monetization, base+usage models, pro forma financials.
- [Integration Guide](concepts/integration-guide.md): Developer SDK installation, trust handshakes, and framework wrappers.
- [Metadata Catalog](concepts/metadata-catalog.md): Standardized telemetry parameters, OPA schemas, and signed SVG badges.
- [Adoption Strategy](concepts/adoption-strategy.md): The "Insured Agent" insurance flywheel and HSCC risk guides.
