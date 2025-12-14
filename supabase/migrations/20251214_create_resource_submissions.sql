-- Create resource_submissions table
-- This table stores member submissions/responses to worksheets and assessments

CREATE TABLE IF NOT EXISTS public.resource_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Submission data
  responses JSONB NOT NULL DEFAULT '{}', -- Stores all answers/responses
  score INTEGER, -- For assessments: calculated score
  max_score INTEGER, -- For assessments: maximum possible score
  score_interpretation TEXT, -- For assessments: e.g., "Minimal", "Moderate", etc.

  -- Status tracking
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT, -- Practitioner notes after reviewing

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resource_submissions_resource ON public.resource_submissions(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_submissions_member ON public.resource_submissions(member_id);
CREATE INDEX IF NOT EXISTS idx_resource_submissions_practitioner ON public.resource_submissions(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_resource_submissions_status ON public.resource_submissions(status);
CREATE INDEX IF NOT EXISTS idx_resource_submissions_submitted_at ON public.resource_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.resource_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_submissions

-- Practitioners can view submissions for their resources
CREATE POLICY "Practitioners can view submissions for their resources"
  ON public.resource_submissions FOR SELECT
  USING (auth.uid() = practitioner_id);

-- Practitioners can insert submissions (when submitting on behalf of member or for testing)
CREATE POLICY "Practitioners can create submissions"
  ON public.resource_submissions FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

-- Practitioners can update submissions (add notes, mark as reviewed)
CREATE POLICY "Practitioners can update submissions"
  ON public.resource_submissions FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

-- Practitioners can delete submissions
CREATE POLICY "Practitioners can delete submissions"
  ON public.resource_submissions FOR DELETE
  USING (auth.uid() = practitioner_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_resource_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resource_submissions_updated_at
  BEFORE UPDATE ON public.resource_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_submissions_updated_at();
