"""
Standardized Semantic Conventions for the Integrity Protocol SDK.
Aligns with OpenTelemetry v1.41 GenAI conventions and ISO/IEC 11179.
"""

class GenAIAttributes:
    SYSTEM = "gen_ai.system"
    AGENT_NAME = "gen_ai.agent.name"
    OPERATION_NAME = "gen_ai.operation.name"
    
    REQUEST_MODEL = "gen_ai.request.model"
    RESPONSE_MODEL = "gen_ai.response.model"
    
    # Usage metrics
    INPUT_TOKENS = "gen_ai.usage.input_tokens"
    OUTPUT_TOKENS = "gen_ai.usage.output_tokens"
    
    # Execution metadata
    FINISH_REASONS = "gen_ai.response.finish_reasons"
    PROMPT = "gen_ai.content.prompt" # Custom but aligned
    COMPLETION = "gen_ai.content.completion" # Custom but aligned

class IntegrityAttributes:
    # Behavioral and Security Metrics
    ENTROPY = "integrity.behavior.entropy"
    GROUNDING = "integrity.behavior.grounding"
    
    # Host Metrics (Macroscopic)
    STORAGE_FLUX_RW_RATIO = "integrity.host.storage_flux.rw_ratio"
    ACCESS_PATH_ENTROPY = "integrity.host.storage_flux.path_entropy"
    DESTINATION_IP_ENTROPY = "integrity.host.network.ip_entropy"
    
    # Composite Signals (Correlation Layer)
    RECONNAISSANCE_RISK = "integrity.composite.recon_risk"
    COMPUTE_SUBSTITUTION = "integrity.composite.compute_spoof_risk"
    COGNITIVE_FATIGUE = "integrity.composite.cognitive_fatigue"
    LATERAL_MOVEMENT_PROB = "integrity.composite.lateral_movement_prob"
    ENERGY_EFFICIENCY = "integrity.composite.energy_efficiency"
    SEMANTIC_CONTRADICTION = "integrity.composite.semantic_contradiction"
    WORKSPACE_BLAST_RADIUS = "integrity.composite.blast_radius"
    
    # Compliance & Governance (HIPAA/Finance)
    COMPLIANCE_HIPAA_ELIGIBLE = "integrity.compliance.hipaa_eligible"
    COMPLIANCE_ZDR_ENABLED = "integrity.compliance.zdr_enabled"
    COMPLIANCE_EXTERNAL_WEB_ACCESS = "integrity.compliance.external_web_access"
    COMPLIANCE_DATA_RESIDENCY_REGION = "integrity.compliance.data_residency_region"
    COMPLIANCE_API_DOMAIN_PREFIX = "integrity.compliance.api_domain_prefix"
    COMPLIANCE_EKM_PROVIDER = "integrity.compliance.ekm_provider"
    
    # Identity (W3C DCAT / Dublin Core)
    DC_IDENTIFIER = "dc.identifier"
    DC_CREATOR = "dc.creator"
    DC_DATE = "dc.date"

def get_gen_ai_span_name(system: str, model: str) -> str:
    return f"{system} {model} inference"
