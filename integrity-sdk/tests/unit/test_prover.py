from integrity_sdk.prover import NoirProver

def test_prover():
    prover = NoirProver("agent1")
    res1 = prover.generate_proof([])
    assert res1["batch_size"] == 0
    res2 = prover.generate_proof([{"entropy": 1, "grounding": 1, "accuracy": 1, "latency_ms": 10}])
    assert res2["batch_size"] == 1
