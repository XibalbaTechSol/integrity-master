-- =============================================================================
-- FULL SCHEMA SEED: "Apex Validator" - Test Agent (Tier 3, All Tables Covered)
-- Run: PGPASSWORD=integrity_secret_123 psql -U xibalba_admin -h localhost -p 5432 -d integrity_protocol -f seed_full_agent.sql
-- =============================================================================

-- Use a deterministic UUID so this script is idempotent
-- Agent:         a9e40000-0000-0000-0000-000000000001
-- Owner wallet:  0xDeAdBeEf000000000000000000000000DEADbEEf
-- Agent wallet:  0xApEx000000000000000000000000000000000001

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. AGENTS
-- ---------------------------------------------------------------------------
INSERT INTO agents (
    agent_id,
    eth_address,
    registration_date,
    last_active_at,
    current_ais,
    gpu_hours_verified,
    performance_entropy,
    penalty_points,
    is_active,
    metadata,
    owner_address,
    staked_itk,
    insurance_pool_contribution
) VALUES (
    'a9e40000-0000-0000-0000-000000000001',
    '0xA9E4000000000000000000000000000000000001',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '2 hours',
    975,
    3820.75,
    0.0035,
    0.00,
    TRUE,
    '{
        "alias":           "Apex_Validator",
        "model_class":     "claude-opus-4",
        "xns_handle":      "apex.intg",
        "description":     "Full-coverage institutional validator for schema validation and QA.",
        "tee_type":        "AWS Nitro Enclave",
        "owner_uid":       "user_test_001",
        "grounding_score": 912,
        "staked_amount_itk": 2400.0,
        "verification_tier": 3
    }',
    '0xDeAdBeEf000000000000000000000000DeAdBeEf',
    2400.0000,
    240.0000
) ON CONFLICT (eth_address) DO UPDATE SET
    current_ais               = EXCLUDED.current_ais,
    gpu_hours_verified        = EXCLUDED.gpu_hours_verified,
    performance_entropy       = EXCLUDED.performance_entropy,
    staked_itk                = EXCLUDED.staked_itk,
    insurance_pool_contribution = EXCLUDED.insurance_pool_contribution,
    metadata                  = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- 2. TOKEN_BALANCES  (agent wallet + owner wallet)
-- ---------------------------------------------------------------------------
INSERT INTO token_balances (address, balance_itk, last_updated_at) VALUES
    ('0xA9E4000000000000000000000000000000000001', 125000.0000, NOW()),
    ('0xDeAdBeEf000000000000000000000000DeAdBeEf', 50000.0000,  NOW())
ON CONFLICT (address) DO UPDATE SET
    balance_itk    = EXCLUDED.balance_itk,
    last_updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 3. TOKEN_TRANSFERS  (3 historical movements)
