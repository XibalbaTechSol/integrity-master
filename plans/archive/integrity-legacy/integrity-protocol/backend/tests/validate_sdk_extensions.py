import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure we can import the SDK
sys.path.append(os.path.join(os.getcwd(), 'sdk/python'))

from xibalba_integrity import (
    IntegrityClient, 
    IntegrityConfig, 
    AnthropicInterceptor, 
    LlamaIndexInterceptor
)
from xibalba_integrity.types import TelemetryEvent

class TestSDKExtensions(unittest.TestCase):
    def setUp(self):
        self.config = IntegrityConfig(
            agent_address="0xTestAgent",
            api_url="http://localhost:8001"
        )
        self.client = IntegrityClient(self.config)
        # Mock the network call in track_event if it were synchronous, 
        # but track_event just appends to a buffer.
        self.client.flush_telemetry = MagicMock(return_value={"status": "success"})

    def test_anthropic_interceptor(self):
        print("\n--- Testing Anthropic Interceptor ---")
        # 1. Mock the Anthropic client
        mock_anthropic = MagicMock()
        mock_response = MagicMock()
        mock_response.usage.input_tokens = 50
        mock_response.usage.output_tokens = 150
        mock_anthropic.messages.create.return_value = mock_response

        # 2. Wrap it
        interceptor = AnthropicInterceptor(self.client)
        tracked_anthropic = interceptor.wrap(mock_anthropic)

        # 3. Call it
        response = tracked_anthropic.messages.create(
            model="claude-3-opus",
            messages=[{"role": "user", "content": "test"}]
        )

        # 4. Verify telemetry was captured
        self.assertEqual(len(self.client._telemetry_buffer), 1)
        event = self.client._telemetry_buffer[0]
        self.assertEqual(event.model, "claude-3-opus")
        self.assertEqual(event.tokens_in, 50)
        self.assertEqual(event.tokens_out, 150)
        print("✅ Anthropic Interceptor: Successfully captured tokens and model.")

    def test_strict_provenance(self):
        print("\n--- Testing Strict Provenance Enforcement ---")
        self.config.strict_provenance = True
        # No private key set, so it should fail
        with self.assertRaises(ValueError) as cm:
            self.client.report_deal("deal_1", "0xPerf", 100, 50, 0.99)
        
        self.assertIn("Strict provenance requires a private key", str(cm.exception))
        print("✅ Strict Provenance: Correctly blocked unsigned payload.")

        # Now set a private key (randomly generated)
        from eth_account import Account
        acc = Account.create()
        self.config.private_key = acc.key.hex()
        
        # Should now succeed in signing (even if the network call fails later)
        # We mock the post request to avoid actual network calls
        with patch('requests.Session.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {"integrity_hash": "0xabc", "status": "SUCCESS"}
            
            result = self.client.report_deal("deal_2", "0xPerf", 100, 50, 0.99)
            self.assertEqual(result.status, "SUCCESS")
            
            # Check that signature was added to the payload
            args, kwargs = mock_post.call_args
            sent_payload = kwargs['json']
            self.assertIn("signature", sent_payload)
            self.assertIn("timestamp", sent_payload)
            print("✅ Strict Provenance: Successfully signed payload with private key.")

    def test_llamaindex_interceptor(self):
        print("\n--- Testing LlamaIndex Interceptor ---")
        
        # 1. Mock the entire module structure
        mock_callbacks = MagicMock()
        mock_event_type = MagicMock()
        mock_event_type.value = "query"
        mock_callbacks.CBEventType = mock_event_type
        mock_callbacks.BaseCallbackHandler = MagicMock
        
        with patch.dict('sys.modules', {
            'llama_index': MagicMock(), 
            'llama_index.core': MagicMock(), 
            'llama_index.core.callbacks': mock_callbacks
        }):
            interceptor = LlamaIndexInterceptor(self.client)
            handler = interceptor.handler()
            
            if handler is None:
                print("⚠️ LlamaIndex handler is None (Unexpected during mock).")
                # Fallback to manual trigger for the sake of the test if needed
                # but we want to know WHY it's None.
            else:
                handler.on_event_start(mock_event_type, event_id="ev_1")
                handler.on_event_end(mock_event_type, event_id="ev_1")

        self.assertGreaterEqual(len(self.client._telemetry_buffer), 1)
        print("✅ LlamaIndex Interceptor: Successfully captured event telemetry.")

if __name__ == "__main__":
    unittest.main()
