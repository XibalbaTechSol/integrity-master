
from integrity_sdk.telemetry.analyzer import CompositeSignalAnalyzer
from integrity_sdk.telemetry.host import HostTelemetrySampler
from integrity_sdk.telemetry.conventions import IntegrityAttributes
from integrity_sdk.telemetry.core import get_tracer, get_meter

def test_analyzer():
    analyzer = CompositeSignalAnalyzer()
    analyzer.record_tool_call("ls", {}, "result", 0.5)
    analyzer.record_inference("prompt", "completion", {"grounding": 0.8}, {"cpu_percent": 10})
    analyzer.record_inference("prompt", "completion connect", {"grounding": 0.5, "inter_token_jitter_ms": 1.0}, {"cpu_percent": 10})
    analyzer.compute_all_signals({"path_entropy": 5.0, "ip_entropy": 3.0})
    analyzer.record_tool_call("test", {}, "fail", 0.5)
    analyzer.record_inference("prompt", "success", {}, {})
    analyzer.compute_all_signals({})
    analyzer.tool_calls.clear()
    analyzer.inferences.clear()
    analyzer.grounding_history.clear()
    analyzer.compute_all_signals({})

def test_host(mocker):
    sampler = HostTelemetrySampler(0.1)
    sampler.start()
    sampler.start()
    sampler.stop()
    sampler.stop()
    mocker.patch.object(sampler, "sample", side_effect=Exception)
    sampler._stop_event.clear()
    def side_effect():
        sampler._stop_event.set()
        raise Exception("test")
    mocker.patch.object(sampler, "sample", side_effect=side_effect)
    sampler._run()

def test_core():
    tracer = get_tracer("test")
    meter = get_meter("test")

def test_host_calculate_entropy():
    import math
    # ARRANGE
    sampler = HostTelemetrySampler(0.1)

    # ACT & ASSERT
    # Empty list
    assert sampler._calculate_entropy([]) == 0.0

    # Single item
    assert sampler._calculate_entropy(["192.168.1.1"]) == 0.0

    # Identical items
    assert sampler._calculate_entropy(["10.0.0.1", "10.0.0.1", "10.0.0.1"]) == 0.0

    # Two unique items uniformly distributed (entropy = 1.0)
    assert sampler._calculate_entropy(["A", "B"]) == 1.0

    # Four unique items uniformly distributed (entropy = 2.0)
    assert sampler._calculate_entropy(["A", "B", "C", "D"]) == 2.0

    # Non-uniform distribution
    # List: ["A", "A", "A", "B"]
    # P(A) = 0.75, P(B) = 0.25
    # Entropy = -(0.75 * log2(0.75) + 0.25 * log2(0.25)) = 0.8112781244591328
    entropy = sampler._calculate_entropy(["A", "A", "A", "B"])
    assert math.isclose(entropy, 0.8112781244591328, rel_tol=1e-9)
