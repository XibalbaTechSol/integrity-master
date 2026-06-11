"""
Integration test: Python SDK → Rust Oracle pipeline validation.

Spins up a mock HTTP server simulating the Axum Oracle /ingest endpoint,
then exercises the IntegrityClient's batching, proving, and transmission.
"""
import json
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient


class MockOracleHandler(BaseHTTPRequestHandler):
    """Captures POST payloads to /ingest for assertion."""
    received_payloads = []

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        payload = json.loads(body)
        MockOracleHandler.received_payloads.append(payload)
        self.send_response(202)
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress HTTP logs during test


def run_mock_oracle(server: HTTPServer):
    server.serve_forever()


def test_batch_flush_and_transmission():
    """Verify that telemetry is batched, proved, and transmitted correctly."""
    MockOracleHandler.received_payloads.clear()
    server = HTTPServer(("127.0.0.1", 9999), MockOracleHandler)
    thread = threading.Thread(target=run_mock_oracle, args=(server,), daemon=True)
    thread.start()

    client = IntegrityClient(
        agent_id="test-agent-001",
        oracle_url="http://127.0.0.1:9999/ingest",
        batch_size_limit=5,
        flush_interval_sec=1.0,
    )

    # Simulate 7 telemetry events — should trigger one flush at 5
    for i in range(7):
        client.log_telemetry(entropy=float(i * 10), grounding=float(90 - i * 5))

    # Allow background worker time to flush
    time.sleep(3.0)

    # Shutdown to flush remaining 2
    client.shutdown()
    time.sleep(1.0)

    server.shutdown()

    assert len(MockOracleHandler.received_payloads) >= 1, \
        f"Expected at least 1 payload, got {len(MockOracleHandler.received_payloads)}"

    first = MockOracleHandler.received_payloads[0]
    assert first["agent_id"] == "test-agent-001", f"agent_id mismatch: {first['agent_id']}"
    assert first["zk_proof"].startswith("0x"), f"Proof missing 0x prefix: {first['zk_proof']}"
    assert first["batch_size"] == 5, f"First batch should be 5, got {first['batch_size']}"
    assert isinstance(first["nonce"], int), f"Nonce should be int, got {type(first['nonce'])}"

    print(f"  ✓ Received {len(MockOracleHandler.received_payloads)} payload(s)")
    print(f"  ✓ First batch_size: {first['batch_size']}")
    print(f"  ✓ Proof: {first['zk_proof'][:24]}...")
    print(f"  ✓ Nonce: {first['nonce']}")


def test_anti_replay_nonce_monotonic():
    """Verify that nonces are strictly monotonically increasing across batches."""
    MockOracleHandler.received_payloads.clear()
    server = HTTPServer(("127.0.0.1", 9998), MockOracleHandler)
    thread = threading.Thread(target=run_mock_oracle, args=(server,), daemon=True)
    thread.start()

    client = IntegrityClient(
        agent_id="test-agent-002",
        oracle_url="http://127.0.0.1:9998/ingest",
        batch_size_limit=3,
        flush_interval_sec=1.0,
    )

    # Push 9 events → 3 batches of 3
    for i in range(9):
        client.log_telemetry(entropy=50.0, grounding=50.0)

    time.sleep(4.0)
    client.shutdown()
    time.sleep(1.0)
    server.shutdown()

    nonces = [p["nonce"] for p in MockOracleHandler.received_payloads]
    assert len(nonces) >= 2, f"Need at least 2 batches for monotonicity check, got {len(nonces)}"

    for i in range(1, len(nonces)):
        assert nonces[i] > nonces[i - 1], \
            f"Nonce not monotonic: {nonces[i]} <= {nonces[i-1]}"

    print(f"  ✓ Nonce sequence: {nonces} — strictly monotonic")


def test_empty_batch_no_transmission():
    """Verify that no payload is transmitted if no telemetry is logged."""
    MockOracleHandler.received_payloads.clear()
    server = HTTPServer(("127.0.0.1", 9997), MockOracleHandler)
    thread = threading.Thread(target=run_mock_oracle, args=(server,), daemon=True)
    thread.start()

    client = IntegrityClient(
        agent_id="test-agent-003",
        oracle_url="http://127.0.0.1:9997/ingest"
    )
    time.sleep(2.0)
    client.shutdown()
    time.sleep(0.5)
    server.shutdown()

    assert len(MockOracleHandler.received_payloads) == 0, \
        f"Expected 0 payloads for empty batch, got {len(MockOracleHandler.received_payloads)}"

    print("  ✓ Zero payloads transmitted for empty telemetry — correct")


if __name__ == "__main__":
    print("=" * 60)
    print("INTEGRITY PROTOCOL — Python SDK Integration Tests")
    print("=" * 60)

    tests = [
        ("Batch Flush & Transmission", test_batch_flush_and_transmission),
        ("Anti-Replay Nonce Monotonicity", test_anti_replay_nonce_monotonic),
        ("Empty Batch Guard", test_empty_batch_no_transmission),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        print(f"\n[TEST] {name}")
        try:
            fn()
            passed += 1
            print(f"  → PASSED ✓")
        except AssertionError as e:
            failed += 1
            print(f"  → FAILED ✗: {e}")
        except Exception as e:
            failed += 1
            print(f"  → ERROR ✗: {e}")

    print(f"\n{'=' * 60}")
    print(f"Results: {passed} passed, {failed} failed out of {len(tests)}")
    print(f"{'=' * 60}")
    sys.exit(1 if failed > 0 else 0)
