-- Migration: Generalize compliance telemetry in transaction_logs
-- Removes specific HIPAA/Healthcare columns and replaces with a generic clearance bitmask.

ALTER TABLE transaction_logs 
DROP COLUMN IF EXISTS hipaa_eligible,
DROP COLUMN IF EXISTS external_web_access,
DROP COLUMN IF EXISTS region,
DROP COLUMN IF EXISTS api_domain_prefix,
DROP COLUMN IF EXISTS ekm_provider;

ALTER TABLE transaction_logs
ADD COLUMN IF NOT EXISTS clearance_flags INTEGER DEFAULT 0;
