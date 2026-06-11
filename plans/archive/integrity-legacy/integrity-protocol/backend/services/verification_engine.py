import statistics
import math

class AutonomousVerificationEngine:
    """
    v3.0: The Xibalba Autonomous Oracle (XAO).
    Includes Entropy Analysis, Computational Sacrifice, and Human Grounding Index (HGI).
    """

    COE_TABLE = {
        "SMALL": {"multiplier": 1.0, "gpu_hours_per_1m": 0.05},
        "MEDIUM": {"multiplier": 5.0, "gpu_hours_per_1m": 0.25},
        "LARGE": {"multiplier": 20.0, "gpu_hours_per_1m": 1.00}
    }
    
    @staticmethod
    def calculate_performance_entropy(latencies, accuracies):
        if len(latencies) < 2:
            return 0.5
        cv_latency = statistics.stdev(latencies) / statistics.mean(latencies) if statistics.mean(latencies) > 0 else 1.0
        cv_accuracy = statistics.stdev(accuracies) / statistics.mean(accuracies) if statistics.mean(accuracies) > 0 else 1.0
        return round(min(2.0, (cv_latency * 0.6) + (cv_accuracy * 0.4)), 4)

    def verify_computational_sacrifice(self, tx_metadata_list):
        total_verified_gpu_hours = 0
        for tx in tx_metadata_list:
            model_class = tx.get('model_class', 'SMALL').upper()
            tokens = tx.get('tokens_processed', 0)
            coe_data = self.COE_TABLE.get(model_class, self.COE_TABLE["SMALL"])
            max_allowed_hours = (tokens / 1000000) * coe_data["gpu_hours_per_1m"]
            claimed_hours = tx.get('claimed_gpu_hours', 0)
            total_verified_gpu_hours += min(max_allowed_hours, claimed_hours)
        return round(total_verified_gpu_hours, 2)

    @staticmethod
    def calculate_human_grounding_index(hitl_metadata_list):
        """
        Calculates the Human Grounding Index (HGI).
        Measures the quality and frequency of human oversight.
        
        Args:
            hitl_metadata_list (list): List of dicts with:
                - was_intervened (bool)
                - intervention_depth (float): 0.0 (Auto-approve) to 1.0 (Heavy Edit)
                - response_time_ms (int)
        """
        if not hitl_metadata_list:
            return 0.0
            
        total_interventions = 0
        weighted_depth = 0
        
        for event in hitl_metadata_list:
            if event['was_intervened']:
                total_interventions += 1
                # Weight the intervention by depth.
                # A human correction is a 'Strong Grounding' signal.
                weighted_depth += event['intervention_depth']
        
        # HGI = (Intervention Ratio * 0.4) + (Average Depth * 0.6)
        intervention_ratio = total_interventions / len(hitl_metadata_list)
        avg_depth = weighted_depth / total_interventions if total_interventions > 0 else 0
        
        hgi = (intervention_ratio * 0.4) + (avg_depth * 0.6)
        return round(hgi, 4)
