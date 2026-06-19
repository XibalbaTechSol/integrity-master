import time
from typing import Callable, Any, Dict, List, Optional
from integrity_sdk.client import IntegrityClient

class TrajectoryEvaluator:
    """
    Wraps agent execution to capture tool calls, file mutations, and final responses.
    Validates the captured trajectory against the pre-committed Behavioral Commitment Chain (BCC) intent.
    Inspired by LangChain/DeepAgents eval frameworks for high-trust observability.
    """
    def __init__(self, client: IntegrityClient, opa_policy_id: str = "default"):
        self.client = client
        self.opa_policy_id = opa_policy_id
        self.current_trajectory: List[Dict[str, Any]] = []

    def capture_tool_call(self, tool_name: str, arguments: Dict[str, Any], result: Any):
        """Hook to be called by the agent framework whenever a tool is invoked."""
        self.current_trajectory.append({
            "event_type": "tool_call",
            "tool_name": tool_name,
            "arguments": arguments,
            "result": result,
            "timestamp": time.time()
        })

    def capture_file_mutation(self, file_path: str, mutation_type: str, diff: Optional[str] = None):
        """Hook to capture file changes."""
        self.current_trajectory.append({
            "event_type": "file_mutation",
            "file_path": file_path,
            "mutation_type": mutation_type,
            "diff": diff,
            "timestamp": time.time()
        })

    def run_with_intent(self, intent_state: Dict[str, Any], action_type: str, agent_execution_func: Callable) -> Any:
        """
        1. Commit Intent
        2. Execute Agent
        3. Validate Trajectory against Intent
        """
        self.current_trajectory = []
        
        # Step 1: Pre-commit intent
        commitment = self.client.commit_action_intent(
            action_type=action_type,
            intended_state=intent_state,
            opa_policy_id=self.opa_policy_id
        )

        # Step 2: Execute Agent
        # The agent_execution_func should ideally call capture hooks during its run
        try:
            final_response = agent_execution_func()
        except Exception as e:
            self.current_trajectory.append({"event_type": "error", "error": str(e), "timestamp": time.time()})
            raise e
            
        # Add final response to trajectory
        self.current_trajectory.append({
            "event_type": "final_response",
            "response": final_response,
            "timestamp": time.time()
        })

        # Step 3: Validate Trajectory context against the BCC commitment
        execution_context = {
            "intent_state": intent_state,
            "captured_trajectory": self.current_trajectory,
            "total_steps": len(self.current_trajectory)
        }

        # The validate_and_execute method natively checks for BCC drift
        return self.client.validate_and_execute(
            commitment=commitment,
            actual_execution_context=execution_context,
            action_function=lambda: final_response
        )
