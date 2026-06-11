# Integrity Protocol (v8.3) - Production Architecture

This document outlines the final production-ready architecture of the Integrity Protocol.

## 1. Smart Contract Layer (Base L2)
- **IntegrityToken (ITK)**: Dynamic fee-bearing utility token. Includes `SafeERC20` hardening and a `VALIDATOR_ROLE` managed fee multiplier.
- **ReputationRegistry**: NFT-indexed identity registry. Supports ZK-proof verification and state-root validation.
- **StateAnchor**: Stores periodic Merkle roots of off-chain telemetry as a source of truth for ZK-circuits.
- **Slasher**: Programmable accountability engine with an optimistic challenge window.
- **ReputationLendingPool**: DeFi composability layer for AIS-collateralized borrowing.
- **NoCodeFactory**: Factory for deploying reputation-backed SLAs and Parametric Insurance proxies.

## 2. Cryptographic Layer (ZK-Noir)
- **Circuit**: `circuits/reputation/src/main.nr`
- **Proof Logic**: 
  - Verifies `ais_score >= threshold`.
  - Verifies `last_slash_days >= max_risk`.
  - Proves membership in the `state_root` via Merkle inclusion proof.

## 3. Oracle & Backend (Python/FastAPI)
- **Data Ingestor**: Aggregates telemetry from SDK interceptors.
- **Oracle Worker**: 
  - Calculates periodic Merkle roots of the "Trust Vault".
  - Anchors roots into the `StateAnchor` contract.
  - Submits reputation updates to the Registry.
- **Identity API**: Handles W3C DID resolution and VC issuance.

## 4. Hermes Integration & Sovereignty
- **Hermes-Integrity Bridge**: `backend/scripts/hermes_integrity_bridge.py`. Synchronizes local Hermes agent telemetry with the global Trust Ledger.
- **Pre-Flight Health Checks**: `backend/scripts/hermes_health.py`. Verifies connectivity to all protocol pillars (Sync, Bridge, Backend, RPC).

## 5. UI Command Center (React/Vite)
- **Registry**: Real-time Tri-Metric radar charts for agent fleets.
- **Market**: Reputation Lending interface with dynamic APR/LTV calculation.
- **Vitals**: Visual tracking of network tax, burn rates, and state anchors.

## 6. Deployment Guide
1. **Network**: Base Sepolia (Testnet) or Base Mainnet.
2. **Environment**:
   - `REPUTATION_REGISTRY_ADDRESS`: `0x0bd07324980856841e83FF95460CcD46EB9B590a`
   - `ITK_TOKEN_ADDRESS`: `0xF448c05074D435d256D6fbc1fC059019B86A5408`
   - `INTEGRITY_PROTOCOL_ADDRESS`: `0xF23c61a9B902eA5b6cb1f8eDecce22B015F07b1A`
   - `XIBALBA_ORACLE_PRIVATE_KEY`
3. **Build**:
   - Backend: `docker-compose up api ingestor`
   - Frontend: `cd frontend && npm run build`

## 7. Official Demo Fleet
To facilitate immediate testing, the following accounts are pre-configured in the `services/trust_api.py` database seed:

### Master Agent (Guardian)
- **UID**: `jacob_v_universe_master`
- **Handle**: `xibalba.intg`
- **Address**: `0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556`
- **Credentials**: `jacob.v.universe@gmail.com` / `Holl@2026`

### Fleet Nodes
- **Alpha Sentinel**: `alpha.intg` | `0x71C7656EC7ab88b098defB751B7401B5f6d8976F`
- **Omega Witness**: `omega.intg` | `0xBB88b098defB751B7401B5f6FD89761B7401B5F`

These nodes have pre-calculated historical reputation snapshots and are ready for AIS verification.
