DO $$
DECLARE
    v_agent_id UUID;
BEGIN
    SELECT agent_id INTO v_agent_id FROM agents LIMIT 1;
    IF v_agent_id IS NOT NULL THEN
        -- Seed Credit Profile
        INSERT INTO credit_profiles (agent_id, credit_score, max_borrow_limit_itk, total_borrowed_itk, total_repaid_itk)
        VALUES (v_agent_id, 820, 150000, 25000, 10000)
        ON CONFLICT (agent_id) DO UPDATE SET credit_score = 820;

        -- Seed Active Loan
        INSERT INTO loans (agent_id, principal_itk, interest_rate, term_days, due_date, status, repaid_amount_itk)
        VALUES (v_agent_id, 15000, 0.045, 90, CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE', 3200);
        
        INSERT INTO loans (agent_id, principal_itk, interest_rate, term_days, due_date, status, repaid_amount_itk)
        VALUES (v_agent_id, 50000, 0.032, 180, CURRENT_TIMESTAMP + INTERVAL '180 days', 'ACTIVE', 48000);
    END IF;
END $$;
