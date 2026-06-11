# 🏗️ Integrity Protocol: Comprehensive Developer Guide

Welcome to the Integrity Protocol Builder's Guide. This document provides technical insights, architectural overviews, and extension points for developers looking to build upon or integrate with the Xibalba Solutions Integrity Ecosystem.

---

## 1. System Architecture Overview

The Integrity Protocol is composed of five core pillars:
1. **On-Chain Reputation Registry**: Solidity smart contracts anchoring the truth (Agent Integrity Score).
2. **Oracle & Scoring Backend**: Python-based FastAPI services that calculate scores off-chain.
3. **Agent Integration SDKs**: Python and Node.js toolkits for agentic interactions.
4. **Command Center**: React-based dashboard for protocol operators.
5. **Data Ingestion & Verification Processors**: Background services processing inference telemetry.

```mermaid
graph TD
    A[Agent running Python/Node SDK] -->|Telemetry (Latency/Accuracy)| B(Data Ingestor API)
    A -->|Trust Handshake| C(Trust API Oracle)
    B --> D[Postgres/SQLite Database]
    C --> D
    
    D --> E(Scoring Engine)
    E -->|Updates AIS| F[Blockchain Listener / Relayer]
    F -->|Transaction| G((Reputation Registry Smart Contract))
    
    H[Command Center Dashboard] -->|Queries| C
    H -->|Reads| G
```

---

## 2. Core Service Deep Dive (`/services`)

The backend is written in Python (FastAPI) and orchestrated to bridge off-chain metrics to on-chain reputation.

### Key Components to Extend
- **`trust_api.py`**: The main ingress for agents requesting handshakes and operators fetching telemetry.
  - *Dev Task*: Currently uses a `MOCK_DATABASE`. Next step is to integrate `schema.sql` into a real async Postgres connection using SQLAlchemy or asyncpg.
- **`scoring_engine.py`**: Houses the Tri-Metric Scoring algorithm (Entropy + Grounding + Staking).
  - *Dev Task*: Fine-tune the multi-dimensional vectors. E.g., adding weight to agent execution latency specifically for LLM-based agents.
- **`verification_engine.py`**: Applies cryptographic "Proof-of-Verification".
  - *Dev Task*: Implement zero-knowledge proof generation bridging agent outputs to verifiable proofs natively.
- **`blockchain_listener.py`**: Listens for `Staked` events from the smart contract to update off-chain caching.

### Backend Setup
```bash
cd services
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic web3
uvicorn trust_api:app --reload --port 8001
```

---

## 3. Smart Contract Extensions (`/contracts`)

The Solidity contracts (`^0.8.20`) manage the immutable ledger of reputation.

### Development Workflow
1. **Tooling**: We recommend using **Hardhat** or **Foundry** for compiling, testing, and deploying.
2. **Current State**:
   - `IntegrityToken.sol`: Standard ERC-20 with a verification fee burning mechanism.
   - `ReputationRegistry.sol`: Maps `address -> AgentProfile`.

### Future Development Tasks
- **Slashing Conditions**: Introduce a `slashAgent(address _agent, uint256 _amount)` function that burns staked tokens if `dispute_resolver.py` confirms malicious behavior.
- **Role-Based Access Control**: Transition `ReputationRegistry` from `Ownable` to a DAO-based Oracle network using `AccessControl` where multiple Oracles can update the AIS.

---

## 4. Expanding the SDKs (`/backend/sdk/python`)

The SDKs are the entry points for external Agent developers.

### Python SDK (`/backend/sdk/python/xibalba_integrity`)
- **Current State**: Features the robust `IntegrityClient` and `IntegrityConfig`. It includes drop-in interceptors like `OpenAIInterceptor` that automatically capture latency, tokens, and calculate semantic drift.
- **Cryptographic Provenance**: Telemetry batches are signed locally on the SDK using the agent's private key before being sent to `/v1/telemetry/batch` where the signature is verified by recovered Ethereum addresses on the Trust Oracle backend.

### Node.js SDK / Swarm Adapter (`/backend/sdk/nodejs`)
- **Current State**: Provides Node.js/TypeScript bindings for the Integrity API, including a dedicated `HermesSwarmIntegrityAdapter` to track handoffs between planner and execution agents in multi-agent swarms.

---

## 5. Command Center UI Development (`/frontend`)

The Command Center is a high-performance, dark-themed (Sovereign Obsidian) dashboard built with React, Vite, and TailwindCSS.

### Working with the UI
- **Styling Architecture**: Custom CSS vars in `global.css` dictate the glassmorphism and neon borders. Responsive layout is implemented using CSS Grid.
- **Web3 MetaMask Integration**: Features a direct Web3 MetaMask bridge via `ethers.BrowserProvider` to dynamically track wallet account switches and synchronize session addresses via `/v1/hermes/link`.
- **Live Telemetry Stream**: The telemetry interface continuously polls the FastAPI trust oracle endpoint `/v1/telemetry/latest` every 5 seconds to visualize performance metrics without static mock data.

---

## 6. Development Philosophy & Standards

- **Resilient Fallbacks**: If the blockchain RPC is down, the SDKs must fail gracefully, utilizing cached AIS scores from the off-chain oracle.
- **Gas Efficiency**: Optimize `ReputationRegistry` struct packing. Currently, `AgentProfile` is well packed, but constant updates are expensive. Consider batch updates or Layer 2 Rollups (Arbitrum/Optimism).
- **Aesthetic Rigidity**: All new UI components must strictly adhere to the high-contrast, edge-lit visual identity established in `global.css`. Avoid stock Tailwind colors without opacity modifications.

---
**Need Help?** Submit an issue on the repository or engage the Xibalba Solutions engineering team.

---
[← Back to README](../README.md)
