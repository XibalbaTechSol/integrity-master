INSERT INTO stability_benchmarks (model_name, provider_name, simulated_ais, stability_metric, grounding_metric) VALUES 
('GPT-4o', 'OpenAI', 982, 0.994, 0.981),
('Claude 3.5 Sonnet', 'Anthropic', 978, 0.991, 0.985),
('Gemini 1.5 Pro', 'Google', 965, 0.978, 0.962);

DO $$
DECLARE
    v_agent_id UUID;
BEGIN
    SELECT agent_id INTO v_agent_id FROM agents LIMIT 1;
    IF v_agent_id IS NOT NULL THEN
        INSERT INTO provenance_logs (agent_id, action, input_hash, output_hash, model_used) VALUES 
        (v_agent_id, 'SLA_EVALUATION', '0x1a2b3c4d5e6f7g8h9i0j', '0x0j9i8h7g6f5e4d3c2b1a', 'Claude 3.5 Sonnet'),
        (v_agent_id, 'A2A_HANDSHAKE', '0xabc123def456abc123def', '0xdef456abc123def456abc', 'Xibalba Internal TEE');
    END IF;
END $$;
