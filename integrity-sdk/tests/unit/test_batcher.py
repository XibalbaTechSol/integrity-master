import time
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
