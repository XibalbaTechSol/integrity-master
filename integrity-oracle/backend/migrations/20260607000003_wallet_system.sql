-- 1. TOKEN BALANCES (On-chain Indexer Simulation)
CREATE TABLE IF NOT EXISTS token_balances (
    address VARCHAR(42) PRIMARY KEY,
    balance_itk DECIMAL(24, 4) DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TOKEN TRANSFERS (Audit Log)
CREATE TABLE IF NOT EXISTS token_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_itk DECIMAL(24, 4) NOT NULL,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_from ON token_transfers(from_address);
CREATE INDEX idx_transfers_to ON token_transfers(to_address);
