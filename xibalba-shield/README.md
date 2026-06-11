# Xibalba Shield (Cryptographic HIPAA CaaS)

**Enterprise-Grade Clinical Security built on the Xibalba Integrity Protocol.**

## Overview

Xibalba Shield is the first vertical implementation of the Integrity Protocol, designed specifically for healthcare networks and Hospital Chief Compliance Officers (CCOs). It replaces passive legal BAAs with active cryptographic defense, allowing clinics to run autonomous AI agents on Protected Health Information (PHI) while mathematically guaranteeing HIPAA Technical Safeguards compliance (45 CFR § 164.312).

By leveraging the Integrity Protocol's ZK-ML edge proving (Node 4) and Base L2 settlement (Node 1), Shield guarantees that private PHI never touches the blockchain or unauthorized third-party LLMs.

## Table of Contents
- [Architecture & Protocol Role](#architecture--protocol-role)
- [Enterprise CCO Capabilities](#enterprise-cco-capabilities)
- [Technical Specifications](#technical-specifications)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage & API](#usage--api)
- [Development & Testing](#development--testing)

## Architecture & Protocol Role

Shield operates as a vertical domain (Domain ID: `SHIELD_01`) on top of the generic Integrity Protocol.

```mermaid
graph TD
    subgraph Hospital Intranet (Edge)
        Data[Patient PHI] --> Scribe[AI Agent Scribe]
        Scribe --> SDK[Shield Edge SDK Node 4]
        SDK -->|ZK Blinds PHI| Hash[Clinical ZK_Hash]
    end

    subgraph Integrity Protocol
        Hash -->|Commits Intent| BCC[BCC Middleware Node 3]
        BCC -->|Domain: SHIELD_01| Oracle[Rust Oracle Node 5]
    end

    subgraph Base L2 Settlement
        Oracle -->|Anchors Audit Log| Contract[AuditShield.sol Node 1]
        Contract -->|Checks Compliance| BAA[SmartBAA.sol]
    end
```

### Key Responsibilities
1. **Zero-Knowledge Blinding:** Hashes PHI locally at the edge (`SHA256(clinicalData + nonce)`) so no raw data leaves the hospital.
2. **Smart BAAs:** Programmatic Business Associate Agreements that automatically slash an AI vendor's collateral if they breach HIPAA rules.
3. **The "Red Button":** Allows CCOs to instantly sever an agent's API access globally.

## Enterprise CCO Capabilities

- **Pre-Funded Indemnification:** AI vendors stake ITK collateral in L2 smart contracts.
- **Tri-Metric Agent Gating:** AI models are continuously audited for Accuracy, Privacy, and Reliability.
- **Zero-Knowledge OCR Audit Exporter:** Generates mathematically verified reports for HHS/OCR without exposing underlying PHI.

## Technical Specifications
- **Client Stack:** Next.js / React / TypeScript
- **Smart Contracts:** Solidity / Hardhat (for Shield-specific logic)
- **Compliance Mapping:**
  - § 164.312(a)(1) Access Control: `ReputationSBT.sol`
  - § 164.312(b) Transmission Security: ZK-edge blinding
  - § 164.312(c)(1) Integrity: `AuditShield.sol` anchoring

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Hardhat

### Install
```bash
cd xibalba-shield
npm install
```

## Configuration
Copy the environment template:
```bash
cp .env.example .env
```
Ensure `NEXT_PUBLIC_RPC_URL` points to your preferred Base L2 or testnet endpoint.

## Usage & API

Start the Shield portal and dashboard:
```bash
npm run dev
```
Navigate to `http://localhost:3000` for the clinical console and `/dashboard` for the CCO command center.

## Development & Testing

Run the B2B outpatient simulation loop testing concurrent block mining and duplicate log prevention:
```bash
npx hardhat run scripts/test-scribe-loop.ts --network localhost
```
