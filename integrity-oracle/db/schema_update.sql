-- Update agents table to support credit features
ALTER TABLE agents ADD COLUMN IF NOT EXISTS credit_line FLOAT8 DEFAULT 100000.0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS borrowed_amount FLOAT8 DEFAULT 0.0;

-- Create market_tasks if not exists (based on backend main.rs queries)
CREATE TABLE IF NOT EXISTS market_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    reward_itk FLOAT8 DEFAULT 0.0,
    min_ais_required INTEGER DEFAULT 300,
    status TEXT DEFAULT 'OPEN',
    creator_agent_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
