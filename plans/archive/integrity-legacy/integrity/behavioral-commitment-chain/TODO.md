# Behavioral Commitment Chain Microservice: Phase 2 TODO List

This document outlines the initial engineering tasks for Phase 2 of the Integrity Project MVP: **Behavioral Commitment Chain**. This phase focuses on developing a Solidity smart contract deployed on an EVM-compatible blockchain (Polygon Mumbai Testnet) to record and verify AI agent commitments.

## Phase 2: Behavioral Commitment Chain (MVP)

### 1. Project Setup & Development Environment
- [ ] Initialize a new Hardhat or Foundry project for Solidity development.
  - `mkdir behavioral-commitment-chain`
  - `cd behavioral-commitment-chain`
  - `npx hardhat init` (or `forge init` for Foundry)
- [ ] Configure the project for Polygon Mumbai Testnet interaction.
  - Add Mumbai network to Hardhat/Foundry config.
  - Set up environment variables for Mumbai RPC URL and private keys.
- [ ] Install necessary dependencies for testing and deployment.

### 2. Smart Contract Design: `BehavioralCommitment.sol`
- [ ] Define the core `BehavioralCommitment` contract.
- [ ] Implement a `Commitment` struct:
  - `agentId` (address/bytes32): Identifier for the AI agent.
  - `timestamp` (uint256): Timestamp of the commitment.
  - `actionHash` (bytes32): Cryptographic hash of the intended action and reasoning (from off-chain `phi-provenance-service` if integrated).
  - `policyHash` (bytes32): Hash of the HIPAA compliance policy against which the action is validated.
  - `isValid` (bool): Boolean indicating if the commitment was validated against policies (to be set by an Oracle/PEP).
- [ ] Implement `commitAction(bytes32 _actionHash, bytes32 _policyHash)` function:
  - Stores a new `Commitment` on-chain.
  - Emits an event `ActionCommitted`.
  - **Devil's Advocate Note:** Implement strict access control (`onlyAgent` or similar) to prevent unauthorized entities from making commitments. Guard against replay attacks by ensuring `actionHash` and `policyHash` are unique per agent within a time window or context.
- [ ] Implement `getCommitment(address _agentId, uint256 _index)` function:
  - Allows retrieval of a specific commitment for auditing.
  - **Devil's Advocate Note:** Consider gas costs for storing and retrieving potentially large commitment histories.
- [ ] Implement `updateCommitmentValidity(address _agentId, uint256 _index, bool _isValid)` function:
  - Allows an authorized Oracle/Policy Enforcement Point to update the `isValid` status of a commitment.
  - **Devil's Advocate Note:** Implement extremely strict access control (`onlyOracle/PEP`) for this function. Ensure only a single, trusted entity can update validity to prevent malicious approvals/denials. Consider multi-sig for critical state changes.

### 3. Access Control (OPA Integration Placeholder)
- [ ] Define roles for `agent` and `oracle/PEP` within the smart contract (e.g., using OpenZeppelin `AccessControl`).
- [ ] Integrate a placeholder for off-chain OPA validation:
  - The smart contract does not directly execute OPA policies. It receives the `policyHash` and the `_isValid` boolean from an external Oracle/PEP after off-chain OPA evaluation.
  - **Devil's Advocate Note:** The security of this model heavily relies on the trustworthiness of the Oracle/PEP. This is a critical attack surface.

### 4. Events & Auditing
- [ ] Define `ActionCommitted` and `CommitmentValidityUpdated` events to facilitate off-chain monitoring and auditing.
  - **Devil's Advocate Note:** Ensure all critical state changes emit appropriate events for transparency and traceability.

### 5. Initial Smart Contract Testing
- [ ] Write unit tests for:
  - `commitAction` function: successful commitment, access control violations, unique commitment checks.
  - `getCommitment` function: successful retrieval.
  - `updateCommitmentValidity` function: successful update by Oracle, unauthorized update attempts.
- [ ] Simulate deployment to a local blockchain (e.g., Hardhat Network or Anvil for Foundry).

### 6. Deployment Considerations
- [ ] Script for deploying the `BehavioralCommitment` contract to Polygon Mumbai Testnet.
- [ ] Verification of contract on Block Explorer (e.g., Polygonscan).

---
**Next Actions:** Begin implementing these tasks sequentially. Each completed task should be marked off. Prioritize setting up the development environment.