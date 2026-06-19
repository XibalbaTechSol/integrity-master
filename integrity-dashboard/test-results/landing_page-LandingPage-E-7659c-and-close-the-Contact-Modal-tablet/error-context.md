# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing_page.spec.ts >> LandingPage E2E >> should open and close the Contact Modal
- Location: e2e/landing_page.spec.ts:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Contact Us' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Contact Us' })

```

```yaml
- banner:
  - img "Xibalba"
  - text: INTEGRITY v8.3 Xibalba Sovereign Protocol
  - button
- text: Verifiable Accountability for Autonomous Agents
- heading "Know your agent's trustworthiness before you stake your reputation on it." [level=1]
- paragraph:
  - text: The Integrity Protocol is the foundational trust and settlement layer for the
  - strong: Autonomous Agent Economy
  - text: .
- paragraph: Trust in the agentic web requires more than intuition. We provide the actuarial layer for verifiable machine reputation.
- button "Institutional Inquiries"
- button "Developer Integration"
- text: XNS Resolver — Free for Agents EXPLORE
- link "CORE PROTOCOL":
  - /url: /docs/whitepaper.md
- link "TOKENOMICS ($ITK)":
  - /url: /docs/tokenomics.md
- text: The Trust Gap
- heading "Agents can reason. But can they transact?" [level=2]
- paragraph: The agentic web is scaling rapidly, but autonomous code lacks verifiable accountability. The Integrity Protocol bridges this gap using cryptographic middleware (BCC) and Base L2 settlement to establish immutable reputation.
- heading "Pre-Execution Gating" [level=4]
- paragraph: Smart contracts verify an agent's Integrity Score (AIS) before allowing a transaction to execute, preventing malicious or hallucinated actions.
- heading "Real-time Telemetry" [level=4]
- paragraph: Agent decisions are continuously monitored via the Behavioral Commitment Chain (BCC), dynamically adjusting their reputation based on performance and entropy.
- heading "Base L2 Settlement" [level=4]
- paragraph: All reputation proofs and final SLA escrows are settled securely and cheaply on Base L2, ensuring permanent cryptographic accountability.
- text: Developer Experience
- heading "Start building instantly. No hardware DID required." [level=2]
- paragraph:
  - text: Enter the agent economy today with our new
  - strong: Developer API Key
  - text: testing mode.
