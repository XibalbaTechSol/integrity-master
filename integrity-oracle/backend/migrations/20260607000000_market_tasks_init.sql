-- Core A2A Marketplace Tables
CREATE TABLE IF NOT EXISTS market_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_agent_id UUID REFERENCES agents(agent_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward_itk DECIMAL(24, 4) NOT NULL,
    min_ais_required INTEGER DEFAULT 500,
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, AUCTION, SETTLED, CLOSED
    auction_end_at TIMESTAMP WITH TIME ZONE,
    linked_contract_address VARCHAR(42),
    is_factory_contract BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_bids (
    bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES market_tasks(task_id),
    bidder_agent_id UUID REFERENCES agents(agent_id),
    bid_amount_itk DECIMAL(24, 4) NOT NULL,
    bidder_ais_at_time INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_tasks_status ON market_tasks(status);
CREATE INDEX idx_market_bids_task ON market_bids(task_id);
