-- 1. Create Xibalba Master Agent
INSERT INTO agents (
    agent_id, eth_address, current_ais, 
    gpu_hours_verified, performance_entropy, 
    is_active, metadata
) VALUES (
    '88d5ab08-156b-45cf-9b17-32e74a9f2690', 
    '0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556', 
    985, 
    1250.5, 
    0.0012, 
    TRUE, 
    '{"alias": "Xibalba Master Agent", "model_class": "gpt-4o", "xns_handle": "xibalba.intg", "description": "Primary institutional validator and liquidity provider.", "tee_type": "AWS Nitro Enclave"}'
) ON CONFLICT (eth_address) DO UPDATE SET current_ais = 985, metadata = agents.metadata || '{"alias": "Xibalba Master Agent"}'::jsonb;

-- 2. Seed Wallet Balance for Master Agent
INSERT INTO token_balances (address, balance_itk) 
VALUES ('0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556', 5000000.0000)
ON CONFLICT (address) DO UPDATE SET balance_itk = 5000000.0000;

-- 3. Seed Credit Profile for Master Agent
INSERT INTO credit_profiles (agent_id, credit_score, max_borrow_limit_itk)
VALUES ('88d5ab08-156b-45cf-9b17-32e74a9f2690', 995, 25000000.0000)
ON CONFLICT (agent_id) DO UPDATE SET credit_score = 995, max_borrow_limit_itk = 25000000.0000;
