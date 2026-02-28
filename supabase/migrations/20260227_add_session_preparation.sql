-- ============================================
-- ADD PREPARATION COLUMN TO SESSIONS
-- Stores AI-generated session preparation briefing as JSONB
-- ============================================
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS preparation JSONB DEFAULT NULL;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN public.sessions.preparation IS 'AI-generated session preparation briefing (JSON: quick_context, last_session, open_threads, suggested_focus, things_to_note)';
