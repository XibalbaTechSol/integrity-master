# Universal Model Context Protocol (MCP) Guide 🔌

For operators running no-code agent platforms, terminal applications, or environments that support the Model Context Protocol (such as Cursor or Claude Desktop), the Integrity SDK includes a built-in, universal **JSON-RPC MCP Server**.

---

## 1. How It Works

The MCP Server exposes high-level tools to the LLM. Instead of requiring the developer to import Python libraries or write JavaScript callbacks, the agent itself invokes these tools directly using standard JSON-RPC packets exchanged over stdin/stdout.

```
+--------------------+   JSON-RPC   +---------------------+   HTTP   +------------------+
| Cursor / Claude    | <----------->| Integrity MCP Server|<-------->| Axum Oracle      |
| (LLM calling tools)|   (std I/O)  | (signing & noncing) |  (JSON)  | (Postgres/Redis) |
+--------------------+              +---------------------+          +------------------+
```

The MCP server runs as a background process, automatically deriving hardware fingerprints, signing payload structures, maintaining strictly monotonic nonces, and transmitting telemetry asynchronously. **In v2.0, the MCP server automatically traces all tool call boundaries using OpenTelemetry.**

---

## 2. Platform Integrations

### A. Claude Desktop
Add the following configuration block to your local Claude Desktop config file (located at `~/.config/Claude/claude_desktop_config.json` on Linux/macOS):

```json
{
  "mcpServers": {
    "integrity-shield": {
      "command": "python3",
      "args": ["-m", "integrity_sdk.mcp_server"],
      "env": {
        "INTEGRITY_AGENT_ID": "claude_desktop_agent",
        "INTEGRITY_OTLP_ENDPOINT": "localhost:4317"
      }
    }
  }
}
```

### B. Cursor IDE
1. Open Cursor Settings -> Features -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the details:
   - **Name**: `integrity-shield`
   - **Type**: `stdio`
   - **Command**: `python3 -m integrity_sdk.mcp_server`
4. Set the environment variable `INTEGRITY_AGENT_ID=cursor_agent_shield`.

---

## 3. Tool Specifications

Once loaded, the agent gains access to three standardized tools:

### 1. `integrity_register_agent`
- **Purpose**: Auto-resolves hardware identity parameters and registers the agent DID document with the oracle backend.
- **Parameters**: None.
- **Output**:
  ```json
  {
    "status": "success",
    "agent_id": "cursor_agent_shield",
    "did": "did:integrity:52f9ea2197fd0e...",
    "hardware_fingerprint": "52f9ea2197fd0e...",
    "message": "Agent registered and authenticated cryptographically."
  }
  ```

### 2. `integrity_shield_payload`
- **Purpose**: Wraps raw telemetry metrics with ZK-proofs and deterministic Ed25519 signatures.
- **Required Parameters**:
  - `zk_proof` (string): local Aztec Noir proof verification string.
  - `batch_size` (integer): number of events in current batch.
- **Optional Parameters**:
  - `avg_entropy` (number)
  - `avg_grounding` (number)
  - `metadata` (object)

### 3. `integrity_log_metric`
- **Purpose**: Submits single cognitive parameters (e.g. latency, execution scores) with automatic noncing.
- **Required Parameters**:
  - `metric_name` (string)
  - `value` (number)
