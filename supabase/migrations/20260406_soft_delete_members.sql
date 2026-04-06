-- Add soft delete columns to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;
