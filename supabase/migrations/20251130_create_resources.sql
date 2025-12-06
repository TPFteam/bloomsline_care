-- ============================================
-- RESOURCE TYPE ENUM
-- ============================================
CREATE TYPE resource_type AS ENUM ('worksheet', 'assessment', 'exercise', 'psychoeducation');

-- ============================================
-- RESOURCES TABLE (All resource types in one table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Type
  type resource_type NOT NULL,

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Content (blocks stored as JSONB)
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Type-specific settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}'::jsonb,

  -- Status & Visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  published_to_library_at TIMESTAMPTZ,

  -- Usage Stats
  times_assigned INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS resources_practitioner_id_idx ON public.resources(practitioner_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON public.resources(type);
CREATE INDEX IF NOT EXISTS resources_category_idx ON public.resources(category);
CREATE INDEX IF NOT EXISTS resources_status_idx ON public.resources(status);
CREATE INDEX IF NOT EXISTS resources_visibility_idx ON public.resources(visibility);
CREATE INDEX IF NOT EXISTS resources_created_at_idx ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS resources_tags_idx ON public.resources USING gin(tags);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Practitioners can view own resources"
  ON public.resources FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Anyone can view public published resources"
  ON public.resources FOR SELECT
  USING (visibility = 'public' AND status = 'published');

CREATE POLICY "Practitioners can create resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own resources"
  ON public.resources FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own resources"
  ON public.resources FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- RESOURCE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Assignment Details
  due_date DATE,
  instructions TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),

  -- Metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS resource_assignments_resource_id_idx ON public.resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS resource_assignments_member_id_idx ON public.resource_assignments(member_id);
CREATE INDEX IF NOT EXISTS resource_assignments_practitioner_id_idx ON public.resource_assignments(practitioner_id);
CREATE INDEX IF NOT EXISTS resource_assignments_status_idx ON public.resource_assignments(status);
CREATE INDEX IF NOT EXISTS resource_assignments_due_date_idx ON public.resource_assignments(due_date);

-- Enable RLS
ALTER TABLE public.resource_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Practitioners can view own assignments"
  ON public.resource_assignments FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create assignments"
  ON public.resource_assignments FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own assignments"
  ON public.resource_assignments FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own assignments"
  ON public.resource_assignments FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- RESOURCE RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.resource_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.resource_assignments(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Response Data
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- For assessments: calculated scores
  scores JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  submitted_at TIMESTAMPTZ,

  -- Practitioner Review
  practitioner_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Time Tracking
  time_spent_seconds INTEGER,
  started_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS resource_responses_assignment_id_idx ON public.resource_responses(assignment_id);
CREATE INDEX IF NOT EXISTS resource_responses_resource_id_idx ON public.resource_responses(resource_id);
CREATE INDEX IF NOT EXISTS resource_responses_member_id_idx ON public.resource_responses(member_id);
CREATE INDEX IF NOT EXISTS resource_responses_practitioner_id_idx ON public.resource_responses(practitioner_id);
CREATE INDEX IF NOT EXISTS resource_responses_status_idx ON public.resource_responses(status);
CREATE INDEX IF NOT EXISTS resource_responses_submitted_at_idx ON public.resource_responses(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.resource_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Practitioners can view responses"
  ON public.resource_responses FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create responses"
  ON public.resource_responses FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update responses"
  ON public.resource_responses FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete responses"
  ON public.resource_responses FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Resources updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Assignments updated_at
CREATE TRIGGER update_resource_assignments_updated_at
  BEFORE UPDATE ON public.resource_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Responses updated_at
CREATE TRIGGER update_resource_responses_updated_at
  BEFORE UPDATE ON public.resource_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Update assignment status on response submit
-- ============================================
CREATE OR REPLACE FUNCTION update_assignment_on_response_submit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND (OLD IS NULL OR OLD.status != 'submitted') THEN
    -- Update assignment status
    UPDATE public.resource_assignments
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.assignment_id;

    -- Increment times_completed
    UPDATE public.resources
    SET times_completed = times_completed + 1
    WHERE id = NEW.resource_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER response_submitted_trigger
  AFTER INSERT OR UPDATE ON public.resource_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_on_response_submit();

-- ============================================
-- FUNCTION: Increment times_assigned
-- ============================================
CREATE OR REPLACE FUNCTION increment_times_assigned()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.resources
  SET times_assigned = times_assigned + 1
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_created_trigger
  AFTER INSERT ON public.resource_assignments
  FOR EACH ROW
  EXECUTE FUNCTION increment_times_assigned();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.resources IS 'All practitioner-created resources (worksheets, assessments, exercises, psychoeducation)';
COMMENT ON TABLE public.resource_assignments IS 'Resources assigned to members';
COMMENT ON TABLE public.resource_responses IS 'Member responses to assigned resources';
COMMENT ON COLUMN public.resources.blocks IS 'JSON array of content blocks';
COMMENT ON COLUMN public.resources.settings IS 'Type-specific settings (scoring rules, duration, etc.)';
COMMENT ON COLUMN public.resource_responses.responses IS 'Member answers keyed by block ID';
COMMENT ON COLUMN public.resource_responses.scores IS 'Calculated scores for assessments';
