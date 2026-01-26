-- Add feature_guides JSONB column to users table
-- Stores completion status of feature onboarding guides

ALTER TABLE users ADD COLUMN IF NOT EXISTS feature_guides JSONB DEFAULT '{}';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_feature_guides ON users USING GIN (feature_guides);

-- Comment for documentation
COMMENT ON COLUMN users.feature_guides IS 'Tracks completion of feature onboarding guides. Structure: { "feature_name": { "completed": boolean, "completedAt": timestamp, "skipped": boolean } }';
