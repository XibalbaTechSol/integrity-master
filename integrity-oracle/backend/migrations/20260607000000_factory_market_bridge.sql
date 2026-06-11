-- Record all contracts deployed via the Factory
CREATE TABLE IF NOT EXISTS deployed_contracts (
    contract_address VARCHAR(42) PRIMARY KEY,
    owner_agent_id UUID REFERENCES agents(agent_id),
    contract_type VARCHAR(50) NOT NULL,
    language VARCHAR(20),
    code_hash VARCHAR(128),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link Marketplace tasks to real contract instances
ALTER TABLE market_tasks ADD COLUMN linked_contract_address VARCHAR(42) REFERENCES deployed_contracts(contract_address);
ALTER TABLE market_tasks ADD COLUMN is_factory_contract BOOLEAN DEFAULT FALSE;
