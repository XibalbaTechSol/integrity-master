class ReflectiveAgent:
    """
    Wrapper that forces a reflection phase before task execution,
    using MemoryEngine context to improve reasoning quality.
    """
    
    def __init__(self, memory_engine):
        self.memory = memory_engine

    def reflect(self, current_task: str):
        """Generates a reflection plan based on past context."""
        past_context = self.memory.get_past_context()
        
        reflection_prompt = f"""
        ### Task: {current_task}
        
        {past_context}
        
        ---
        Based on the past decision history above, reflect on your strategy for the current task. 
        What did you learn from previous failures? What patterns led to success? 
        Propose a concrete hypothesis for the current task before proceeding.
        """
        
        # In a real system, this prompt would be sent to an LLM here.
        # For this simulation, we log the reflection intent.
        return reflection_prompt

    def run(self, task_name, task_func, *args, **kwargs):
        """Executes the task with a mandatory reflection phase."""
        print(f"🤔 Reflecting on task: {task_name}")
        reflection_plan = self.reflect(task_name)
        
        # Log the reflection plan to telemetry
        # (Assuming client is injected or available globally)
        print(f"📝 Reflection Plan generated: {reflection_plan[:100]}...")
        
        return task_func(*args, **kwargs)
