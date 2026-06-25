CREATE TABLE IF NOT EXISTS scoring_policies (
    domain_id VARCHAR(100) PRIMARY KEY,
    w_entropy DECIMAL(5, 4) NOT NULL,
    w_grounding DECIMAL(5, 4) NOT NULL,
    w_sacrifice DECIMAL(5, 4) NOT NULL,
    min_ais_required INTEGER NOT NULL,
    zk_boost_factor DECIMAL(5, 4) NOT NULL,
    w_compliance DECIMAL(5, 4)
);
