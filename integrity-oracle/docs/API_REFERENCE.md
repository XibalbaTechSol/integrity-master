# Integrity Protocol — API Reference

> **Xibalba Oracle API** · Version 1.1 (Protocol v3.1) · Production Documentation

---

## Table of Contents

1. [Overview](#1-overview)
   - [Base URL](#base-url)
   - [Authentication](#authentication)
   - [Versioning](#versioning)
   - [Content Type](#content-type)
2. [Health Check](#2-health-check)
3. [Agent Registry](#3-agent-registry)
   - [Register Agent](#31-register-agent)
   - [List All Agents](#32-list-all-agents)
   - [Get Agent by Identifier](#33-get-agent-by-identifier)
4. [Behavioral Commitment Chain (BCC)](#4-behavioral-commitment-chain-bcc)
   - [Register Commitment](#41-register-commitment)
5. [Telemetry & Scoring](#5-telemetry--scoring)
   - [Verify Transaction (ZK-Proof)](#51-verify-transaction)
   - [Report Transaction (Legacy)](#52-report-transaction)
6. [Identity & DID](#6-identity--did)
   - [Issue Verifiable Credential (VC)](#61-issue-verifiable-credential)
   - [Resolve DID Document](#62-resolve-did-document)
7. [XNS — Xibalba Name Service](#7-xns--xibalba-name-service)
   - [Resolve XNS Handle](#71-resolve-xns-handle)
   - [Register XNS Handle](#72-register-xns-handle)
8. [AIS Scoring Engine](#8-ais-scoring-engine)
   - [Tri-Metric Architecture](#tri-metric-architecture)

---

## 1. Overview

The **Integrity Protocol API** is the canonical interface to the Xibalba Oracle — a decentralized trust infrastructure for AI agents operating on-chain.

### Base URL

```
http://localhost:3001
```

All versioned endpoints are prefixed with `/v1`.

| Environment | Base URL |
|---|---|
| Production | `https://api.xibalba.solutions` |
| Local Development | `http://localhost:3001` |

---

## 2. Health Check

### `GET /health` (Legacy) / `GET /`

Returns a plain-text liveness probe.

---

## 3. Agent Registry

### 3.1 Register Agent

#### `POST /v1/agent/register`

Registers a new AI agent.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_id` | `string` | ✅ | Ethereum address or UUID |

---

## 4. Behavioral Commitment Chain (BCC)

BCC ensures non-repudiation by requiring agents to commit to an action *before* execution.

### 4.1 Register Commitment

#### `POST /v1/commitments/register`

Registers a pre-execution commitment.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_id` | `string` | ✅ | Ethereum address or UUID |
| `domain_id` | `string` | ✅ | Namespace (e.g., `shield`, `quant`) |
| `action_type` | `string` | ✅ | Type of action (e.g., `READ_HIPAA_DATA`) |
| `target_resource` | `string` | ❌ | Target of the action |
| `commitment_hash` | `string` | ✅ | SHA-256 hash of the commitment |
| `signature` | `string` | ❌ | Agent's signature of the hash |

---

## 5. Telemetry & Scoring

### 5.1 Verify Transaction

#### `POST /v1/transactions/verify` (also aliased as `/ingest`)

The primary telemetry ingestion endpoint. Accepts a ZK-proof and domain context.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_id` | `string` | ✅ | Ethereum address or UUID |
| `domain_id` | `string` | ✅ | Namespace (e.g., `shield`) |
| `zk_proof` | `string` | ✅ | Aztec Noir UltraPlonk proof |
| `nonce` | `number` | ✅ | Unique anti-replay nonce |
| `batch_size` | `number` | ✅ | Number of actions in proof |
| `payload_type` | `string` | ✅ | Domain-specific payload label |
| `avg_entropy` | `number` | ❌ | Measured behavioral consistency |
| `avg_grounding` | `number` | ❌ | Measured human oversight |
| `signature` | `string` | ❌ | Ed25519 signature of the payload |

---

## 6. Identity & DID

### 6.1 Issue Verifiable Credential (VC)

#### `GET /v1/identity/vc/{agent_id}`

Issues a signed W3C Verifiable Credential for an agent, containing their current AIS and trust level.

**Response `200 OK`**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "..."],
  "id": "urn:uuid:...",
  "type": ["VerifiableCredential", "AgentIntegrityCredential"],
  "issuer": "did:xibalba:oracle-01",
  "issuance_date": "2026-06-08T10:00:00Z",
  "credential_subject": {
    "id": "did:xibalba:0x...",
    "ais_score": 850,
    "trust_level": "AAA"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "jws": "..."
  }
}
```

---

*© 2026 Xibalba Protocol. All rights reserved. Documentation version 1.1 (Protocol v3.1).*
