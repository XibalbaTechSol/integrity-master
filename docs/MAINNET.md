# Integrity Protocol: Mainnet Readiness Checklist 🚀

This document outlines the final requirements and security procedures for the transition from Testnet/Pilot to Mainnet deployment.

## 🛡️ 1. Security & Key Management
- [x] **Secure Identity Storage:** Integrated `keyring` into CLI and SDK for system-level private key protection.
- [ ] **KMS Production Cutover:** Transition `integrity-oracle` from local private keys to AWS KMS / HashiCorp Vault.
- [ ] **mTLS Enforcement:** Enforce mutual TLS for all agent-to-oracle telemetry streams to prevent spoofing.
- [ ] **Audit:** Complete third-party smart contract audits for `ReputationRegistry`, `Slasher`, and `IntegrityPaymaster`.

## 🌐 2. Identity & XNS
- [x] **XNS Backend:** Ported handle registration and resolution logic to the primary Python Oracle.
- [x] **Handle Auction Logic:** Implemented tiered pricing (Premium: 5k ITK, Standard: 1k ITK) with automated balance deduction.
- [x] **DID Revocation:** Implemented a verifiable revocation registry with DID document metadata integration.

## ⚡ 3. Account Abstraction & UX
- [x] **Paymaster Signing:** Implemented Oracle-side `UserOperation` signing for gasless agent transactions.
- [ ] **Bundler Integration:** Deploy a production-grade ERC-4337 Bundler (e.g., Alchemy/Stackup) for agent transaction execution.
- [ ] **ITK Liquidity:** Seed the ITK/USDC liquidity pool on Base Mainnet to enable automated premium payments.

## 📊 4. Scalability & High-Fidelity
- [x] **State Merklization:** Implemented `MerkleService` to compute a deterministic state root of all agent reputations.
- [ ] **Batch Proof Aggregation:** Move from single-batch ZK proofs to recursive aggregation for lower L1/L2 gas costs.
- [ ] **Telemetry Sharding:** Partition the Postgres `transaction_logs` table by agent/epoch for faster lookup at scale.

## ⚖️ 5. Decentralized Governance
- [ ] **Evidence Storage:** Migrate dispute evidence from local storage to IPFS/Arweave.
- [ ] **Sovereign DAO:** Launch the Governor contract for $ITK-based voting on protocol parameters.
- [ ] **Slashing Oracle:** Implement the final 'vouching' logic where multiple independent Oracles must sign a slashing event.

## 🏛️ 6. Institutional Capabilities (Phase 4)
- [x] **Smart BAA Enforcement:** Production launch of `SmartBAA.sol` for legal-to-technical gating.
- [x] **Institutional Suite Contracts:** Deployment of `ClinicalTrialBond.sol`, `ClaimsAdjudicator.sol`, and `MedicalCreditLine.sol`.
- [x] **CCIP Reputation Bridge:** Integration with Chainlink CCIP for cross-chain AIS synchronization.
- [x] **XNS Mainnet Launch:** Deployment of `XibalbaNameService.sol` to anchor `.intg` handles on Base Mainnet.

---
*Mathematical Certainty. Behavioral Integrity. The Sovereign Agent Economy.*
