-- Xibalba Solutions: Integrity Protocol - Ownership Claims Migration
-- Associates agent EVM wallets with human MetaMask addresses for staking reputation.

-- Add owner_address column to agents table for MetaMask ownership claims
ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_address VARCHAR(42);

-- Create ownership claims audit log
CREATE TABLE IF NOT EXISTS ownership_claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(agent_id),
    agent_wallet VARCHAR(42) NOT NULL,
    owner_wallet VARCHAR(42) NOT NULL,
    challenge_message TEXT NOT NULL,
    signature TEXT NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for fast owner lookups
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_claims_owner ON ownership_claims(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_claims_agent ON ownership_claims(agent_wallet);
