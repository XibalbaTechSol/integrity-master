# Xibalba Shield: Product Roadmap (CCO Focus)
**Date:** June 8, 2026
**Target Audience:** Healthcare Chief Compliance Officers (CCOs) & Enterprise Sales

## Executive Mandate
Following feedback from healthcare compliance executives, traditional static BAAs and retrospective logging tools (e.g., Vanta, Aptible) are insufficient for managing the risks of autonomous AI agents. CCOs require **Active Defense**, **Guaranteed Indemnification**, and **Frictionless Auditing**.

This roadmap outlines the engineering phases to upgrade Xibalba Shield from a cryptographic gating system into a comprehensive, CCO-first enterprise compliance platform.

---

## Phase 1: Smart BAA & Pre-Funded Indemnification (COMPLETED)
*Status: Complete & Integrated*

*   **Objective:** Shift the BAA from a passive legal document to an active, self-enforcing digital perimeter with financial stakes.
*   **Features:**
    *   `SmartBAA.sol` hybrid escrow implementation (Isolated vs. Pooled liability).
    *   Programmatic `slash()` capabilities routing vendor collateral directly to the hospital treasury upon breach detection.
    *   Dashboard command-and-control for deploying and monitoring Active BAAs.

## Phase 2: The "Red Button" Global Kill Switch
*Status: In Development*

*   **Objective:** Provide CCOs with immediate, network-wide revocation capabilities without requiring IT ticket intervention.
*   **Implementation Steps:**
    1.  **Dashboard Upgrades:** Implement a multi-factor authentication (MFA) protected "Global Revoke" module in `src/app/dashboard/page.tsx`.
    2.  **Contract Logic:** Enhance `CoveredEntityRegistry.sol` to allow a CCO to batch-revoke all active `SmartBAAs` associated with a specific AI vendor across the entire clinic network in a single L2 transaction.
    3.  **Proxy Push Notifications:** Implement WebSocket listeners in the API proxy (`api/inference/route.ts`) so that a smart contract revocation immediately purges the vendor's API session cache, killing active connections in milliseconds.

## Phase 3: Mathematical Sub-Processor Blocking (Shadow AI Net)
*Status: Planned*

*   **Objective:** Prevent an approved AI agent from routing PHI to an unapproved third-party LLM or translation API.
*   **Implementation Steps:**
    1.  **Chain of Custody Registry:** Deploy `SubBAARegistry.sol` allowing AI vendors to register and stake collateral for their specific third-party APIs.
    2.  **Egress Monitoring:** Integrate an egress proxy wrapper that inspects outbound network requests from the AI agent's inference container.
    3.  **Cryptographic Verification:** If the outbound IP/domain is not mapped to an active Sub-BAA on the blockchain, the Xibalba proxy drops the packet and triggers an automatic slashing event on the primary vendor's Smart BAA.

## Phase 4: Zero-Knowledge OCR Audit Exporter
*Status: Planned*

*   **Objective:** Turn a 3-week HHS/OCR audit preparation process into a 1-click PDF/CSV generation.
*   **Implementation Steps:**
    1.  **Data Indexing:** Create a dedicated indexing subgraph (using The Graph or similar) that tracks all `LogAnchored` and `BAASigned` events for a specific Covered Entity.
    2.  **Report Generator Module:** Build an API endpoint (`/api/audit/generate`) that aggregates this immutable on-chain data.
    3.  **Format:** The generated report will explicitly list: Active BAA timestamps, Vendor Identity (SBT), Scope Restrictions, and a mathematical proof that no raw PHI was stored (verifying the ZK-Hash functions).

## Phase 5: SMART on FHIR Proxy Wrapper
*Status: Planned*

*   **Objective:** Ensure hospitals do not have to rewrite their Epic/Cerner infrastructure to deploy Xibalba Shield.
*   **Implementation Steps:**
    1.  **FHIR Compatibility Layer:** Develop a lightweight proxy server that conforms strictly to the SMART on FHIR specification.
    2.  **OAuth2 Intercept:** The proxy intercepts the standard OAuth2 token exchange between the AI vendor and the hospital's EMR.
    3.  **Smart BAA Check:** During the token exchange, the proxy validates the `SmartBAA.isActive()` state. If true, it issues the standard FHIR access token. If false, it returns a standard OAuth `invalid_grant` error, making the blockchain integration completely transparent to the legacy EMR system.