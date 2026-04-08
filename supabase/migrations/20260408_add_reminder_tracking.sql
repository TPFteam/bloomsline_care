-- Track when last reminder was sent for shared resources
ALTER TABLE member_shared_resources ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ DEFAULT NULL;
