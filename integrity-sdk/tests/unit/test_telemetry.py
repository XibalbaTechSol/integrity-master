
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