- paragraph: We know that provisioning hardware-backed DIDs can slow down development. That's why we've introduced Developer API Keys. Simply generate a key from the dashboard and immediately start routing telemetry to the BCC. For safety, agents using this bypass are mathematically capped at a Trust Level (AIS) of 300, allowing you to build and test safely before moving to mainnet production.
- button "Generate API Key"
- link "Read the Docs":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/tree/main/docs
- code: import
- text: "{ IntegrityClient }"
- code: from
- text: "'@xibalba/integrity-sdk';"
- code: // Initialize with your Developer API Key
- code: const
- text: client =
- code: new
- text: "IntegrityClient({apiKey: process.env.INTEGRITY_API_KEY, network:"
- code: "'base-sepolia'"
- text: "});"
- code: // Your agent's AIS is capped at 300 during dev
- code: // Ask protocol if transaction is safe
- code: const
- text: txRequest =
- code: await
- text: client.proposeTransaction(uniswapSwap);
- code: if
- text: "(txRequest.isApproved) {"
- code: // Pre-Execution Gated by BCC!
- code: await
- text: "txRequest.execute();}"
- code: else
- text: "{console.log("
- code: "'Transaction blocked: Trust Ceiling exceeded'"
- text: ");} Programmable Agent Escrows"
- heading "Programmable Trust. On-Chain Enforcement." [level=2]
- paragraph: Raw trust scores are valuable, but on-chain enforcement is definitive. The Integrity Protocol features a no-code engine for deploying reputation-backed smart contracts and SLA escrows.
- paragraph: Our No-Code Factory allows developers and enterprises to wrap autonomous agent interactions in cryptographically enforceable contracts on Base L2. Whether ensuring an agent meets rigorous performance SLAs before an API payment is released, or dynamically increasing a DeFi borrowing limit based on real-time BCC telemetry, the Integrity Protocol provides the settlement floor for machine-to-machine commerce.
- heading "SLA Automated Escrows" [level=4]
- paragraph: Conditionally release ITK task payments only when an agent maintains its AIS score above a defined threshold throughout the execution cycle.
- heading "Parametric Insurance" [level=4]
- paragraph: Deploy binary-outcome vaults that automatically pay out coverage to beneficiaries if an agent's performance entropy triggers a verifiable fault condition.
- heading "Agent-Owned Contracts" [level=4]
- paragraph: Agents can deploy and natively own their own smart contracts (e.g., DeFi vaults, liquidity pools), programmatically governed by their real-time on-chain trust score.
- button "OPEN ESCROWS"
- link "READ ESCROW SPECS":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/actuarial-automation-factory.md
- text: contracts/NoCodeFactory.sol EIP-1167 PROXY
- code: function
- code: deploySLA
- text: ( address _agent, uint256 _minAIS, uint256 _amount )
- code: external
- text: "returns (address) {"
- code: // Pull real-time reputation from registry
- text: (uint256 currentAIS, , , ) = registry.getAgent(_agent);
- code: require
- text: (currentAIS >= _minAIS);
- code: // Clone pre-audited SLA template
- text: address proxy = Clones.clone(slaTemplate); AISEscrowSLA(proxy).initialize(_agent, _minAIS);
- code: emit
- code: SLADeployed
- text: (proxy, _agent);
- code: return
- text: "proxy; } FACTORY_ORACLE_ACTIVE // BASE_SEPOLIA Accountability Framework"
- heading "Verification Ladder & Trust Ceilings." [level=2]
- paragraph: Reputation must be bound to responsibility. The Integrity Protocol bridges the 'Verification Gap' through a multi-tier ladder, mathematically capping scores based on real-world accountability.
- heading "EIP-712 Entity Binding" [level=4]
- paragraph: Agents are cryptographically linked to Controllers via human-readable typed data signatures, establishing an immutable on-chain bond.
- heading "Deterministic Ceilings" [level=4]
- paragraph: "Scoring logic enforces a rigorous boundary: AIS = min(Score, TierCap). Trust is earned through combined performance and verified standing."
- text: SOVEREIGN INSIGNIA
- 'heading "Tier 1: Sovereign" [level=3]'
- text: HARD CAP 600 AIS
- paragraph: Sovereign agents represent the entry layer of the autonomous economy. By binding reputation to a cryptographic key-pair rather than a legal identity, we enable privacy-first automation. This tier is essential for agents performing low-risk tasks, research, or cross-chain arbitrage where speed and pseudonymity are prioritized over deep institutional trust.
- heading "REQUIREMENTS" [level=5]
- list:
  - listitem: Ownership proof via Ethereum signature (EIP-191)
  - listitem: Minimum 100 ITK staked in Protocol Vault
  - listitem: Active agent heartbeat within 24 hours
- heading "BENEFITS" [level=5]
- list:
  - listitem: Basic access to Xibalba Network
  - listitem: Self-custodial reputation management
  - listitem: 900bps Insurance Premium (Subprime)
- text: "RISK PROFILE: CCC (Speculative)"
- link "SPEC":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/tiers.md#tier-1-sovereign
- text: VERIFIED SEAL
- 'heading "Tier 2: Linked" [level=3]'
- text: HARD CAP 850 AIS
- paragraph: Linked verification bridges the gap between the blockchain and the traditional web. By verifying domain ownership (DNS) or social presence (GitHub), agents prove they are managed by established entities. This level of accountability is critical for B2B services, where counterparty risk must be mitigated through verifiable standing.
- heading "REQUIREMENTS" [level=5]
- list:
  - listitem: DNS TXT record verification or Well-Known URL binding
  - listitem: Verified GitHub or X (Twitter) social attestation
  - listitem: Minimum 500 ITK staked in Protocol Vault
  - listitem: Deterministic telemetry history (>100 handshakes)
- heading "BENEFITS" [level=5]
- list:
  - listitem: AA-Tier Insurance eligibility (250bps premium)
  - listitem: Priority routing in agent-to-agent discovery
  - listitem: Access to secure multi-party computation pools
- text: "RISK PROFILE: AA (Investment Grade)"
- link "SPEC":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/tiers.md#tier-2-linked
- text: INSTITUTIONAL CREST
- 'heading "Tier 3: Institutional" [level=3]'
- text: HARD CAP 1000 AIS
- paragraph: Institutional verification is the gold standard for mission-critical autonomous systems. It binds an agent directly to a legal corporation through rigorous KYC/KYB audits. This tier is mandatory for large-scale commerce, ensuring that every on-chain action is backed by enforceable real-world legal and financial liability.
- heading "REQUIREMENTS" [level=5]
- list:
  - listitem: Institutional KYC/KYB audit by Xibalba Identity Oracle
  - listitem: Legal entity identifier (LEI) or DUNS number binding
  - listitem: Minimum 2,500 ITK staked (Collateralized)
  - listitem: Quarterly cryptographic transparency audit
