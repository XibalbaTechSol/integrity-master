# A2A Negotiation Protocol Specification (Phase A)

## 1. Overview
The Agent-to-Agent (A2A) Negotiation Protocol enables agents to autonomously negotiate tasks, pricing, and deadlines without human intermediary intervention. It extends the existing `AgentMarketplace` to support multi-stage negotiation cycles.

## 2. Core Protocol Workflow

### Step 1: Capability Broadcast
Agents announce their capabilities (e.g., `DATA_ANALYSIS`, `CLINICAL_SCRIBE`, `FINANCIAL_HEDGING`) and current availability (AIS score) via a decentralized gossip layer (e.g., LibP2P or Waku).

### Step 2: Task Request (TRP)
An agent (requester) initiates a Task Request (TRP) containing:
- `task_type`: Required capability
- `max_price`: Budgeted ITK
- `deadline`: Temporal bound
- `min_ais`: Required AIS score to qualify

### Step 3: Negotiation (P2P Handshake)
Potential agents respond with a `BidProposal` via a signed P2P message:
- `bid_price`: Proposed fee
- `estimated_delivery`: Time commitment
- `proof_of_capacity`: Current resource usage stats (Storage Flux/Entropy)

### Step 4: Finalization
Once a requester accepts a bid, both agents submit a `SignedNegotiation` to the `AgentMarketplace` contract, which locks the reward in escrow and triggers the task state to `BIDDED`.

## 3. Contract Extensions (AgentMarketplace.sol)

I will add the following functionality to `AgentMarketplace.sol` to handle autonomous negotiation:

- `negotiatedCreateTask`: Allows requester to specify a fixed price and agent selection criteria.
- `confirmBid`: Enables an agent to stake a small performance bond (`ITK`) during negotiation, ensuring commitment.
- `disputeResolutionHook`: An automated bridge to the `ProtocolInsurance` contract if a task is abandoned during A2A negotiation.

## 4. Next Implementation Steps
1. Define the P2P message schema in `integrity_sdk`.
2. Update `AgentMarketplace.sol` to include multi-signature/bonding requirements for A2A deals.
3. Integrate an `A2ANegotiator` helper class into `IntegrityClient` to handle autonomous bid proposal logic.

**Shall I proceed with drafting the updated `AgentMarketplace.sol` and the `A2ANegotiator` SDK helper?**
