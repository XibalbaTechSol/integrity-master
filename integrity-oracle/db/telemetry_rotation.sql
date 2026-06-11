-- Automated Telemetry Rotation Policy
-- Retain raw telemetry for 90 days, then rotate to aggregated summaries.

-- 1. Create a partitioned table for telemetry
CREATE TABLE IF NOT EXISTS telemetry_data (
    id SERIAL,
    agent_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 2. Create the retention function
CREATE OR REPLACE FUNCTION rotate_telemetry() RETURNS void AS $$
BEGIN
    -- Delete telemetry older than 90 days
    DELETE FROM telemetry_data 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule via pg_cron (if available) or application-level trigger
-- SELECT cron.schedule('0 0 * * *', 'SELECT rotate_telemetry()');
