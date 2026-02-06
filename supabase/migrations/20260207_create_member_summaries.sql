-- ============================================
-- MEMBER SUMMARIES TABLE (AI-generated therapeutic summaries)
-- ============================================
CREATE TABLE IF NOT EXISTS public.member_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Summary Content (JSONB for structured sections)
  summary_content JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Plain text version for quick display
  summary_text TEXT,

  -- Metadata
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER,

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for member_summaries
CREATE INDEX IF NOT EXISTS member_summaries_member_id_idx ON public.member_summaries(member_id);
CREATE INDEX IF NOT EXISTS member_summaries_practitioner_id_idx ON public.member_summaries(practitioner_id);
CREATE INDEX IF NOT EXISTS member_summaries_generated_at_idx ON public.member_summaries(generated_at DESC);

-- Enable RLS for member_summaries
ALTER TABLE public.member_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_summaries
CREATE POLICY "Practitioners can view own member summaries"
  ON public.member_summaries FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create member summaries"
  ON public.member_summaries FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own member summaries"
  ON public.member_summaries FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own member summaries"
  ON public.member_summaries FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.member_summaries IS 'AI-generated therapeutic summaries for members';
COMMENT ON COLUMN public.member_summaries.summary_content IS 'Structured JSON with sections: current_status, progress_highlights, key_themes, areas_of_attention, recommendations, next_steps';
COMMENT ON COLUMN public.member_summaries.summary_text IS 'Plain text version of the summary for quick display';
COMMENT ON COLUMN public.member_summaries.model_used IS 'Claude model used to generate the summary';
COMMENT ON COLUMN public.member_summaries.tokens_used IS 'Number of tokens used in generation';
