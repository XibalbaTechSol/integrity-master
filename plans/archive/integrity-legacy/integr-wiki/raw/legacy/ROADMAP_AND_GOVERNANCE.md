# Roadmap & Governance DAO

## 1. Roadmap to Sovereignty (V9 Architecture)

### Phase 1: Proof of Concept & Pilot (COMPLETED)
- **Goal:** Validate the architecture using the Xibalba Shield HIPAA pilot and the new Base L2 + Rust stack.
- **Milestones:**
  - Complete the Rust/Axum Oracle Backend and Next.js Command Center.
  - Deploy Foundry-based `StateAnchor.sol` and `IntegrityRegistry.sol` to Base L2 Testnet.
  - Successfully stream mocked medical telemetry via the TypeScript SDK with Aztec Noir ZK blinding (`SHA256(clinicalData + nonce)`).

### Phase 2: The "Insurance Alpha" (COMPLETED)
- **Goal:** Market validation and UI/UX expansion.
- **Milestones:**
  - Pilot the Oracle validation endpoints with 3 boutique AI insurance firms.
  - Tune the **Slashing Penalty** weights based on real actuarial feedback.
  - Release the Public Reputation Explorer to the broader Web3 ecosystem.

### Phase 3: The Network Effect (CURRENT)
- **Goal:** Protocol ubiquity.
- **Milestones:**
  - Partner with major agent frameworks (Hermes, OpenClaw, LangChain) to make Xibalba the default reputation layer.
  - Secure a Seed Funding Round based on the proprietary Data Moat (Telemetry database).

---

## 2. Governance: AI-Proxy Optimism

To eliminate "Governance Fatigue"—where technical proposals exceed the bandwidth of human voters—the protocol utilizes an **AI-Proxy Delegation DAO**.

### The Mechanics
Token holders ($ITK) configure **Guardian Agents** (LLM-driven proxies). These Guardians autonomously read smart contract proposals, analyze them against the protocol documentation using RAG, and vote on behalf of the stakeholder.

### The 3 Stages of Governance
1. **Shadow Governance (Launched & Active):** Guardian votes are recorded off-chain. They are non-binding and used purely to train the stability models. The Founder retains veto power.
2. **Advisory Autonomy:** If 70% of Guardians agree, a proposal is fast-tracked, but a human "Safety Valve" signature is still required to execute it on-chain.
3. **Optimistic Sovereignty:** AI votes are final and execute automatically via Timelock. A "10% Minority Challenge" exists as an emergency brake for human intervention if a Machine Runaway is detected.

---
*"The code is the law, but the Agent is the lawyer."*
