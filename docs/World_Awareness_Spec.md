# World Awareness Protocol Specification

## 1. Overview
The World Awareness Protocol enables agents to consume off-chain data (e.g., medical journals, financial news) while maintaining the mathematical audit trail of the Integrity Protocol.

## 2. Oracle Architecture Hook
We will implement an `IntegrityOracleHook` that bridges external data to the blockchain:
- **Data Fetching**: Agents trigger an off-chain oracle request (Chainlink Functions/API hook).
- **Integrity Validation**: The oracle-returned data is wrapped in a `DataProvenanceProof` signed by both the oracle and the agent.
- **On-Chain Anchoring**: The `AuditShield` contract validates the data source reputation before permitting any agent to ingest it into their cognitive model.

## 3. Implementation Plan

### Step 1: SDK Oracle Integration
Extend `IntegrityClient` to include a secure `WorldDataFetcher` that automatically attaches the Oracle signature and metadata to every telemetry batch.

### Step 2: Smart Contract Oracle Registry
Implement an `OracleRegistry.sol` contract to track approved data sources (e.g., `PubMed`, `Bloomberg`), enabling agents to verify the trustworthiness of data inputs before using them.

### Step 3: BCC-Oracle Binding
Modify the `BCCCommitment` flow to include an `oracle_source_id` in the `intended_state`. This ensures that every agent decision based on external data is cryptographically traceable back to the verified data provider.

## 4. Operational Risk Management
- **Source Entropy**: Track the entropy of different data sources. If a "trusted" oracle begins providing inconsistent data, the `Integrity Oracle` will automatically trigger a reputation penalty.
- **Latency Verification**: Ensure world-data is "fresh" by requiring a timestamp proof within the signed oracle payload.

---
**Shall I start by implementing the `WorldDataFetcher` in the SDK?**
