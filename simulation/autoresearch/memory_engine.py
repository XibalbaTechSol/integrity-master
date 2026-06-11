import json
import os

class MemoryEngine:
    """
    Retrieves and summarizes past reasoning steps from telemetry
    to provide context for future agent runs.
    """
    
    def __init__(self, telemetry_file: str = "agent_telemetry.jsonl"):
        self.telemetry_file = telemetry_file

    def get_past_context(self, limit: int = 5):
        """Retrieves the last N reasoning steps."""
        if not os.path.exists(self.telemetry_file):
            return "No previous reasoning history found."

        history = []
        with open(self.telemetry_file, "r") as f:
            for line in f:
                event = json.loads(line)
                if event['event_type'] == 'reasoning_step' and event['step'] in ['commit', 'revert']:
                    history.append(event)
        
        # Get last N
        relevant_history = history[-limit:]
        
        if not relevant_history:
            return "No previous decisions found."
            
        context = "### Past Decision History:\n"
        for event in relevant_history:
            status = "SUCCESS" if event['step'] == 'commit' else "FAILURE"
            context += f"- [{status}] Reason: {event['reasoning']}. Context: {event['context']}\n"
            
        return context
