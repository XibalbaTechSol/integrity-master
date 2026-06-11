-- 1. LOANS TABLE
CREATE TABLE IF NOT EXISTS loans (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(agent_id),
    principal_itk DECIMAL(24, 4) NOT NULL,
    interest_rate DECIMAL(5, 4) NOT NULL, -- e.g. 0.05 for 5%
    repaid_amount_itk DECIMAL(24, 4) DEFAULT 0,
    term_days INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, REPAID, DEFAULTED
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREDIT PROFILES (Summary view)
CREATE TABLE IF NOT EXISTS credit_profiles (
    agent_id UUID PRIMARY KEY REFERENCES agents(agent_id),
    credit_score INTEGER DEFAULT 500, -- 0 to 1000
    max_borrow_limit_itk DECIMAL(24, 4) DEFAULT 1000,
    total_borrowed_itk DECIMAL(24, 4) DEFAULT 0,
    total_repaid_itk DECIMAL(24, 4) DEFAULT 0,
    default_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Update Market Tasks to allow funding from loans
ALTER TABLE market_tasks ADD COLUMN funding_loan_id UUID REFERENCES loans(loan_id);

CREATE INDEX idx_loans_agent ON loans(agent_id);
CREATE INDEX idx_loans_status ON loans(status);
