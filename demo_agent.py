import os
import sys
from dotenv import load_dotenv

# Optional: Disable LangChain's own tracing so we can clearly see the Integrity traces
os.environ["LANGCHAIN_TRACING_V2"] = "false"

# Add SDK path to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "integrity-sdk")))

from langchain_core.messages import HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration
from pydantic import Field
from typing import Any, List, Optional
from integrity_sdk.client import IntegrityClient
from integrity_sdk.integrations.langchain_callback import IntegrityLangChainCallback

class FakeChatModel(BaseChatModel):
    response: str = "Verifying AI execution traces on a blockchain is crucial because it creates an immutable, cryptographically secure audit trail that prevents tampering and proves the AI's reasoning process was not maliciously altered."
    
    @property
    def _llm_type(self) -> str:
        return "fake-chat-model"
        
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        message = AIMessage(content=self.response)
        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])

def run_demo():
    print("🚀 Initializing Integrity Protocol LangChain Hook...")
    
    # 1. Initialize the Core Integrity Client
    # In this demo, it simulates what the real Oracle backend looks at
    client = IntegrityClient(
        agent_id="testnet-demo-agent-01",
        oracle_url="http://localhost:8080", # Points to your Rust Axum server
        mode="production"
    )
    
    print(f"🛡️ Agent Identity Loaded: DID = {client.did}")
    print(f"🔗 Linked Wallet Address: {client.wallet_address}")

    # 2. Wrap the Callback Hook
    integrity_callback = IntegrityLangChainCallback(integrity_client=client)

    # 3. Initialize a Fake LLM so no API keys or local models are needed
    llm = FakeChatModel(
        callbacks=[integrity_callback]
    )
    
    print("\n🧠 Sending message to LLM via LangChain...")
    prompt = "Explain in one sentence why verifying AI execution traces on a blockchain is important."
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    print("\n✅ LLM Output:")
    print(response.content)
    
    print("\n📡 Telemetry and Traces successfully batched in the background.")
    print("⏳ Wait a moment for background flush to the Rust Oracle (5 seconds default).")
    
    import time
    time.sleep(6) # Let the async batcher flush to Oracle
    print("✨ Demo completed.")

if __name__ == "__main__":
    run_demo()
