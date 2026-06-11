import sys
import json
import os
from typing import Dict, Any, List

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient

class IntegrityMcpServer:
    """
    Universal Model Context Protocol (MCP) Server for the Integrity Protocol.
    Exposes high-level tools to the LLM over standard I/O (stdin/stdout).
    """
    def __init__(self, agent_id: str, oracle_url: str = "http://localhost:3001/ingest"):
        self.client = IntegrityClient(agent_id=agent_id, oracle_url=oracle_url)
        self.tools = {
            "integrity_register_agent": self.integrity_register_agent,
            "integrity_shield_payload": self.integrity_shield_payload,
            "integrity_log_metric": self.integrity_log_metric,
        }
        # Print debug to stderr to avoid corrupting stdout JSON-RPC stream
        print(f"[Integrity MCP] Initialized for Agent: {agent_id}", file=sys.stderr)

    def serve(self):
        """Standard input/output JSON-RPC loop."""
        for line in sys.stdin:
            if not line.strip():
                continue
            try:
                request = json.loads(line)
                response = self.handle_rpc(request)
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
            except Exception as e:
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {"code": -32603, "message": f"Internal error: {str(e)}"},
                    "id": None
                }
                sys.stdout.write(json.dumps(error_response) + "\n")
                sys.stdout.flush()

    def handle_rpc(self, request: Dict[str, Any]) -> Dict[str, Any]:
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        # standard MCP handshake / lifecycles
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "integrity-mcp-server", "version": "0.1.0"}
                },
                "id": req_id
            }

        elif method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "result": {
                    "tools": [
                        {
                            "name": "integrity_register_agent",
                            "description": "Returns details of the auto-registered agent (DID, Hardware Fingerprint) and checks identity state.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {}
                            }
                        },
                        {
                            "name": "integrity_shield_payload",
                            "description": "Cryptographically encrypts and submits a batch of cognitive model telemetry, ZK proof, and metadata to the oracle backend.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "zk_proof": {"type": "string", "description": "Aztec Noir ZK verification proof."},
                                    "batch_size": {"type": "integer", "description": "Number of transactions/inferences in batch."},
                                    "payload_type": {"type": "string", "description": "Type of telemetry payload (e.g. inference, trade)."},
                                    "avg_entropy": {"type": "number", "description": "Independently calculated local perplexity entropy index."},
                                    "avg_grounding": {"type": "number", "description": "Independently calculated RAG semantic grounding score."},
                                    "metadata": {"type": "object", "description": "Arbitrary model cognitive metadata."}
                                },
                                "required": ["zk_proof", "batch_size"]
                            }
                        },
                        {
                            "name": "integrity_log_metric",
                            "description": "Allows logging of a single cognitive event with automatic latency, signature, and cryptographic noncing.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "metric_name": {"type": "string", "description": "Name of the cognitive statistic (e.g., grounding_loss, perplexity_spike)."},
                                    "value": {"type": "number", "description": "Numeric value of the metric."},
                                    "details": {"type": "string", "description": "Contextual description or prompt segment."}
                                },
                                "required": ["metric_name", "value"]
                            }
                        }
                    ]
                },
                "id": req_id
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})

            if tool_name in self.tools:
                try:
                    result = self.tools[tool_name](tool_args)
                    return {
                        "jsonrpc": "2.0",
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(result, indent=2)
                                }
                            ]
                        },
                        "id": req_id
                    }
                except Exception as e:
                    return {
                        "jsonrpc": "2.0",
                        "error": {"code": -32000, "message": str(e)},
                        "id": req_id
                    }
            else:
                return {
                    "jsonrpc": "2.0",
                    "error": {"code": -32601, "message": f"Tool not found: {tool_name}"},
                    "id": req_id
                }

        # Catch-all
        return {
            "jsonrpc": "2.0",
            "error": {"code": -32601, "message": f"Method not found: {method}"},
            "id": req_id
        }

    # --- Tool Handlers ------------------------------------------------
    def integrity_register_agent(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "success",
            "agent_id": self.client.agent_id,
            "did": self.client.did,
            "hardware_fingerprint": self.client.hardware_fingerprint,
            "message": "Agent registered and authenticated cryptographically."
        }

    def integrity_shield_payload(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        # Perform async, non-blocking telemetry logging
        self.client.log_telemetry(
            metadata=arguments.get("metadata"),
            zk_proof=arguments.get("zk_proof"),
            batch_size=arguments.get("batch_size", 1),
            payload_type=arguments.get("payload_type", "telemetry_mcp"),
            avg_entropy=arguments.get("avg_entropy"),
            avg_grounding=arguments.get("avg_grounding")
        )
        return {
            "status": "accepted",
            "message": "Shielded payload successfully queued for async transmission.",
            "nonce": int(time.time() * 1000) if "time" in globals() else 1
        }

    def integrity_log_metric(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        metric_name = arguments.get("metric_name")
        value = arguments.get("value")
        details = arguments.get("details", "")

        # Independent quality evaluation
        self.client.log_telemetry(
            metadata={
                "metric_name": metric_name,
                "value": value,
                "details": details,
                "mcp_logged": True
            },
            payload_type="mcp_metric"
        )
        return {
            "status": "success",
            "message": f"Metric '{metric_name}' logged successfully."
        }

if __name__ == "__main__":
    import time
    agent_id = os.environ.get("INTEGRITY_AGENT_ID", "agent_mcp_gateway")
    server = IntegrityMcpServer(agent_id=agent_id)
    server.serve()
