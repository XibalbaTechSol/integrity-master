-- Xibalba Solutions: Integrity Protocol - Off-Chain Database Schema (v2.0 - Rust Port)
-- This database tracks granular AI performance for the AIS Scoring Engine.

-- 1. AGENTS TABLE: Core registry for all participating AI entities.
CREATE TABLE IF NOT EXISTS agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eth_address VARCHAR(42) UNIQUE NOT NULL, -- On-chain identity
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- For Temporal Entropy
    current_ais INTEGER DEFAULT 0,          -- Calculated by Scoring Engine
    last_audit_id UUID,                     -- Reference to latest Xibalba Audit
    gpu_hours_verified DECIMAL(10, 2) DEFAULT 0, -- Sunk Cost (Energy)
    performance_entropy DECIMAL(5, 4) DEFAULT 0, -- Measure of disorder (0.0 - 1.0+)
    penalty_points DECIMAL(3, 2) DEFAULT 0, -- Reputation Slashing (0.0 - 1.0)
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB                          -- Flexible field for agent type, model name, etc.
);

-- 2. TRANSACTIONS TABLE: Detailed logs of contract completions.
CREATE TABLE IF NOT EXISTS transaction_logs (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(agent_id),
    on_chain_tx_hash VARCHAR(66) UNIQUE NOT NULL, -- The hash on the Ethereum ledger
    contract_value_intg DECIMAL(24, 18),         -- Amount transacted in ITK
    staked_amount_intg DECIMAL(24, 18),          -- Collateral at time of transaction
    success BOOLEAN NOT NULL,                     -- Was the contract fulfilled?
    completion_time_ms INTEGER,                   -- Performance metric: latency
    data_quality_score DECIMAL(3, 2),             -- Performance metric: accuracy (0.0 - 1.0)
    verified_by_xibalba BOOLEAN DEFAULT FALSE,    -- Has Xibalba validated this specific hash?
    provider_metadata JSONB,                      -- Commitment from Agent
    customer_metadata JSONB,                      -- Receipt from Customer
    dispute_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RESOLVED, SLASHED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AUDITS TABLE: High-value verification services provided by Xibalba Solutions.
CREATE TABLE IF NOT EXISTS xibalba_audits (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(agent_id),
    audit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    audit_type VARCHAR(20) CHECK (audit_type IN ('AUTOMATED', 'MANUAL_DEEP_DIVE', 'PLATINUM')),
    verification_score DECIMAL(3, 2) NOT NULL, -- Input for W_XIBALBA (0.0 - 1.0)
    verification_fee_paid_tx_hash VARCHAR(66), -- Link to fee payment on-chain
    notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE         -- Audits should be renewed periodically
);

-- 4. AGENT_DAILY_SNAPSHOTS: Efficiently track "Pulse" and growth over time.
CREATE TABLE IF NOT EXISTS agent_daily_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(agent_id),
    snapshot_date DATE NOT NULL,
    tx_count_24h INTEGER DEFAULT 0,            -- Daily frequency
    ais_at_snapshot INTEGER,                   -- Historical score tracking
    UNIQUE (agent_id, snapshot_date)
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_agents_eth_address ON agents(eth_address);
CREATE INDEX IF NOT EXISTS idx_tx_logs_agent_id ON transaction_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_tx_logs_hash ON transaction_logs(on_chain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_audits_agent_id ON xibalba_audits(agent_id);
