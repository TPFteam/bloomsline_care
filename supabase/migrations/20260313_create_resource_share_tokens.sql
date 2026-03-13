-- ═══════════════════════════════════════════════════════════════
-- Resource share tokens: secure links for members without accounts
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.resource_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_resource_share_tokens_token ON resource_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_resource_share_tokens_resource ON resource_share_tokens(resource_id);

-- RLS: only service role should access this table
ALTER TABLE public.resource_share_tokens ENABLE ROW LEVEL SECURITY;

-- Practitioners can view tokens they created
DO $$ BEGIN
  CREATE POLICY "Practitioners can view own share tokens"
    ON public.resource_share_tokens FOR SELECT
    USING (auth.uid() = practitioner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Practitioners can create share tokens
DO $$ BEGIN
  CREATE POLICY "Practitioners can create share tokens"
    ON public.resource_share_tokens FOR INSERT
    WITH CHECK (auth.uid() = practitioner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
