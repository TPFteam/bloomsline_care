-- Add sync_status to track broken connections
ALTER TABLE calendar_connections ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'active';
