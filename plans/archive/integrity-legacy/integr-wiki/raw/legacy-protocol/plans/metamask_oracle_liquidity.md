# NEXUS-Sprint Implementation Plan: MetaMask, Oracle & Xibalba LP Anchor

A roadmap to implement verified MetaMask wallet binding, active Oracle dependency probing, and an interactive ITK/ETH Liquidity Pool anchor for Agent Xibalba.

## NEXUS-Sprint Roadmap

### Sprint 1: Cryptographic MetaMask Verification & Linkage
- **Objective**: Establish secure, verified wallet binding for the Command Center and Agent Fleet.
- **Deliverables**:
  - Implement signature-verification helpers on the Python backend using `eth_account` to recover signers.
  - Implement `/v1/hermes/verify-signature` to verify MetaMask ownership.
  - Implement `/v1/agent/bind-controller` to bind a verified MetaMask address to a specific agent, storing it securely in the database (`agent_metadata`).
  - Update `Dashboard.tsx` to handle cryptographic signature signing when connecting MetaMask or linking it to an agent.

### Sprint 2: Multi-Probe Active Oracle Health Check
- **Objective**: Ensure the `ORACLE ONLINE/OFFLINE` UI badge is 100% accurate.
- **Deliverables**:
  - Refactor `/health` in `trust_api.py` to probe SQLite query execution.
  - Test blockchain node connectivity (e.g., query current block number on Base Sepolia L2).
  - Return HTTP 503 Service Unavailable if any component is degraded.
  - Verify that the frontend UI reflects instant offline/online status updates during connection failures.

### Sprint 3: Agent Xibalba ITK/ETH Liquidity Pool Anchor
- **Objective**: Create the decentralized liquidity foundation, seeding Xibalba as the primary testnet LP.
- **Deliverables**:
  - Create backend routes `GET /v1/liquidity/pool` and `POST /v1/liquidity/provide` in `trust_api.py`.
  - Simulate the pool with starting reserves of `500,000,000 ITK` and `125,000 ETH` (with 99.9% owned by Agent Xibalba).
  - Build `LiquidityPoolAnchor.tsx` in the frontend to showcase TVL, price, pool ratios, and LP share.
  - Add interactive deposit/withdraw actions to let users dynamically allocate virtual ITK reserves.

### Sprint 4: Comprehensive Validation & End-to-End Tests
- **Objective**: Harden all UI states, complete type checking, and compile production assets.
- **Deliverables**:
  - Run `tsc` type checking and verify zero compile errors.
  - Run Vite production compilation (`npm run build`).
  - Verify full operational accuracy under simulation.
