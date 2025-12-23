-- ============================================
-- ADD HISTORY TRACKING TO MEMBER_RITUALS
-- ============================================
-- Track when rituals are added and removed so we can show accurate
-- historical data like "On Monday you had 5 rituals, completed 3"

-- Add columns to track lifecycle
ALTER TABLE public.member_rituals
ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS member_rituals_active_idx
  ON public.member_rituals(member_id, is_active);
CREATE INDEX IF NOT EXISTS member_rituals_added_at_idx
  ON public.member_rituals(added_at);
CREATE INDEX IF NOT EXISTS member_rituals_removed_at_idx
  ON public.member_rituals(removed_at) WHERE removed_at IS NOT NULL;

-- Update existing records to have added_at set to created_at if it exists
-- (assuming created_at column exists, otherwise use NOW())
UPDATE public.member_rituals
SET added_at = COALESCE(created_at, NOW()), is_active = TRUE
WHERE added_at IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.member_rituals.added_at IS 'When the user added this ritual to their list';
COMMENT ON COLUMN public.member_rituals.removed_at IS 'When the user removed this ritual (NULL if still active)';
COMMENT ON COLUMN public.member_rituals.is_active IS 'Whether the ritual is currently active (false = soft deleted)';
