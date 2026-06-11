# Roadmap & Governance — Xibalba Integrity Protocol

## 1. The 5-Phase Roadmap to Sovereignty

### Phase 1: Cryptographic Binding (Zero-Knowledge Integration & Hardened Ingestion) — CURRENT
*   **Edge Batching:** Implement batching mechanisms in the agent SDKs to aggregate telemetry before generating Noir proofs, mitigating edge compute starvation.
*   **Asynchronous Ingestion:** Re-architect the Axum backend to queue incoming telemetry payloads, offloading CPU-heavy ZK verification to dedicated background worker threads to prevent thread starvation.
*   **Native Verifier Integration:** Bind the Aztec Noir verifier directly to the native Rust backend via FFI (avoiding WASM overhead) to validate proofs efficiently.
*   **Cryptographic Anti-Replay:** Integrate strict nonce tracking and temporal validation into both the circuits and the Axum ingestion layer to reject replayed telemetry.
*   **Versioned Circuit Registry:** Deploy a multi-version circuit registry in the backend to ensure zero-downtime rolling upgrades of reputation formulas.

### Phase 2: On-Chain Orchestration (The Slashing Engine)
*   **Ethers-rs/Alloy Integration:** Integrate Ethereum communication libs into the Rust Oracle.
*   **State rollups:** Deploy a `tokio-cron` worker to bundle the PostgreSQL state into a Merkle root and submit it to the `StateAnchor.sol` Base L2 contract.
*   **Programmatic Slashing:** Automate the calling of `StakingReputation.slash()` when an agent's entropy violates threshold constraints (Hallucination Event).

### Phase 3: Advanced Primitives & Legacy Reintegration
*   **Inference Auctions:** Build the orderbook matching engine where enterprise requesters bid for high-reputation agent compute.
*   **Dispute Resolution:** Port the legacy `dispute_resolver.py` logic to allow agents to mathematically challenge a slashing event using on-chain arbitration.
*   **Hermes Gateway & Distribution Hub:** Reintegrate the legacy telemetry distribution hubs to allow third-party DeFi protocols to subscribe to real-time agent reputation streams.

### Phase 4: Developer Distribution (SDK Expansion)
*   **Publish SDKs:** Publish `integrity/sdk/nodejs` to `npm` and `integrity/sdk/python` to `PyPI`.
*   **Framework Middleware:** Write dedicated middleware adapters for LangChain, AutoGPT, and CrewAI for frictionless integration.

### Phase 5: Production Genesis
*   **Mainnet Migration:** Migrate Smart Contracts from Sepolia/testnets to **Base L2 Mainnet**.
*   **Vercel Deployment:** Deploy the Next.js MVP to Vercel production.
*   **High-Availability Ingest:** Deploy the Rust PostgreSQL Oracle to a dedicated, high-availability AWS ECS or Railway cluster.

---

## 2. Governance: AI-Proxy Optimism

To eliminate "Governance Fatigue"—where technical proposals exceed the bandwidth of human voters—the protocol utilizes an **AI-Proxy Delegation DAO**.

### The Mechanics
Token holders ($ITK) configure **Guardian Agents** (LLM-driven proxies). These Guardians autonomously read smart contract proposals, analyze them against the protocol documentation using RAG, and vote on behalf of the stakeholder.

### The 3 Stages of Governance
1. **Shadow Governance (Pilot Phase - CURRENT):** Guardian votes are recorded off-chain. They are non-binding and used purely to train the stability models. The Founder retains veto power.
2. **Advisory Autonomy:** If 70% of Guardians agree, a proposal is fast-tracked, but a human "Safety Valve" signature is still required to execute it on-chain.
3. **Optimistic Sovereignty:** AI votes are final and execute automatically via Timelock. A "10% Minority Challenge" exists as an emergency brake for human intervention if a Machine Runaway is detected.

---
*Integrity Protocol v3.0 — Xibalba AI Solutions*
*"Privacy-First. Mathematically Certain. Omnichain Sovereign."*
