-- Add member confirmation fields to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS member_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
ADD COLUMN IF NOT EXISTS member_suggested_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS practitioner_proposed_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reschedule_status TEXT DEFAULT NULL CHECK (reschedule_status IN ('pending', 'proposed', 'accepted', 'declined'));

-- Index for pending confirmations
CREATE INDEX IF NOT EXISTS sessions_member_confirmed_idx ON public.sessions(member_confirmed);
CREATE INDEX IF NOT EXISTS sessions_reschedule_requested_idx ON public.sessions(reschedule_requested);

-- Add RLS policy for members to view their own sessions
DROP POLICY IF EXISTS "Members can view their own sessions" ON public.sessions;
CREATE POLICY "Members can view their own sessions"
  ON public.sessions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Add RLS policy for members to update confirmation status
DROP POLICY IF EXISTS "Members can confirm their sessions" ON public.sessions;
CREATE POLICY "Members can confirm their sessions"
  ON public.sessions FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );
