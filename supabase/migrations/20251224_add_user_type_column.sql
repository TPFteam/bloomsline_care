-- Add user_type column to existing early_access_waitlist table
ALTER TABLE early_access_waitlist
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('member', 'practitioner', 'both'));

-- Set default for existing rows (if any)
UPDATE early_access_waitlist
SET user_type = 'member'
WHERE user_type IS NULL;

-- Now make it NOT NULL
ALTER TABLE early_access_waitlist
ALTER COLUMN user_type SET NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_early_access_user_type ON early_access_waitlist(user_type);
