-- Migration: Add compliance telemetry columns to transaction_logs
ALTER TABLE transaction_logs 
ADD COLUMN IF NOT EXISTS hipaa_eligible BOOLEAN,
ADD COLUMN IF NOT EXISTS zdr_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS external_web_access BOOLEAN,
ADD COLUMN IF NOT EXISTS region VARCHAR(50),
ADD COLUMN IF NOT EXISTS api_domain_prefix VARCHAR(100),
ADD COLUMN IF NOT EXISTS ekm_provider VARCHAR(50);
