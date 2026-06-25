import os

os.makedirs('tests/unit', exist_ok=True)

with open('tests/unit/test_batcher.py', 'w') as f:
    f.write("""import time
from integrity_sdk.batcher import TelemetryBatcher

def test_batcher():
    batcher = TelemetryBatcher(batch_size_limit=2, flush_interval_sec=0.1)
    assert not batcher.should_flush()
    batcher.add_telemetry({"a": 1})
    assert not batcher.should_flush()
    batcher.add_telemetry({"b": 2})
    assert batcher.should_flush()

    batch = batcher.get_batch_and_clear()
    assert len(batch) == 2
    assert not batcher.should_flush()

    batcher.add_telemetry({"c": 3})
    time.sleep(0.15)
    assert batcher.should_flush()
    batch2 = batcher.get_batch_and_clear()
    assert len(batch2) == 1
""")

with open('tests/unit/test_bundler.py', 'w') as f:
    f.write("""from integrity_sdk.bundler import IntegrityBundler
import pytest

def test_bundler(requests_mock, mocker):
    bundler = IntegrityBundler("0xep", "http://pm", "http://bun", 1)
    mocker.patch("eth_account.Account.sign_message", return_value=mocker.MagicMock(signature=b'sig'))

    requests_mock.post("http://pm", json={"paymaster_and_data": "0xpm"})
    requests_mock.post("http://bun", json={"result": "0xres"})
    res = bundler.submit_user_op("0xsender", "0xcall", "0xkey")
    assert res == "0xres"

    requests_mock.post("http://pm", status_code=500)
    requests_mock.post("http://bun", json={"error": "err"})
    res2 = bundler.submit_user_op("0xsender", "0xcall", "0xkey")
    assert res2 == "0x_SUBMISSION_FAILED"

    requests_mock.post("http://bun", exc=Exception("network"))
    res3 = bundler.submit_user_op("0xsender", "0xcall", "0xkey")
    assert res3 == "0x_SUBMISSION_FAILED"
""")

with open('tests/unit/test_prover.py', 'w') as f:
    f.write("""from integrity_sdk.prover import NoirProver

def test_prover():
    prover = NoirProver("agent1")
    res1 = prover.generate_proof([])
    assert res1["batch_size"] == 0
    res2 = prover.generate_proof([{"entropy": 1, "grounding": 1, "accuracy": 1, "latency_ms": 10}])
    assert res2["batch_size"] == 1
""")

with open('tests/unit/test_evals.py', 'w') as f:
    f.write("""from integrity_sdk.evals import TrajectoryEvaluator
import pytest

def test_evals(mocker):
    client = mocker.MagicMock()
    client.commit_action_intent.return_value = "commitment_id"
    client.validate_and_execute.return_value = "validated"

    evaluator = TrajectoryEvaluator(client, "test_policy")
    evaluator.capture_tool_call("tool1", {"a": 1}, "res")
    evaluator.capture_file_mutation("file.txt", "write", "diff")

    def success_func():
        evaluator.capture_tool_call("tool2", {}, "res")
        return "done"

    res = evaluator.run_with_intent({"state": "test"}, "action", success_func)
    assert res == "validated"

    def fail_func():
        raise ValueError("error")

    with pytest.raises(ValueError):
        evaluator.run_with_intent({"state": "test"}, "action", fail_func)
""")

print("Tests written successfully.")
