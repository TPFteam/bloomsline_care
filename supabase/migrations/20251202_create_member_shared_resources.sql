-- Create member_shared_resources table
-- This table tracks resources (worksheets, assessments, etc.) shared with members

CREATE TABLE IF NOT EXISTS public.member_shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sharing Details
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  message TEXT, -- Optional message when sharing
  viewed_at TIMESTAMPTZ, -- When member viewed (if trackable)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate sharing
  UNIQUE(member_id, resource_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_shared_resources_member ON public.member_shared_resources(member_id);
CREATE INDEX IF NOT EXISTS idx_member_shared_resources_resource ON public.member_shared_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_member_shared_resources_practitioner ON public.member_shared_resources(practitioner_id);

-- Enable RLS
ALTER TABLE public.member_shared_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_shared_resources

-- Practitioners can view their own shared resources
CREATE POLICY "Practitioners can view own shared resources"
  ON public.member_shared_resources FOR SELECT
  USING (auth.uid() = practitioner_id);

-- Practitioners can share resources with members
CREATE POLICY "Practitioners can share resources"
  ON public.member_shared_resources FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

-- Practitioners can update their own shared resources (e.g., mark as viewed)
CREATE POLICY "Practitioners can update own shared resources"
  ON public.member_shared_resources FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

-- Practitioners can delete their own shared resources
CREATE POLICY "Practitioners can delete own shared resources"
  ON public.member_shared_resources FOR DELETE
  USING (auth.uid() = practitioner_id);
