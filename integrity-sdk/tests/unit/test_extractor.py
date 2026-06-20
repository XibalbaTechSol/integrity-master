import pytest
from integrity_sdk.extractor import InferenceMetadataExtractor

class TestInferenceMetadataExtractor:
    """
    Unit tests for the InferenceMetadataExtractor.
    Ensures correct parsing of OpenAI and Anthropic response structures.
    """

    def test_extract_openai_success(self):
        """
        Validates extraction from a standard OpenAI response.
        """
        # ARRANGE
        mock_response = {
            "model": "gpt-4o",
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": 200,
                "total_tokens": 300
            },
            "choices": [{
                "finish_reason": "stop",
                "message": {
                    "content": "Hello, world!",
                    "logprobs": {
                        "content": [
                            {"token": "Hello", "logprob": -0.1},
                            {"token": ",", "logprob": -0.05}
                        ]
                    }
                }
            }]
        }

        # ACT
        result = InferenceMetadataExtractor.extract_openai(mock_response)

        # ASSERT
        assert result["model_name"] == "gpt-4o"
        assert result["prompt_tokens"] == 100
        assert result["total_tokens"] == 300
        assert result["text_output"] == "Hello, world!"
        assert len(result["token_logprobs"]) == 2
        assert result["estimated_cost_usd"] > 0
        assert result["gpu_hours_used"] > 0

    def test_extract_anthropic_success(self):
        """
        Validates extraction from a standard Anthropic response.
        """
        # ARRANGE
        mock_response = {
            "model": "claude-3-5-sonnet",
            "usage": {
                "input_tokens": 50,
                "output_tokens": 150
            },
            "stop_reason": "end_turn",
            "content": [
                {"type": "text", "text": "Greetings from Claude."}
            ]
        }

        # ACT
        result = InferenceMetadataExtractor.extract_anthropic(mock_response)

        # ASSERT
        assert result["model_name"] == "claude-3-5-sonnet"
        assert result["prompt_tokens"] == 50
        assert result["completion_tokens"] == 150
        assert result["text_output"] == "Greetings from Claude."
        assert result["estimated_cost_usd"] > 0

    def test_extract_system_telemetry(self):
        """
        Validates that system telemetry is captured correctly.
        """
        # ACT
        telemetry = InferenceMetadataExtractor.extract_system_telemetry(enable_full_recording=False)

        # ASSERT
        assert "cpu_percent" in telemetry
        assert "memory_percent" in telemetry
        assert "os_platform" in telemetry
        assert "git_commit_hash" in telemetry or "git_branch" in telemetry # Best effort

    def test_normalize_workflow(self):
        """
        Validates the unified normalization workflow.
        """
        # ARRANGE
        raw_data = {
            "model": "gpt-3.5-turbo",
            "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20}
        }

        # ACT
        normalized = InferenceMetadataExtractor.normalize(
            provider="openai",
            raw_data=raw_data,
            latency_ms=500.0
        )

        # ASSERT
        assert normalized["provider"] == "openai"
        assert normalized["latency_ms"] == 500.0
        assert normalized["tokens_per_second"] == 20.0 # (10 tokens / 0.5 sec)
        assert "environment" in normalized