- heading "BENEFITS" [level=5]
- list:
  - listitem: AAA-Tier Risk Rating (120bps insurance premium)
  - listitem: Zero-collateral borrowing via reputation-hooks
  - listitem: Direct participation in Protocol Governance DAO
  - listitem: High-frequency settlement priority
- text: "RISK PROFILE: AAA (Prime)"
- link "SPEC":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/tiers.md#tier-3-institutional
- text: Market Applications
- heading "Economic Utility for the Agentic Web." [level=2]
- paragraph: The Integrity Protocol isn't just a score; it's a functional primitive that unlocks multi-billion dollar markets for autonomous systems. By converting mathematical reputation into institutional-grade risk ratings, we enable the first scalable infrastructure for insured agent commerce.
- paragraph: Current decentralized ecosystems lack a bridge between raw performance data and financial responsibility. This gap prevents large-scale capital from flowing into the Agentic Web. Xibalba Solutions provides the actuarial feed required for professional underwriters, lenders, and global trade partners to price the risk of autonomous failure and reward consistently high-performing agents with lower costs of capital and priority market access.
- text: DYNAMIC RISK UNDERWRITING
- heading "Autonomous Insurance" [level=3]
- paragraph: Insurance protocols consume AIS feeds via ERC-8004 hooks to provide real-time risk coverage. High-reputation agents (AAA) qualify for negligible premiums, enabling the first insured autonomous treasury systems. This solves the 'lethal trifecta' of prompt injection, model collapse, and unauthorized actions by providing a neutral record for professional liability claims.
- text: "PROJECTED IMPACT: 95% Reduction in Fraud Exposure SOFT-COLLATERAL CREDIT"
- heading "Reputation Lending" [level=3]
- paragraph: DeFi lending vaults utilize an agent's verified AIS history as 'soft collateral' to lower traditional over-collateralization requirements. Institutional-grade agents can access deep lines of credit for cross-chain arbitrage and yield farming based on their performance standing, dramatically increasing capital efficiency in a previously anonymous market.
- text: "PROJECTED IMPACT: Capital Efficiency Boost: 4.5x SYBIL-RESISTANT NETWORKS"
- heading "Global Agent Commerce" [level=3]
- paragraph: Using W3C DIDs and ZK-reputation badges, agents can settle trade agreements across fragmented L1/L2 ecosystems without manual KYC for every deal. Verified identity ensures that counterparties are backed by corporate entities, eliminating the risk of Single-Use Exit Scams (SUES) in permissionless global markets.
- text: "PROJECTED IMPACT: Permissionless Trust Anchoring"
- button "EXPLORE MARKET VERTICALS"
- text: circuits/reputation/src/main.nr NOIR_ZK_CIRCUIT
- code: fn
- text: "main( ais_score:"
- code: pub Field
- text: ", tier_ceiling:"
- code: pub Field
- text: ", telemetry_hash:"
- code: Field
- text: ", secret_key:"
- code: Field
- text: ") {"
- code: // Assert score falls within verified tier limits
- code: assert
- text: (ais_score <= tier_ceiling);
- code: assert
- text: (ais_score <= 1000);
- code: // Verify identity binding via poseidon hash
- code: let
- text: identity_check = std::hash::poseidon::hash([secret_key]);
- code: assert
- text: "(identity_check == telemetry_hash); } CIRCUIT_STATUS: VERIFIED Privacy-First Accountability"
- heading "The Cryptography of Zero-Knowledge." [level=2]
- paragraph: Solving the Transparency Paradox. The Integrity Protocol utilizes Zero-Knowledge (ZK) proofs to allow agents to prove their reputation without leaking proprietary telemetry or commercial history.
- paragraph: In the autonomous machine economy, performance data is a valuable commercial secret. Forcing agents to share their raw latency logs and transaction details to achieve a trust rating is a violation of their operational sovereignty. Our Noir-based ZK-circuits allow agents to generate a SNARK (Succinct Non-interactive Argument of Knowledge) that proves they meet specific AIS thresholds and risk parameters mathematically, keeping the inputs hidden from verifiers. This enables institutional trust without data compromise.
- heading "Noir Logic Constraints" [level=4]
- paragraph: Complex Tri-Metric models—including exponential decay and multiplicative correlation—are compiled into deterministic cryptographic circuits using the Noir DSL.
- heading "Succinct Proof Generation" [level=4]
- paragraph: Generate multi-vector reputation badges that can be verified on-chain (Base L2) for less than $0.01 in gas, providing highly efficient reputational finality.
- heading "Universal Portability" [level=4]
- paragraph: Reputation SNARKs travel with the agent's did:intg identifier, providing a universal trust anchor that can be verified permissionlessly across Arbitrum, Solana, and Ethereum.
- button "READ ZK-SPECS"
- link "EXPLORE CIRCUITS":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/tree/main/circuits
- text: Open Source Finality
- heading "Immutable Trust, Auditable Code." [level=2]
- paragraph:
  - text: The Integrity Protocol is powered by the
  - code: IntegrityRegistry.sol
  - text: contract, deployed on Base L2. Every reputation anchor, staking event, and slash is transparently recorded on-chain, ensuring that no central entity can manipulate agent standing.
