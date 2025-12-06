-- Create member status enum
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending');

-- Create engagement level enum
CREATE TYPE engagement_level AS ENUM ('low', 'medium', 'high');

-- Create session type enum
CREATE TYPE session_type AS ENUM ('initial_consultation', 'follow_up', 'check_in', 'crisis', 'group', 'other');

-- Create session format enum
CREATE TYPE session_format AS ENUM ('in_person', 'virtual', 'phone');

-- ============================================
-- MEMBERS TABLE (Clients/Patients)
-- ============================================
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  avatar_url TEXT,

  -- Status & Engagement
  status member_status DEFAULT 'pending',
  engagement_level engagement_level DEFAULT 'medium',

  -- Client Preferences (stored as JSONB for flexibility)
  preferences JSONB DEFAULT '{
    "communication_style": null,
    "key_strengths": [],
    "areas_of_sensitivity": [],
    "therapeutic_context": null,
    "preferred_contact_method": "email",
    "preferred_session_format": "in_person"
  }'::jsonb,

  -- Emergency Contact
  emergency_contact JSONB DEFAULT '{
    "name": null,
    "relationship": null,
    "phone": null,
    "email": null,
    "notes": null
  }'::jsonb,

  -- Internal Notes (practitioner only)
  internal_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_session_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT members_email_check CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for members
CREATE INDEX IF NOT EXISTS members_practitioner_id_idx ON public.members(practitioner_id);
CREATE INDEX IF NOT EXISTS members_status_idx ON public.members(status);
CREATE INDEX IF NOT EXISTS members_engagement_idx ON public.members(engagement_level);
CREATE INDEX IF NOT EXISTS members_last_session_idx ON public.members(last_session_at);
CREATE INDEX IF NOT EXISTS members_name_search_idx ON public.members USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Enable RLS for members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members
CREATE POLICY "Practitioners can view own members"
  ON public.members FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create members"
  ON public.members FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own members"
  ON public.members FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own members"
  ON public.members FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Session Details
  session_type session_type NOT NULL DEFAULT 'follow_up',
  session_format session_format NOT NULL DEFAULT 'in_person',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- Session Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

  -- Session Content
  notes TEXT,
  summary TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),

  -- Goals & Outcomes
  goals JSONB DEFAULT '[]'::jsonb, -- Array of session goals
  outcomes JSONB DEFAULT '[]'::jsonb, -- Array of outcomes/observations
  homework JSONB DEFAULT '[]'::jsonb, -- Array of homework/tasks assigned

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS sessions_member_id_idx ON public.sessions(member_id);
CREATE INDEX IF NOT EXISTS sessions_practitioner_id_idx ON public.sessions(practitioner_id);
CREATE INDEX IF NOT EXISTS sessions_scheduled_at_idx ON public.sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS sessions_status_idx ON public.sessions(status);

-- Enable RLS for sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Practitioners can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- PROGRESS NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL, -- Optional link to session

  -- Note Content
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'assessment', 'treatment_plan', 'milestone', 'concern', 'observation')),

  -- Visibility
  is_private BOOLEAN DEFAULT true, -- Private notes only visible to practitioner

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for progress_notes
CREATE INDEX IF NOT EXISTS progress_notes_member_id_idx ON public.progress_notes(member_id);
CREATE INDEX IF NOT EXISTS progress_notes_practitioner_id_idx ON public.progress_notes(practitioner_id);
CREATE INDEX IF NOT EXISTS progress_notes_session_id_idx ON public.progress_notes(session_id);
CREATE INDEX IF NOT EXISTS progress_notes_type_idx ON public.progress_notes(note_type);