-- ---------------------------------------------------------------------------
INSERT INTO token_transfers (transfer_id, from_address, to_address, amount_itk, tx_hash, created_at) VALUES
    (gen_random_uuid(), '0xDeAdBeEf000000000000000000000000DeAdBeEf', '0xA9E4000000000000000000000000000000000001', 100000.0000, '0xaabb000000000000000000000000000000000000000000000000000000001111', NOW() - INTERVAL '89 days'),
    (gen_random_uuid(), '0xA9E4000000000000000000000000000000000001', '0x0000000000000000000000000000000000000000', 2400.0000,   '0xaabb000000000000000000000000000000000000000000000000000000002222', NOW() - INTERVAL '88 days'),
    (gen_random_uuid(), '0x0000000000000000000000000000000000000000', '0xA9E4000000000000000000000000000000000001', 27400.0000,  '0xaabb000000000000000000000000000000000000000000000000000000003333', NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. XIBALBA_AUDITS  (one of each type)
-- ---------------------------------------------------------------------------
INSERT INTO xibalba_audits (audit_id, agent_id, audit_date, audit_type, verification_score, verification_fee_paid_tx_hash, notes, expires_at) VALUES
    (
        'a9e40000-0000-0000-0001-000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '60 days',
        'AUTOMATED',
        0.88,
        '0xaabb000000000000000000000000000000000000000000000000000000004444',
        'Initial automated onboarding audit. All vectors passed.',
        NOW() + INTERVAL '305 days'
    ),
    (
        'a9e40000-0000-0000-0001-000000000002',
        'a9e40000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '30 days',
        'MANUAL_DEEP_DIVE',
        0.94,
        '0xaabb000000000000000000000000000000000000000000000000000000005555',
        'Manual review of TEE attestation and grounding benchmarks. Score upgraded.',
        NOW() + INTERVAL '335 days'
    ),
    (
        'a9e40000-0000-0000-0001-000000000003',
        'a9e40000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '5 days',
        'PLATINUM',
        0.98,
        '0xaabb000000000000000000000000000000000000000000000000000000006666',
        'Platinum institutional audit. ZK proof verified. Cleared for all market tiers.',
        NOW() + INTERVAL '360 days'
    )
ON CONFLICT DO NOTHING;

-- Update last_audit_id on agent record
UPDATE agents
SET last_audit_id = 'a9e40000-0000-0000-0001-000000000003'
WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- 5. TRANSACTION_LOGS  (4 transactions: 3 success, 1 disputed)
-- ---------------------------------------------------------------------------
INSERT INTO transaction_logs (
    transaction_id, agent_id, on_chain_tx_hash, contract_value_intg, staked_amount_intg,
    success, completion_time_ms, data_quality_score, verified_by_xibalba,
    provider_metadata, customer_metadata, dispute_status, created_at,
    zdr_enabled, clearance_flags
) VALUES
    (
        'a9e40000-0000-0000-0002-000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        '0xbbcc000000000000000000000000000000000000000000000000000000000011',
        500.000000000000000000, 2400.000000000000000000, TRUE, 142, 0.97, TRUE,
        '{"task": "data_labeling", "rows_processed": 10000, "model": "claude-opus-4"}',
        '{"confirmed": true, "satisfaction": 5, "reviewer": "user_abc"}',
        'RESOLVED', NOW() - INTERVAL '45 days', TRUE, 7
    ),
    (
        'a9e40000-0000-0000-0002-000000000002',
        'a9e40000-0000-0000-0000-000000000001',
        '0xbbcc000000000000000000000000000000000000000000000000000000000022',
        1200.000000000000000000, 2400.000000000000000000, TRUE, 88, 0.99, TRUE,
        '{"task": "code_review", "files": 42, "model": "claude-opus-4"}',
        '{"confirmed": true, "satisfaction": 5, "reviewer": "user_xyz"}',
        'RESOLVED', NOW() - INTERVAL '20 days', FALSE, 3
    ),
    (
        'a9e40000-0000-0000-0002-000000000003',
        'a9e40000-0000-0000-0000-000000000001',
        '0xbbcc000000000000000000000000000000000000000000000000000000000033',
        800.000000000000000000, 2400.000000000000000000, FALSE, 5200, 0.41, FALSE,
        '{"task": "inference_batch", "items": 500, "model": "claude-opus-4"}',
        '{"confirmed": false, "issue": "Latency SLA breach. Output degraded."}',
        'PENDING', NOW() - INTERVAL '10 days', TRUE, 15
    ),
    (
        'a9e40000-0000-0000-0002-000000000004',
        'a9e40000-0000-0000-0000-000000000001',
        '0xbbcc000000000000000000000000000000000000000000000000000000000044',
        2500.000000000000000000, 2400.000000000000000000, TRUE, 201, 0.96, TRUE,
        '{"task": "financial_analysis", "reports": 12, "model": "claude-opus-4"}',
        '{"confirmed": true, "satisfaction": 5, "reviewer": "user_fin01"}',
        'RESOLVED', NOW() - INTERVAL '3 days', FALSE, 5
    )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. AGENT_DAILY_SNAPSHOTS  (30 days of AIS history)
-- ---------------------------------------------------------------------------
INSERT INTO agent_daily_snapshots (agent_id, snapshot_date, tx_count_24h, ais_at_snapshot)
SELECT
    'a9e40000-0000-0000-0000-000000000001',
    (CURRENT_DATE - (30 - generate_series)::INTEGER),
    (3 + (generate_series % 5)),
    (920 + generate_series * 2)
FROM generate_series(0, 29)
ON CONFLICT (agent_id, snapshot_date) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. PROVENANCE_LOGS  (3 action records)
-- ---------------------------------------------------------------------------
INSERT INTO provenance_logs (log_id, agent_id, action, input_hash, output_hash, model_used, created_at) VALUES
    (gen_random_uuid(), 'a9e40000-0000-0000-0000-000000000001', 'data_labeling_batch',    'sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 'sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3', 'claude-opus-4', NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), 'a9e40000-0000-0000-0000-000000000001', 'code_review_execution',  'sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4', 'sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5', 'claude-opus-4', NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), 'a9e40000-0000-0000-0000-000000000001', 'financial_analysis_run', 'sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6', 'sha256:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7', 'claude-opus-4', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. CREDIT_PROFILES
-- ---------------------------------------------------------------------------
INSERT INTO credit_profiles (agent_id, credit_score, max_borrow_limit_itk, total_borrowed_itk, total_repaid_itk, default_count, updated_at)
VALUES (
    'a9e40000-0000-0000-0000-000000000001',
    940,
    50000.0000,
    15000.0000,
    12500.0000,
    0,
    NOW()
) ON CONFLICT (agent_id) DO UPDATE SET
    credit_score          = EXCLUDED.credit_score,
    max_borrow_limit_itk  = EXCLUDED.max_borrow_limit_itk,
    total_borrowed_itk    = EXCLUDED.total_borrowed_itk,
    total_repaid_itk      = EXCLUDED.total_repaid_itk,
    default_count         = EXCLUDED.default_count,
    updated_at            = NOW();

-- ---------------------------------------------------------------------------
-- 9. LOANS  (1 active, 1 repaid)
-- ---------------------------------------------------------------------------
INSERT INTO loans (loan_id, agent_id, principal_itk, interest_rate, repaid_amount_itk, term_days, status, due_date, created_at) VALUES
    (
        'a9e40000-0000-0000-0003-000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        10000.0000, 0.0350, 0.0000, 90,
        'ACTIVE',
        NOW() + INTERVAL '60 days',
        NOW() - INTERVAL '30 days'
    ),
    (
        'a9e40000-0000-0000-0003-000000000002',
        'a9e40000-0000-0000-0000-000000000001',
        5000.0000, 0.0275, 5137.5000, 30,
        'REPAID',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '40 days'
    )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. DEPLOYED_CONTRACTS
-- ---------------------------------------------------------------------------
INSERT INTO deployed_contracts (contract_address, owner_agent_id, contract_type, language, code_hash, status, created_at) VALUES
    (
        '0xC0dE000000000000000000000000000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        'escrow',
        'Solidity',
        'keccak256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        'active',
        NOW() - INTERVAL '45 days'
    ),
    (
        '0xC0dE000000000000000000000000000000000002',
        'a9e40000-0000-0000-0000-000000000001',
        'sla_enforcer',
        'Rust',
        'keccak256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        'active',
        NOW() - INTERVAL '20 days'
    )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11. MARKET_TASKS  (2 tasks created by the agent)
-- ---------------------------------------------------------------------------
INSERT INTO market_tasks (task_id, creator_agent_id, title, description, reward_itk, min_ais_required, status, auction_end_at, linked_contract_address, is_factory_contract, created_at) VALUES
    (
        'a9e40000-0000-0000-0004-000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        'LLM Grounding Benchmark Suite',
        'Requires an agent to execute 500 adversarial prompts against a target model and return structured grounding scores. Min AIS 700 required.',
        750.0000, 700, 'AUCTION',
        NOW() + INTERVAL '2 days',
        '0xC0dE000000000000000000000000000000000001',
        TRUE,
        NOW() - INTERVAL '5 days'
    ),
    (
        'a9e40000-0000-0000-0004-000000000002',
        'a9e40000-0000-0000-0000-000000000001',
        'Financial Report Parsing Pipeline',
        'Extract structured financial KPIs from 200 quarterly PDF reports. Deliver as JSON with confidence scores.',
        1200.0000, 800, 'SETTLED',
        NOW() - INTERVAL '3 days',
        '0xC0dE000000000000000000000000000000000002',
        TRUE,
        NOW() - INTERVAL '10 days'
    )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 12. MARKET_BIDS  (2 bids on the apex agent's open task)
-- ---------------------------------------------------------------------------
INSERT INTO market_bids (bid_id, task_id, bidder_agent_id, bid_amount_itk, bidder_ais_at_time, status, created_at) VALUES
    (
        gen_random_uuid(),
        'a9e40000-0000-0000-0004-000000000001',
        '88d5ab08-156b-45cf-9b17-32e74a9f2690',
        740.0000, 820, 'PENDING',
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        'a9e40000-0000-0000-0004-000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        725.0000, 880, 'PENDING',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 13. OWNERSHIP_CLAIMS
-- ---------------------------------------------------------------------------
INSERT INTO ownership_claims (claim_id, agent_id, agent_wallet, owner_wallet, challenge_message, signature, claimed_at, is_active) VALUES
    (
        'a9e40000-0000-0000-0005-000000000001',
        'a9e40000-0000-0000-0000-000000000001',
        '0xA9E4000000000000000000000000000000000001',
        '0xDeAdBeEf000000000000000000000000DeAdBeEf',
        'Integrity Protocol: I claim ownership of agent a9e40000-0000-0000-0000-000000000001 at nonce 1750000000',
        '0x4a6f686e000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000dead',
        NOW() - INTERVAL '89 days',
        TRUE
    )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 14. STABILITY_BENCHMARKS  (baseline for this model)
-- ---------------------------------------------------------------------------
INSERT INTO stability_benchmarks (benchmark_id, model_name, provider_name, simulated_ais, stability_metric, grounding_metric, created_at) VALUES
    (gen_random_uuid(), 'claude-opus-4',   'Anthropic',    975, 0.9820, 0.9650, NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), 'gpt-4o',          'OpenAI',       940, 0.9710, 0.9480, NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), 'gemini-2.5-pro',  'Google',       960, 0.9780, 0.9600, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

COMMIT;

-- Verify all rows inserted
SELECT 'agents'               AS tbl, COUNT(*) FROM agents               WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'token_balances',                COUNT(*) FROM token_balances       WHERE address LIKE '%apex%' OR address LIKE '%dead%'
UNION ALL
SELECT 'token_transfers',               COUNT(*) FROM token_transfers      WHERE from_address LIKE '%dead%' OR to_address LIKE '%apex%'
UNION ALL
SELECT 'xibalba_audits',                COUNT(*) FROM xibalba_audits       WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'transaction_logs',              COUNT(*) FROM transaction_logs     WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'agent_daily_snapshots',         COUNT(*) FROM agent_daily_snapshots WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'provenance_logs',               COUNT(*) FROM provenance_logs      WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'credit_profiles',               COUNT(*) FROM credit_profiles      WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'loans',                         COUNT(*) FROM loans                WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'deployed_contracts',            COUNT(*) FROM deployed_contracts   WHERE owner_agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'market_tasks',                  COUNT(*) FROM market_tasks         WHERE creator_agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'market_bids',                   COUNT(*) FROM market_bids          WHERE task_id IN ('a9e40000-0000-0000-0004-000000000001','a9e40000-0000-0000-0004-000000000002')
UNION ALL
SELECT 'ownership_claims',              COUNT(*) FROM ownership_claims     WHERE agent_id = 'a9e40000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'stability_benchmarks',          COUNT(*) FROM stability_benchmarks WHERE model_name = 'claude-opus-4';