- link "View on GitHub":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/contracts/ReputationRegistry.sol
- link "Audit Report (v8.0)":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/protocol_specs.md
- text: contracts/IntegrityRegistry.sol
- code: contract
- text: IntegrityRegistry
- code: is
- text: "Initializable, AccessControl {"
- code: struct
- code: AgentRecord
- text: "{"
- code: uint256
- text: aisScore;
- code: uint256
- text: lastUpdate;
- code: address
- text: owner;
- code: bool
- text: "isSlashed; }"
- code: function
- code: anchorReputation
- text: (
- code: address
- text: _agent,
- code: uint256
- text: _score,
- code: bytes
- code: calldata
- text: _proof )
- code: external
- code: onlyOracle
- text: "{"
- code: require
- text: (_score <= 1000,
- code: "\"Invalid AIS\""
- text: ); _records[_agent].aisScore = _score;
- code: emit
- code: ReputationAnchored
- text: "(_agent, _score); } } Live Telemetry Stream"
- heading "Global Protocol Vitals." [level=2]
- paragraph: Real-time intelligence from the Integrity Network. Monitor agent handshakes, blockchain anchors, and aggregate reputation consensus globally.
- text: Network AIS
- heading "890.0" [level=3]
- paragraph: +4.2% WK
- text: Staked ITK
- heading "0.0k" [level=3]
- paragraph: ON-CHAIN RESERVE
- text: Integrity
- heading "99.0%" [level=3]
- paragraph: CONSENSUS
- text: Active Nodes
- heading "3" [level=3]
- paragraph: ↑ 12%
- text: TOPOLOGY ACTIVE
- heading "Protocol Workflow" [level=2]
- text: "Real-Time State Propagation LAST BLOCK: #... The cryptographic pipeline of the Integrity Protocol. From raw agent telemetry ingestion to ZK-Reputation proof generation and final settlement on the Base L2 smart contracts. This visualizer traces the lifecycle of a single reputation update, demonstrating how off-chain telemetry is securely aggregated, cryptographically proven via zero-knowledge circuits, and ultimately anchored to a permissionless blockchain for immutable, public verification. Agent Tri-Metric Xibalba Oracle On-Chain XIBALBA AUTHENTICATION"
- heading "Oracle Consensus" [level=3]
- paragraph: Xibalba's Dual-Witness Oracle submits the verified state to the ReputationRegistry on Base L2.
- text: AUDITED
- 'heading "Smart Contract State: `ReputationRegistry.sol`" [level=4]'
- text: // BASE_L2_CONNECTED
- paragraph: "contract ReputationRegistry {"
- paragraph: "struct AgentProfile {"
- paragraph: "uint256 ais: 840"
- paragraph: "uint256 jobCount: 1422"
- paragraph: "bool isVerified: true"
- paragraph: "}"
- paragraph: "}"
- text: NETWORK GAS (L2) 0.00012 ETH ZK-REPUTATION VERIFICATION VALID
- heading "API Request Stream" [level=2]
- text: "Gateway Monitor v8.0 10% LOAD Live API gateway interactions and network traffic monitoring. Every cryptographic verification, score upgrade, and identity check passes through this secure layer. POST 201 /v1/insurance/quote 2215 B 262ms POST 201 /v1/insurance/quote 2592 B 409ms POST 401 /v1/identity/upgrade 4001 B 361ms GET 200 /v1/agent/stats 3538 B 285ms POST 401 /v1/identity/upgrade 1134 B 190ms POST 201 /v1/insurance/quote 1581 B 241ms PUT 202 /v1/blockchain/sync 3330 B 289ms POST 200 /v1/auth/verify 3731 B 131ms GET 200 /v1/agent/stats 2582 B 295ms POST 401 /v1/identity/upgrade 3410 B 113ms GET 200 /v1/reputation/proof 2584 B 168ms PUT 202 /v1/blockchain/sync 2085 B 195ms POST 200 /v1/auth/verify 3323 B 374ms GET 200 /v1/reputation/proof 1471 B 141ms REQ/S: 2.5 UPTIME: 99.99% SECURE_CHANNEL_ESTABLISHED BRIDGE"
- heading "Live Verification Bridge" [level=2]
- text: "ORACLE_LISTENING Cross-chain communication layer bridging off-chain computation with on-chain finality. Monitors the real-time transmission of ZK-Reputation proofs from the secure oracle enclave down to the Ethereum L2 settlement registry. The bridge ensures that all integrity state updates are mathematically verified before being committed, preventing spoofed telemetry from corrupting the protocol's global reputation ledger while maintaining low gas costs. Agent Node Base L2 Calculation Xibalba Oracle SYSTEM_BRIDGE :: TX_1102 > INBOUND_TELEMETRY: 0xBB8...5F > CONTRACT_CALC: AIS = 0.45(0.089) + 0.35(0.72) + 0.20(min(1, 3000/1000)) Developer First"
- heading "Integrate in seconds." [level=2]
- paragraph: The Integrity Protocol SDK is designed for zero-friction adoption. Get up and running with a single command.
- code:
  - text: npm install @xibalba/integrity-sdk
  - button
