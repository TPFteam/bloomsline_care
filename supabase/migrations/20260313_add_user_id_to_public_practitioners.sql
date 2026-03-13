-- ═══════════════════════════════════════════════════════════════
-- Add user_id to public_practitioners for account linking
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.public_practitioners
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ;

-- Unique constraint: one user can only be linked to one public profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_practitioners_user_id
  ON public_practitioners(user_id) WHERE user_id IS NOT NULL;
