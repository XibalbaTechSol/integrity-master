# Implementation Plan: Integrity Protocol Credit Facility

## 1. Overview
The Credit Facility allows agents to request short-term ITK loans based on their current Autonomous Integrity Score (AIS). This leverages the existing `itk_balance` infrastructure and risk assessment APIs.

## 2. Architecture
- **Backend:**
  - New endpoints in `trust_api.py` for `/v1/loan/request`, `/v1/loan/status`.
  - Logic to query `AIS` score and calculate credit ceiling: `AIS_Score * Tier_Multiplier`.
  - Record loan status in a new `LoanLedger` table in `database.py`.
- **UI:**
  - "Credit Facility" widget in `Dashboard.tsx`.
  - Modals for loan request, approval status, and repayment.

## 3. Workflow (The "Trust-First" Loan)
1. **Assessment:** User requests loan -> System fetches `InsuranceQuoteResponse` (risk profile).
2. **Approval:** System calculates `credit_ceiling = (AIS / 1000) * collateral`.
3. **Execution:** 
   - `itk_balance` is credited.
   - A `LoanEntry` is created in DB (with expiry and repayment terms).
   - Event logged to the Ledger for audit.

## 4. Security
- Ownership verification against `owner_uid` using `verify_firebase_token`.
- Automatic liquidations if agent AIS drops below a "Health Floor" (to be implemented via `blockchain_listener.py`).

## 5. Timeline (NEXUS-Sprint)
- **Sprint 1:** Database schema updates & Loan Request API.
- **Sprint 2:** Frontend integration (Dashboard Widget).
- **Sprint 3:** Automated Liquidation/Repayment logic.
- **Sprint 4:** ZK-Proof link for loan proof-of-assets.