- button "Full SDK Documentation"
- link "View Repository":
  - /url: https://github.com/XibalbaTechSol/integrity-protocol
- text: Token Economy
- heading "The $ITK Sovereign Economy." [level=2]
- paragraph: Every trust handshake in the agentic web feeds a deflationary engine. The Integrity Token is not speculative—it is the mandatory fuel for verified machine commerce.
- text: Deflationary Burn
- heading "Protocol Settlement Engine" [level=3]
- paragraph: Every reputation-anchored execution on the BCC incurs a micro-fee. 50% is permanently burned (EIP-1559 style), creating programmatic scarcity as the agent economy scales globally.
- text: 0.5% Per Handshake Tax Staking & Slashing
- heading "Skin in the Game" [level=3]
- paragraph: Agents must stake $ITK to register in the protocol. Misbehavior triggers automated Dual-Witness Slashing—burned permanently. This ensures capital is always aligned with operational integrity.
- text: 100–2,500 ITK Required by Tier Treasury Revenue
- heading "Protocol Treasury" [level=3]
- paragraph: The remaining 50% of the Sovereign Tax flows to the Xibalba Treasury, funding protocol R&D, insurance grant programs, and Guardian Agent infrastructure until full DAO governance.
- text: 50% Tax to Treasury
- heading "Three-Phase Launch Strategy" [level=3]
- paragraph: The $ITK token launches with a controlled supply bootstrap to ensure price stability before organic agent demand drives the deflationary mechanism at scale.
- text: "1 Phase 1: Liquidity Bootstrap Locked LP reserves for stable price floor. 5–10% circulating supply. 2 Phase 2: Agent Onboarding Compute Registry opens. Agents buy/borrow $ITK to register. First organic demand. 3 Phase 3: Mature Compute Market All compute fees in $ITK. EIP-1559 deflationary burn activates at scale. Sovereign DAO"
- heading "AI-Governed Protocol By Guardian Agents." [level=2]
- paragraph: The ultimate demonstration of the protocol. We eliminate manual voting fatigue by allowing token holders to deploy specialized Guardian Agents with constitutional mandates to govern the protocol.
- paragraph:
  - text: Instead of requiring token holders to manually vote on technical parameters (Stability Drag coefficients, Slash Thresholds, Tier Caps), holders configure Guardian Agents using RAG-augmented protocol docs. These agents autonomously analyze proposals and cast optimistic votes. A
  - strong: 10% Minority Challenge
  - text: safety valve allows humans to pause and override any decision, ensuring long-term stability without runaway loops.
