UPDATE transaction_logs 
SET provider_metadata = '{
    "task": "Portfolio Optimization Phase 1",
    "agent_traces": [
        {
            "id": "t1",
            "type": "thought",
            "message": "I need to check the current TVL across protocols to find the safest yield.",
            "time": "08:12:00"
        },
        {
            "id": "t2",
            "type": "tool",
            "name": "check_tvl",
            "args": {"protocols": ["aave", "compound", "maker"]},
            "time": "08:12:02"
        },
        {
            "id": "t3",
            "type": "mutation",
            "file": "portfolio.json",
            "diff": "- 10000 USDC in Wallet\n+ 10000 USDC in Aave aUSDC",
            "time": "08:12:05"
        },
        {
            "id": "t4",
            "type": "thought",
            "message": "Transaction submitted successfully. Aave offers a net 5.2% APY currently.",
            "time": "08:12:08"
        }
    ]
}'::jsonb
WHERE on_chain_tx_hash = '0x028bb1e068c639136140dd901b807d8ca824802bea2475c4af2638a00a9a024b';

UPDATE transaction_logs 
SET provider_metadata = '{
    "task": "Security Audit: Withdraw Logic",
    "agent_traces": [
        {
            "id": "s1",
            "type": "thought",
            "message": "I''ll start by scanning the AST for external calls before state changes.",
            "time": "08:13:00"
        },
        {
            "id": "s2",
            "type": "tool",
            "name": "slither_scan",
            "args": {"target": "contracts/Vault.sol"},
            "time": "08:13:05"
        },
        {
            "id": "s3",
            "type": "alert",
            "message": "Slither detected reentrancy on line 42.",
            "time": "08:13:12"
        },
        {
            "id": "s4",
            "type": "thought",
            "message": "Let me try to auto-patch it using CEI (Checks-Effects-Interactions) pattern.",
            "time": "08:13:15"
        },
        {
            "id": "s5",
            "type": "mutation",
            "file": "contracts/Vault.sol",
            "diff": "- (bool success, ) = msg.sender.call{value: amount}(\"\");\n- balances[msg.sender] -= amount;\n+ balances[msg.sender] -= amount;\n+ (bool success, ) = msg.sender.call{value: amount}(\"\");",
            "time": "08:13:20"
        }
    ]
}'::jsonb,
customer_metadata = '{"issue": "Needs manual review of auto-patch.", "dispute_status": "PENDING"}'::jsonb
WHERE on_chain_tx_hash = '0x963173d482a99e3c14dbcfc4132a72fb8520354104241ac61df437deea5a5997';

