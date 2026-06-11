-- Seed human controller balance
INSERT INTO token_balances (address, balance_itk) 
VALUES ('0x5B5670D93038406468E0FA2c9683bF1673DEDbf3', 1000000.0000)
ON CONFLICT (address) DO UPDATE SET balance_itk = 1000000.0000;

-- Seed agent balance
INSERT INTO token_balances (address, balance_itk) 
VALUES ('0xd62982a313FfA10966e76CD9dA11708Edbb01B3f', 50000.0000)
ON CONFLICT (address) DO UPDATE SET balance_itk = 50000.0000;
