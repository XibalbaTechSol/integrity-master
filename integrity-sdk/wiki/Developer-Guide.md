# Developer Guide & API Reference 🛠️

This guide provides a comprehensive reference for the Integrity SDK, detailing the cryptographic primitives, telemetry interfaces, and advanced capability integrations (BCC, Oracle, ZK-ML).

---

## 1. Class Reference: `IntegrityClient`

The `IntegrityClient` handles cryptographic identity, background batching, and secure protocol interactions.

### Constructor
```python
client = IntegrityClient(
    agent_id="my_agent",
    oracle_url="http://localhost:3001/ingest",
    hipaa_eligible=True,
    zdr_enabled=True,
    region="us-east-1"
)
```

### Method: `register_agent`
Registers a new agent with the Integrity Protocol.
```python
client.register_agent(
    eth_address="0x...",
    alias="MyBot",
    xns_handle="bot.intg"
)
```

### Method: `handshake`
Evaluates trust between two agents.
```python
result = client.handshake(
    initiator_eth_address="0x...",
    target_eth_address="0x..."
)
# result["trust_decision"] -> "APPROVED" or "DENIED"
```

### Method: `report_transaction`
Synchronously submits transaction metrics and receives an updated AIS score.
```python
score = client.report_transaction(
    deal_id="deal_001",
    deal_amount=100.0,
    latency_ms=250,
    accuracy_score=0.98
)
```

### Method: `commit_action_intent` (BCC)
Generates a signed commitment of an intended action state.
```python
commitment = client.commit_action_intent(
    action_type="clinical_access",
    intended_state={"patient_id": "123", "action": "read"},
    opa_policy_id="hipaa_policy_v1"
)
```

### Method: `validate_and_execute` (BCC)
Ensures execution context matches signed intent.
```python
client.validate_and_execute(
    commitment=commitment,
    actual_execution_context=actual_state,
    action_function=lambda: my_action()
)
```

### Method: `oracle_fetcher.fetch_and_validate` (World Awareness)
Fetches and cryptographically validates external Oracle data.
```python
data = client.oracle_fetcher.fetch_and_validate(
    oracle_url="https://api.pubmed.gov/...",
    source_id="pubmed",
    secret_key="<hmac_secret>"
)
```

---

## 2. Advanced Capabilities (SDK)

### BCC Decorator
Use the `bcc_enforced` decorator to automatically wrap critical function calls.
```python
@IntegrityClient.bcc_enforced(client, "execute_trade", "finance_policy_01")
def execute_trade(symbol, quantity):
    # Action logic here
```

### AIS Scoring
Retrieve the agent's current performance/reputation score:
```python
score = client.get_ais_score() # Returns int (0-1000)
```

### Compliance Events
Log governance-specific state changes:
```python
client.log_compliance_event(
    event_type="hipaa_shield_activated",
    status="success",
    details="HIPAA mode enabled for US-EAST-1"
)
```

---

## 3. SQLite Offline Cache & HMAC Security
If the Oracle is unreachable, the client redirects all queued telemetry to an HMAC-protected local SQLite database:
- **Database Path**: `~/.integrity/offline_moat_{agent_id}.db`
- **Integrity Guarantee**: Row-level HMAC-SHA256 signatures derived from the agent's private DID key prevent local file tampering.
- **Sync**: A background sync worker continuously polls the Oracle and automatically flushes and purges verified records upon connection restoration.

---

## 4. Multi-Agent & Context Isolation
The SDK provides isolation for concurrent agent swarms:
- **Workspace Isolation**: Config and keys resolved via `{project_root}/.integrity/did/{agent_id}/`.
- **Process Isolation**: Each agent maintains a unique SQLite offline cache file.
- **Hierarchical DID**: Use `client.spawn_subagent("child_id")` to create a verifiable chain of trust.

---

## 5. Deployment Checklist
- [ ] **Node.js**: v22.13.0+
- [ ] **Hardhat**: v2.28.6+
- [ ] **Environment**: Set `INTEGRITY_AGENT_ID`, `INTEGRITY_ORACLE_URL`.
- [ ] **Contract Registration**: Register agent DIDs via `ZKModelRegistry` and `ReputationRegistry`.

---

## 6. Wiki References
- [System Architecture & Provenance](wiki/Architecture.md)
- [Universal Model Context Protocol (MCP) Guide](wiki/MCP-Integration.md)