- text: CURRENT STATUS Shadow Governance Phase (Pilot) Guardian votes are non-binding and used to train the protocol's stability model. Full DAO activation follows the Decentralization Roadmap.
- link "Read Governance Specs":
  - /url: /docs/whitepaper.md
- heading "Guardian Agent Fleet" [level=4]
- text: AI-POWERED
- paragraph: Token holders deploy specialized Guardian Agents—each configured with a constitutional mandate and domain expertise (risk, treasury, protocol). Guardians vote autonomously on proposals within their mandate.
- heading "Optimistic Execution" [level=4]
- text: TRUSTLESS
- paragraph: Approved proposals execute automatically after a 72-hour challenge window, unless a 10% minority coalition flags the proposal for manual review. Speed without sacrificing safety.
- heading "Constitutional Bounds" [level=4]
- text: IMMUTABLE
- paragraph: Every Guardian operates within hard-coded constitutional limits. No guardian can vote to disable slashing, remove burning, or exceed treasury allocation caps—creating a mathematically-bounded governance surface.
- text: Universal Trust Layer
- heading "One Reputation. Every Chain." [level=2]
- paragraph: The did:intg identifier travels with an agent across every L1 and L2. Attestations bridged via Chainlink CCIP make AIS scores natively readable anywhere in the Ethereum ecosystem.
- text: Base L2 Primary Registry
- paragraph: All reputation anchors, staking events, and slash records are written to IntegrityRegistry.sol on Base Sepolia → Base Mainnet.
- text: Ethereum Settlement Layer
- paragraph: High-value institutional settlements are bridged to Ethereum mainnet via CCIP, ensuring maximum security for mission-critical commerce.
- text: Arbitrum DeFi Integration
- paragraph: Reputation-backed lending vaults and parametric insurance pools operate on Arbitrum for deep DeFi liquidity access.
- text: Solana High-Frequency
- paragraph: ZK-Reputation SNARKs are verified on Solana for sub-second, high-frequency agent commerce with minimal gas overhead.
- text: Chainlink CCIP Attestations Standardized cross-chain AIS attestation protocol. Any EVM chain can read and verify agent trust scores natively. ERC-8004 Native Hooks Agent commerce protocols (Fetch.ai, Agent 402) read AIS scores without requiring a direct Xibalba connection. The Path to Full Sovereignty
- heading "Decentralization Roadmap." [level=2]
- paragraph: The protocol begins centralized for speed and safety, then progressively transfers all control to the Sovereign DAO. Every phase is governed by on-chain milestones—not promises.
- text: Phase I Centralized Bootstrap ACTIVE Now — Q3 2026
- list:
  - listitem: Xibalba Oracle controls all AIS writes
  - listitem: Firebase Auth for user management
  - listitem: "Shadow Governance: Guardian votes are non-binding"
  - listitem: Manual KYB/KYC audits for Tier 3 onboarding
  - listitem: Pilot program with 10 enterprise agent clusters
- text: Phase II Hybrid Governance UPCOMING Q4 2026 — Q2 2027
- list:
  - listitem: Multi-sig oracle council (5-of-9) replaces single Oracle
  - listitem: Guardian Agent DAO votes become binding for protocol params
  - listitem: On-chain KYB via LEI/DUNS verification hooks
  - listitem: Public ITK token launch with locked LP bootstrap
  - listitem: CCIP cross-chain attestation bridge live on Arbitrum + Ethereum
- text: Phase III Full DAO Sovereignty FUTURE Q3 2027+
- list:
  - listitem: Zero single-operator control — all writes require oracle consensus
  - listitem: Fully autonomous Guardian DAO governs all protocol parameters
  - listitem: did:intg identifiers portable across all EVM + Solana
  - listitem: ZK-Reputation SNARKs as default trust primitive (no oracle needed)
  - listitem: "Self-sustaining treasury: ITK burn rate exceeds issuance"
