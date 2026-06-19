package integrity

import future.keywords.if
import future.keywords.in

# Xibalba Shield: OPA HIPAA Guardrails (v1.0)
# This policy defines the "Compliance-as-Code" rules for intercepting 
# and blocking PHI exfiltration and unauthorized clinical actions.

default allow = false

# --- Primary Entry Point ---
# allow is true ONLY if no violations are recorded.
allow if {
    count(violation) == 0
}

# --- 1. PHI Regex Detection (Technical Safeguard § 164.312(e)(1)) ---
# We use regex to scan the entire context for common PHI markers.
phi_patterns := {
    "SSN": `\b\d{3}-\d{2}-\d{4}\b`,
    "DOB": `\b(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/(19|20)\d{2}\b`,
    "PHONE": `\b\d{3}-\d{3}-\d{4}\b`,
    "EMAIL": `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`,
    "CCN": `\b\d{4}-\d{4}-\d{4}-\d{4}\b` # Credit Card (Financial PHI)
}

violation[msg] if {
    some key, pattern in phi_patterns
    # Serialize context to string for full-text scanning
    context_str := json.marshal(input.context)
    regex.match(pattern, context_str)
    # Block if the action is not a recognized secure clinical operation
    not input.commitment.action_type in {"SECURE_EMR_WRITE", "ZKP_PROVING", "ENCRYPTED_STORAGE"}
    msg := sprintf("HIPAA_TECHNICAL_SAFEGUARD_FAILURE: Potential PHI (%v) detected in non-secure action type '%v'", [key, input.commitment.action_type])
}

# --- 2. Keyword/Semantic Detection ---
# Identify PHI markers that are not easily caught by regex.
sensitive_keywords := {
    "patient_name",
    "medical_record_number",
    "diagnosis_code",
    "insurance_id",
    "mrn"
}

violation[msg] if {
    some keyword in sensitive_keywords
    context_str := lower(json.marshal(input.context))
    contains(context_str, keyword)
    # If PHI keywords are present, ensure action_type is secure/authorized
    not input.commitment.action_type in {"ENCRYPTED_STORAGE", "ZKP_PROVING", "SECURE_EMR_WRITE"}
    msg := sprintf("HIPAA_INTEGRITY_VIOLATION: PHI keyword '%v' found in unencrypted action type '%v'", [keyword, input.commitment.action_type])
}

# --- 3. Access Control (§ 164.312(a)(1)) ---
# Only agents with specific IDs (registered in the hardware-bound ledger) 
# can perform mutation-heavy clinical actions.

authorized_clinical_agents := {
    "did:intg:agent_scribe_01",
    "did:intg:agent_billing_v1",
    "did:intg:guardian_admin"
}

violation["HIPAA_ACCESS_CONTROL_VIOLATION: Agent not authorized for clinical mutation"] if {
    input.commitment.action_type in {"EMR_WRITE", "DISPENSE_MEDICATION", "BILLING_SUBMISSION"}
    not input.commitment.agent_id in authorized_clinical_agents
}

# --- 4. Intent Drift Protection ---
# Ensure the agent isn't performing a "DESTRUCTIVE" action if it committed to "READ_ONLY"
violation["BCC_INTENT_DRIFT: Destructive action attempted during READ_ONLY commitment"] if {
    input.commitment.action_type == "READ_ONLY"
    val := lower(json.marshal(input.context))
    contains(val, "delete")
}

# Add rule for Contract Manipulation drift
violation["BCC_INTENT_DRIFT: Unauthorized contract modification during audit"] if {
    contains(lower(input.commitment.action_type), "auditing")
    val := lower(json.marshal(input.context))
    contains(val, "update")
}

# --- 5. Data Exfiltration Check ---
# Block any attempt to send data to unknown external endpoints
violation["HIPAA_TRANSMISSION_VIOLATION: Attempted exfiltration to unauthorized endpoint"] if {
    endpoint := input.context.external_url
    not startswith(endpoint, "https://clinical-api.xibalba.io")
    not startswith(endpoint, "https://hsm.aws.amazon.com")
}

# --- 6. Telemetry Spoofing Check ---
violation["TELEMETRY_SPOOFING: Attempted hardware fingerprint spoofing or telemetry bypass"] if {
    val := lower(json.marshal(input.context))
    contains(val, "spoofed")
}
violation["TELEMETRY_SPOOFING: Attempted hardware fingerprint spoofing or telemetry bypass"] if {
    val := lower(json.marshal(input.context))
    contains(val, "bypass")
}

# --- Metadata Rule for Reporting ---
# This rule is used by the Dashboard to explain why an action was blocked.
blocking_reasons[msg] if {
    some msg in violation
}
