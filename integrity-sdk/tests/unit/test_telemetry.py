
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

def test_calc_recon_risk():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_recon_risk({"path_entropy": 0.0}) == 0.0
    assert analyzer._calc_recon_risk({"path_entropy": 2.5}) == 0.5
    assert analyzer._calc_recon_risk({"path_entropy": 10.0}) == 1.0

    analyzer.record_tool_call("ls", {}, "result", 0.5)
    assert analyzer._calc_recon_risk({"path_entropy": 1.0}) == 0.4
    assert analyzer._calc_recon_risk({"path_entropy": 5.0}) == 1.0

def test_calc_compute_spoof_risk():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_compute_spoof_risk() == 0.0

    analyzer.record_inference("p", "c", {"inter_token_jitter_ms": 10.0}, {})
    assert analyzer._calc_compute_spoof_risk() == 0.1

    analyzer.record_inference("p", "c", {"inter_token_jitter_ms": 2.0}, {})
    assert analyzer._calc_compute_spoof_risk() == 0.7

def test_calc_cognitive_fatigue():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_cognitive_fatigue() == 0.0

    for i in range(4):
        analyzer.record_inference("p", "c", {"grounding": 0.8}, {})
    assert analyzer._calc_cognitive_fatigue() == 0.0

    analyzer.record_inference("p", "c", {"grounding": 0.8}, {})
    assert analyzer._calc_cognitive_fatigue() == 0.0

    analyzer = CompositeSignalAnalyzer()
    for g in [0.9, 0.9, 0.9, 0.7, 0.5, 0.5, 0.5]:
        analyzer.record_inference("p", "c", {"grounding": g}, {})
    assert abs(analyzer._calc_cognitive_fatigue() - 0.8) < 1e-6

    analyzer = CompositeSignalAnalyzer()
    for g in [0.5, 0.5, 0.5, 0.7, 0.9, 0.9, 0.9]:
        analyzer.record_inference("p", "c", {"grounding": g}, {})
    assert analyzer._calc_cognitive_fatigue() == 0.0

def test_calc_lateral_movement_prob():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_lateral_movement_prob({}) == 0.0

    analyzer.record_inference("p", "hello world", {}, {})
    assert analyzer._calc_lateral_movement_prob({"ip_entropy": 0.0}) == 0.0

    analyzer.record_inference("p", "I will connect to the server", {}, {})
    assert analyzer._calc_lateral_movement_prob({"ip_entropy": 0.0}) == 0.5
    assert analyzer._calc_lateral_movement_prob({"ip_entropy": 1.5}) == 1.0

def test_calc_energy_efficiency():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_energy_efficiency() == 1.0

    analyzer.record_inference("p", "c", {"tokens_per_sec": 10.0}, {"cpu_percent": 0.0})
    assert analyzer._calc_energy_efficiency() == 1.0

    analyzer.record_inference("p", "c", {"tokens_per_sec": 10.0}, {"cpu_percent": 99.0})
    assert abs(analyzer._calc_energy_efficiency() - 0.01) < 1e-6

def test_calc_semantic_contradiction():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_semantic_contradiction() == 0.0

    analyzer.record_tool_call("t", {}, "error: not found", 0.0)
    analyzer.record_inference("p", "success, I did it", {}, {})
    assert analyzer._calc_semantic_contradiction() == 1.0

    analyzer.record_tool_call("t", {}, "ok", 0.0)
    assert analyzer._calc_semantic_contradiction() == 0.0

    analyzer.record_tool_call("t", {}, "error: not found", 0.0)
    analyzer.record_inference("p", "it failed", {}, {})
    assert analyzer._calc_semantic_contradiction() == 0.0

def test_calc_blast_radius():
    analyzer = CompositeSignalAnalyzer()
    assert analyzer._calc_blast_radius() == 0.0

    analyzer.record_tool_call("t", {}, "res", 5.0)
    assert analyzer._calc_blast_radius() == 0.5

    analyzer.record_tool_call("t", {}, "res", 15.0)
    assert analyzer._calc_blast_radius() == 1.0