-- Enable RLS for progress_notes
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress_notes
CREATE POLICY "Practitioners can view own progress notes"
  ON public.progress_notes FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create progress notes"
  ON public.progress_notes FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own progress notes"
  ON public.progress_notes FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own progress notes"
  ON public.progress_notes FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- MEMBER FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.member_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- File Information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER, -- Size in bytes
  storage_path TEXT NOT NULL, -- Path in Supabase storage

  -- Organization
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'intake', 'assessment', 'consent', 'insurance', 'correspondence', 'other')),
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for member_files
CREATE INDEX IF NOT EXISTS member_files_member_id_idx ON public.member_files(member_id);
CREATE INDEX IF NOT EXISTS member_files_practitioner_id_idx ON public.member_files(practitioner_id);
CREATE INDEX IF NOT EXISTS member_files_category_idx ON public.member_files(category);

-- Enable RLS for member_files
ALTER TABLE public.member_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_files
CREATE POLICY "Practitioners can view own member files"
  ON public.member_files FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create member files"
  ON public.member_files FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own member files"
  ON public.member_files FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own member files"
  ON public.member_files FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- SHARED RESOURCES TABLE (Stories shared with members)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Sharing Details
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  message TEXT, -- Optional message when sharing
  viewed_at TIMESTAMPTZ, -- When member viewed (if trackable)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate sharing
  UNIQUE(member_id, story_id)
);

-- Indexes for shared_resources
CREATE INDEX IF NOT EXISTS shared_resources_member_id_idx ON public.shared_resources(member_id);
CREATE INDEX IF NOT EXISTS shared_resources_story_id_idx ON public.shared_resources(story_id);
CREATE INDEX IF NOT EXISTS shared_resources_practitioner_id_idx ON public.shared_resources(practitioner_id);

-- Enable RLS for shared_resources
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_resources
CREATE POLICY "Practitioners can view own shared resources"
  ON public.shared_resources FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can share resources"
  ON public.shared_resources FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own shared resources"
  ON public.shared_resources FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own shared resources"
  ON public.shared_resources FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- MILESTONES TABLE (Progress tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Milestone Details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'therapy_goal', 'behavioral', 'emotional', 'social', 'other')),

  -- Status
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  target_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for milestones
CREATE INDEX IF NOT EXISTS milestones_member_id_idx ON public.milestones(member_id);
CREATE INDEX IF NOT EXISTS milestones_practitioner_id_idx ON public.milestones(practitioner_id);
CREATE INDEX IF NOT EXISTS milestones_achieved_idx ON public.milestones(achieved);

-- Enable RLS for milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for milestones
CREATE POLICY "Practitioners can view own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can create milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own milestones"
  ON public.milestones FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own milestones"
  ON public.milestones FOR DELETE
  USING (auth.uid() = practitioner_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Members updated_at trigger
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sessions updated_at trigger
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Progress notes updated_at trigger
CREATE TRIGGER update_progress_notes_updated_at
  BEFORE UPDATE ON public.progress_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Member files updated_at trigger
CREATE TRIGGER update_member_files_updated_at
  BEFORE UPDATE ON public.member_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Milestones updated_at trigger
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Update member's last_session_at
-- ============================================
CREATE OR REPLACE FUNCTION update_member_last_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.members
    SET last_session_at = NEW.scheduled_at
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_last_session_trigger
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_session();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.members IS 'Clients/patients managed by practitioners';
COMMENT ON TABLE public.sessions IS 'Therapy/consultation sessions with members';
COMMENT ON TABLE public.progress_notes IS 'Clinical notes and observations about members';
COMMENT ON TABLE public.member_files IS 'Files and documents associated with members';
COMMENT ON TABLE public.shared_resources IS 'Stories and resources shared with members';
COMMENT ON TABLE public.milestones IS 'Progress milestones and goals for members';

COMMENT ON COLUMN public.members.preferences IS 'JSON object containing client preferences like communication style, strengths, and sensitivities';
COMMENT ON COLUMN public.members.emergency_contact IS 'JSON object with emergency contact information';
COMMENT ON COLUMN public.sessions.goals IS 'Array of session goals as JSON';
COMMENT ON COLUMN public.sessions.outcomes IS 'Array of session outcomes/observations as JSON';
COMMENT ON COLUMN public.sessions.homework IS 'Array of homework assignments as JSON';
