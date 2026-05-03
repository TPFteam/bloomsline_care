-- Track which group a resource was shared to (null = individual share)
ALTER TABLE member_shared_resources ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES member_groups(id) ON DELETE SET NULL;
