import pytest
import time
from integrity_sdk.extractor import InferenceMetadataExtractor

class TestInferenceMetadataExtractor:
    """
    Unit tests for the InferenceMetadataExtractor component.
    """

    def test_normalize_openai_style(self):
        """
        Ensures that OpenAI-style telemetry is correctly normalized.
        """
        # ARRANGE
        raw_data = {
            "choices": [{"message": {"content": "Hello"}}],
            "usage": {"total_tokens": 50}
        }
        provider = "openai"

        # ACT
        normalized = InferenceMetadataExtractor.normalize(provider, raw_data)

        # ASSERT
        assert normalized["provider"] == provider
        assert "timestamp" in normalized
        # Basic check that it didn't crash and returned a dict
        assert isinstance(normalized, dict)

    def test_normalize_with_latency(self):
        """
        Validates that latency and tokens per second are calculated correctly.
        """
        # ARRANGE
        raw_data = {"usage": {"completion_tokens": 100}}
        provider = "openai"
        latency_ms = 1000.0 # 1 second

        # ACT
        normalized = InferenceMetadataExtractor.normalize(provider, raw_data, latency_ms=latency_ms)

        # ASSERT
        assert normalized["latency_ms"] == 1000.0
        assert normalized["tokens_per_second"] == 100.0
