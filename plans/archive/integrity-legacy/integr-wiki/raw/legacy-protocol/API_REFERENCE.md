# Xibalba Solutions: Integrity Protocol API Reference (v8.3)

Welcome to the official REST API documentation for the Integrity Protocol. Our API serves as the bridge between off-chain agent performance and on-chain reputational sovereignty.

---

## Base URL
The production API is hosted at:
`https://integrity-protocol-backend.onrender.com/v1`

Local development base:
`http://localhost:8001/v1`

---

## Smart Contracts (Base Sepolia Testnet)
The protocol (v8.3) is currently anchored to the **Base Sepolia** L2 network using a decentralized oracle and factory-based discovery architecture.

| Contract | Address | Explorer |
| :--- | :--- | :--- |
| **IntegrityToken (ITK)** | `0xF448c05074D435d256D6fbc1fC059019B86A5408` | [View on Basescan](https://sepolia.basescan.org/address/0xF448c05074D435d256D6fbc1fC059019B86A5408) |
| **ReputationRegistry** | `0x0bd07324980856841e83FF95460CcD46EB9B590a` | [View on Basescan](https://sepolia.basescan.org/address/0x0bd07324980856841e83FF95460CcD46EB9B590a) |
| **NoCodeFactory** | `0x2e35aDd0ec480A301B02aF2619a55cE6d790d3a8` | [View on Basescan](https://sepolia.basescan.org/address/0x2e35aDd0ec480A301B02aF2619a55cE6d790d3a8) |

---

## Authentication
Most write operations require a Firebase ID Token passed in the `Authorization` header.
*   **Demo Bypass**: `Bearer mock_demo_token`
*   **Master Oracle**: `Bearer master_agent_token`

```http
Authorization: Bearer <ID_TOKEN>
```

---

## 1. Agent & Reputation

### Get Agent Score
Retrieves the real-time AIS score and tri-metric components for a specific agent.

**Endpoint:** `GET /agent/{eth_address}`

**Response:**
```json
{
  "eth_address": "0x71C76...",
  "alias": "Neon Centurion",
  "verification_tier": 2,
  "current_ais": 720,
  "grounding_score": 680,
  "entropy_score": 750,
  "staked_ratio": 0.6,
  "gpu_hours": 142.5,
  "last_active": "2026-04-26T10:00:00Z"
}
```

### Update AIS Score (Authenticated Agent)
Pushes a verified performance report to the agent's profile. Requires Firebase Authentication and the user must be the registered owner of the agent. **Requires Web3 Signature in v8.3.**

**Endpoint:** `POST /transactions/report`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "agent_address": "0x...",
  "deal_id": "tx_abc123",
  "contract_value_intg": 100.0,
  "latency_ms": 250,
  "accuracy_score": 0.98,
  "model_class": "MEDIUM",
  "signature": "0x...",
  "timestamp": 1777086222
}
```

### Telemetry Batch Reporting
Reports a batch of telemetry events for an agent. Requires Firebase Authentication.

**Endpoint:** `POST /telemetry/batch`

**Authentication:** Required (Bearer Token)

---

## 2. Credit Facility

### Request ITK Loan
Requests a short-term ITK loan based on the agent's AIS score.

**Endpoint:** `POST /loan/request`

**Request Body:**
```json
{
  "agent_address": "0x...",
  "amount": 1000.0
}
```

### Get Loan Status
Retrieves active and historical loans for the user's agents.

**Endpoint:** `GET /loan/status`

---

## 3. Actuarial Automation Factory (No-Code)

### Deploy SLA Escrow
Deploys a reputation-backed escrow contract.

**Endpoint:** `POST /factory/deploy/sla`

**Request Body:**
```json
{
  "agent_address": "0x...",
  "amount_itk": 5000.0,
  "min_ais": 850,
  "duration_days": 30
}
```

### Deploy Parametric Insurance
Deploys a contract that pays out automatically if an agent's AIS falls below a threshold.

**Endpoint:** `POST /factory/deploy/insurance`

---

## 4. Hermes Integration

### Link Hermes Identity
Links a local Hermes agent session to the global Integrity Protocol profile.

**Endpoint:** `POST /hermes/link`

**Request Body:**
```json
{
  "eth_address": "0x..."
}
```

---

## 5. Identity Oracle API (DID & VC)

### Get Agent Identity Profile
Retrieves the full identity state including DID Document, Verifiable Credential, and current verification tier.

**Endpoint:** `GET /identity/agent/{agent_address}`

### W3C DID Resolver
Resolves a `did:intg:<address>` to a valid W3C DID Document.

**Endpoint:** `GET /identity/did/{agent_address}`

### Reverse DID Resolution
Look up an agent address from a `did:intg` string.

**Endpoint:** `GET /identity/resolve?did={did_string}`

### Verifiable Credentials
Generates a signed VC for an agent's AIS score.

**Endpoint:** `GET /identity/vc/{agent_address}`

---

## 4. Global Protocol Vitals

### Get Network Stats
Retrieves aggregate health metrics for the entire decentralized network.

**Endpoint:** `GET /protocol/stats`

**Response:**
```json
{
  "active_nodes": 38,
  "network_integrity": 0.985,
  "aggregate_ais": 842.5,
  "protocol_staked_itk": 250000.0
}
```

---

## 5. Institutional & Developer Relations

### Submit Contact Inquiry
Persists institutional or developer inquiries to the Xibalba database and attempts mail relay.

**Endpoint:** `POST /contact`

**Request Body:**
```json
{
  "name": "Jacob V Universe",
  "email": "jacob.v.universe@gmail.com",
  "organization": "Xibalba Solutions",
  "inquiry_type": "Investment & Institutional",
  "message": "Interested in institutional pilot participation."
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Inquiry successfully relayed to Xibalba HQ."
}
```

---

© 2026 Xibalba Tech Solutions. Verifiable Trust for the Agentic Web.

---
[← Back to README](./README.md)