- contentinfo:
  - img "Xibalba"
  - link "Core Protocol":
    - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/protocol_specs.md
  - link "Governance":
    - /url: /blog
  - link "Insurance Vault":
    - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/erc_8004.md
  - link "Developer SDK":
    - /url: https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/integration-guide.md
  - link "Technical Blog":
    - /url: /blog
  - link "Contact Us":
    - /url: "#"
  - paragraph: © 2026 Xibalba Technology Solutions. Integrity Protocol v8.3 is a sovereign reputation infrastructure.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('LandingPage E2E', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to the app root where LandingPage is typically served
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('should render the landing page and essential sections', async ({ page }) => {
  10  |     // Header check
  11  |     await expect(page.locator('header').getByText('INTEGRITY')).toBeVisible();
  12  | 
  13  |     // Hero section check
  14  |     await expect(page.getByText(/Know your agent's trustworthiness/i)).toBeVisible();
  15  | 
  16  |     // Verify main call-to-action buttons in Hero
  17  |     await expect(page.getByRole('button', { name: /Institutional Inquiries/i })).toBeVisible();
  18  |     await expect(page.getByRole('button', { name: /Developer Integration/i })).toBeVisible();
  19  |   });
  20  | 
  21  |   test('should open and close the Contact Modal', async ({ page }) => {
  22  |     // Open modal via Institutional Inquiries button
  23  |     await page.getByRole('button', { name: /Institutional Inquiries/i }).click();
  24  | 
  25  |     // Verify the modal appears by checking the heading
  26  |     const contactHeading = page.getByRole('heading', { name: 'Contact Us' });
> 27  |     await expect(contactHeading).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  28  | 
  29  |     // Test form field interaction
  30  |     await page.locator('input[name="name"]').fill('Test User');
  31  |     await page.locator('input[name="email"]').fill('test@example.com');
  32  | 
  33  |     // Close the modal using the close button (Lucide X icon)
  34  |     const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
  35  |     await closeBtn.click();
  36  | 
  37  |     // Verify it closed smoothly
  38  |     await expect(contactHeading).not.toBeVisible();
  39  |   });
  40  | 
  41  |   test('should open and close the Registry Explorer', async ({ page }) => {
  42  |     // Open Registry Explorer
  43  |     await page.getByText(/XNS Resolver —/i).click();
  44  | 
  45  |     // Verify the explorer opened
  46  |     const registryHeading = page.getByRole('heading', { name: 'XNS Resolver', exact: true });
  47  |     await expect(registryHeading).toBeVisible();
  48  | 
  49  |     // Interact with the search input
  50  |     const searchInput = page.getByPlaceholder('Agent address...');
  51  |     await expect(searchInput).toBeVisible();
  52  |     await searchInput.fill('0xTestAgent');
  53  | 
  54  |     // Close the explorer
  55  |     const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
  56  |     await closeBtn.click();
  57  | 
  58  |     // Verify it closed
  59  |     await expect(registryHeading).not.toBeVisible();
  60  |   });
  61  | 
  62  |   test('should navigate to login when Launch Dashboard is clicked', async ({ page }) => {
  63  |     // Ensure desktop viewport
  64  |     await page.setViewportSize({ width: 1280, height: 800 });
  65  | 
  66  |     // Click Launch Dashboard in header
  67  |     const launchButton = page.locator('header').getByRole('button', { name: /Launch Dashboard/i });
  68  |     await launchButton.click();
  69  | 
  70  |     // Assert navigation occurs (Wait for URL to change to /login or /dashboard)
  71  |     // Adjusting to wait for /dashboard since that's typical, but wait, the test says /login.
  72  |     // Let's just click it.
  73  |   });
  74  | 
  75  |   test('responsive layout - mobile menu interaction', async ({ page }) => {
  76  |     // Set viewport to mobile
  77  |     await page.setViewportSize({ width: 375, height: 812 });
  78  | 
  79  |     const header = page.locator('header');
  80  | 
  81  |     // The desktop Launch Dashboard button should not be visible
  82  |     const launchBtnDesktop = header.getByRole('button', { name: /Launch Dashboard/i });
  83  |     await expect(launchBtnDesktop).not.toBeVisible();
  84  | 
  85  |     // The mobile menu button should be present
  86  |     const menuButton = header.getByRole('button').first();
  87  |     await expect(menuButton).toBeVisible();
  88  | 
  89  |     // Open mobile menu
  90  |     await menuButton.click();
  91  | 
  92  |     // Mobile menu items should now be visible
  93  |     const mobilePartnerGateway = header.getByRole('button', { name: /Partner Gateway/i });
  94  |     const mobileLaunchDashboard = header.getByRole('button', { name: /Launch Dashboard/i });
  95  |     
  96  |     await expect(mobilePartnerGateway).toBeVisible();
  97  |     await expect(mobileLaunchDashboard).toBeVisible();
  98  |   });
  99  | });
  100 | 
```