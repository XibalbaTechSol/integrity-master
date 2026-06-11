# 🏗️ SDK Expansion Plan (v1.0) - Interceptors & Provenance

**Goal:** Expand the Integrity Protocol's reach by supporting more AI frameworks and enforcing absolute data provenance via Web3 signing.

## 🏁 Sprint 1: Framework Interceptors
- [x] **Anthropic (Claude)**: Implement `AnthropicInterceptor` for `messages.create` tracking.
- [x] **LlamaIndex**: Implement `LlamaIndexInterceptor` as a callback handler for query/retrieval events.
- [x] **OpenAI (Harden)**: Ensure existing interceptor aligns with the new signing logic.

## 🏁 Sprint 2: Data Provenance
- [x] **Strict Provenance**: Add `strict_provenance` flag to `IntegrityConfig`.
- [x] **Mandatory Signing**: Update `IntegrityClient` to enforce private key presence when `strict_provenance` is enabled.
- [x] **Payload Integrity**: All telemetry events (`/v1/telemetry/batch`) and transaction reports (`/v1/transactions/report`) must be signed.

## 🏁 Sprint 3: Validation & Testing
- [x] **Mock Validation**: Create `backend/tests/validate_sdk_extensions.py` using `unittest.mock`.
- [x] **Signature Verification**: Confirm that signatures and timestamps are present in all signed payloads.
- [x] **Import Resilience**: Ensure interceptors gracefully degrade when frameworks are not installed.

## ✅ Verification Block
- **Test Results**: All 3 test cases (Anthropic, LlamaIndex, Strict Provenance) passed.
- **Git State**: Logic anchored in `backend/sdk/python/xibalba_integrity/`.
- **Strategy Alignment**: Adheres to the "Value-Driven UI" and "Antigravity" mandates by providing real utility and empirical proof.

---
© 2026 Xibalba Solutions.
"Verification is the only path to finality."
