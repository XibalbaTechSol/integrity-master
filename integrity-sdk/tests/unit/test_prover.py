import hashlib
from integrity_sdk.prover import NoirProver

def test_generate_proof_empty_batch():
    """
    Test generating a proof for an empty batch.
    """
    # ARRANGE
    prover = NoirProver("agent1")

    # ACT
    result = prover.generate_proof([])

    # ASSERT
    assert result["batch_size"] == 0
    assert result["avg_entropy"] == 0
    assert result["avg_grounding"] == 0
    assert result["nonce"] == prover.current_nonce
    # Verify commitment is constructed correctly
    commitment_payload = f"0:0:0:1000:{prover.current_nonce}"
    expected_commitment = "0x" + hashlib.sha256(commitment_payload.encode()).hexdigest()
    assert result["commitment"] == expected_commitment
    assert result["zk_proof"] == expected_commitment

def test_generate_proof_single_item():
    """
    Test generating a proof for a batch with a single item.
    """
    # ARRANGE
    prover = NoirProver("agent1")
    batch = [{"entropy": 0.5, "grounding": 0.8, "accuracy": 0.9, "latency_ms": 150}]

    # ACT
    result = prover.generate_proof(batch)

    # ASSERT
    assert result["batch_size"] == 1
    assert result["avg_entropy"] == 500
    assert result["avg_grounding"] == 800
    assert result["nonce"] == prover.current_nonce

    commitment_payload = f"500:800:150:900:{prover.current_nonce}"
    expected_commitment = "0x" + hashlib.sha256(commitment_payload.encode()).hexdigest()
    assert result["commitment"] == expected_commitment

def test_generate_proof_multiple_items():
    """
    Test generating a proof for a batch with multiple items.
    """
    # ARRANGE
    prover = NoirProver("agent1")
    batch = [
        {"entropy": 0.2, "grounding": 0.9, "accuracy": 1.0, "latency_ms": 100},
        {"entropy": 0.8, "grounding": 0.5, "accuracy": 0.8, "latency_ms": 300},
        {"entropy": 0.5, "grounding": 0.7, "accuracy": 0.9, "latency_ms": 200},
    ]

    # ACT
    result = prover.generate_proof(batch)

    # ASSERT
    assert result["batch_size"] == 3
    # Averages: entropy = (0.2+0.8+0.5)/3 = 0.5 -> 500
    assert result["avg_entropy"] == 500
    # grounding = (0.9+0.5+0.7)/3 = 0.7 -> 700
    assert result["avg_grounding"] == 700
    # max latency = 300
    # accuracy = (1.0+0.8+0.9)/3 = 0.9 -> 900

    commitment_payload = f"500:700:300:900:{prover.current_nonce}"
    expected_commitment = "0x" + hashlib.sha256(commitment_payload.encode()).hexdigest()
    assert result["commitment"] == expected_commitment

def test_generate_proof_missing_fields():
    """
    Test generating a proof for a batch with items that are missing some fields.
    """
    # ARRANGE
    prover = NoirProver("agent1")
    batch = [
        {"entropy": 0.4}, # missing grounding, accuracy, latency_ms
        {"grounding": 0.6, "latency_ms": 200}, # missing entropy, accuracy
        {} # missing all
    ]

    # ACT
    result = prover.generate_proof(batch)

    # ASSERT
    assert result["batch_size"] == 3
    # entropy = (0.4 + 0 + 0)/3 = 0.1333... -> 133
    assert result["avg_entropy"] == 133
    # grounding = (0 + 0.6 + 0)/3 = 0.2 -> 200
    assert result["avg_grounding"] == 199
    # accuracy = (1.0 + 1.0 + 1.0)/3 = 1.0 -> 1000
    # max latency = max(0, 200, 0) = 200

    commitment_payload = f"133:199:200:1000:{prover.current_nonce}"
    expected_commitment = "0x" + hashlib.sha256(commitment_payload.encode()).hexdigest()
    assert result["commitment"] == expected_commitment

def test_generate_proof_nonce_increment():
    """
    Test that the nonce increments with each generated proof.
    """
    # ARRANGE
    prover = NoirProver("agent1")
    initial_nonce = prover.current_nonce

    # ACT
    result1 = prover.generate_proof([])
    result2 = prover.generate_proof([])
    result3 = prover.generate_proof([])

    # ASSERT
    assert result1["nonce"] == initial_nonce + 1
    assert result2["nonce"] == initial_nonce + 2
    assert result3["nonce"] == initial_nonce + 3
    assert prover.current_nonce == initial_nonce + 3
