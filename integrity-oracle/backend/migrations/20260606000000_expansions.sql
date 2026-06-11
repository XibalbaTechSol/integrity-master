-- 1. STAKING & SLASHING
ALTER TABLE agents ADD COLUMN staked_itk DECIMAL(24, 4) DEFAULT 0;
ALTER TABLE agents ADD COLUMN insurance_pool_contribution DECIMAL(24, 4) DEFAULT 0;

-- 2. FORENSIC PROVENANCE EXPLORER
CREATE TABLE IF NOT EXISTS provenance_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(agent_id),
    action VARCHAR(255) NOT NULL,
    input_hash VARCHAR(128) NOT NULL,
    output_hash VARCHAR(128) NOT NULL,
    model_used VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_provenance_agent ON provenance_logs(agent_id);

-- 3. STABILITY BENCHMARKS
CREATE TABLE IF NOT EXISTS stability_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(128) NOT NULL,
    provider_name VARCHAR(128) NOT NULL,
    simulated_ais INTEGER NOT NULL,
    stability_metric DECIMAL(5, 4) NOT NULL, -- 0.0 to 100.0 representations
    grounding_metric DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
