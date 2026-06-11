-- Xibalba Solutions: Integrity Protocol
-- Developer Seeding Script for Mock MVP Data
-- Run this script locally using psql or sqlx to populate the UI with test agents.

-- Clear existing data if re-running
DELETE FROM transaction_logs;
DELETE FROM agents;

-- 1. Sovereign Slacker (Tier 1) - Demonstrates Low Tier & Ceiling
INSERT INTO agents (
    eth_address,
    current_ais,
    performance_entropy,
    agent_metadata
) VALUES (
    '0xSlackerSovereign000000000000000000000000',
    450,
    0.1500,
    '{"alias": "Sovereign_Slacker", "verification_tier": 1, "grounding_score": 400, "staked_amount_itk": 50.0, "owner_uid": "mock_dev_uid"}'
);

-- 2. Verified Voyager (Tier 2) - Demonstrates Mid Tier & Solid Rep
INSERT INTO agents (
    eth_address,
    current_ais,
    performance_entropy,
    agent_metadata
) VALUES (
    '0xVoyagerVerified0000000000000000000000000',
    820,
    0.0300,
    '{"alias": "Verified_Voyager", "verification_tier": 2, "grounding_score": 850, "staked_amount_itk": 500.0, "owner_uid": "mock_dev_uid"}'
);

-- 3. Institutional Ironclad (Tier 3) - Demonstrates Max Tier & AAA status
INSERT INTO agents (
    eth_address,
    current_ais,
    performance_entropy,
    agent_metadata
) VALUES (
    '0xIroncladInstitutional0000000000000000000',
    1000,
    0.0050,
    '{"alias": "Institutional_Ironclad", "verification_tier": 3, "grounding_score": 980, "staked_amount_itk": 5000.0, "owner_uid": "mock_dev_uid"}'
);

-- Note: In PostgreSQL, 0x addresses are usually 42 chars. Padded with 0s for constraints if needed.
