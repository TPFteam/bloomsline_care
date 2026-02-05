-- Add is_demo column to members table to identify demo/example profiles
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Create index for quick filtering of demo members
CREATE INDEX IF NOT EXISTS members_is_demo_idx ON public.members(is_demo);

-- Comment
COMMENT ON COLUMN public.members.is_demo IS 'Flag to identify demo/example profiles created for new practitioners';

-- ============================================
-- UPDATE ALL EXISTING PENDING MEMBERS TO ACTIVE
-- ============================================
UPDATE public.members SET status = 'active' WHERE status = 'pending';

-- ============================================
-- DEMO MEMBER 1: Emma Thompson (Active, High Engagement)
-- Full profile with content in all tabs
-- ============================================
INSERT INTO public.members (practitioner_id, first_name, last_name, email, phone, date_of_birth, status, engagement_level, is_demo, internal_notes, preferences, emergency_contact)
SELECT
  u.id as practitioner_id,
  'Emma' as first_name,
  'Thompson' as last_name,
  NULL as email,
  NULL as phone,
  '1992-03-15'::date as date_of_birth,
  'active'::member_status as status,
  'high'::engagement_level as engagement_level,
  true as is_demo,
  'Emma has been working on managing work-related stress and perfectionism. She responds well to reflective exercises and journaling prompts. Making excellent progress with self-awareness.' as internal_notes,
  '{
    "communication_style": "Prefers gentle, reflective conversations. Appreciates when given time to process before responding.",
    "key_strengths": ["Self-awareness", "Journaling", "Openness to growth", "Commitment to therapy"],
    "areas_of_sensitivity": ["Work-related stress", "Perfectionism", "Fear of disappointing others"],
    "therapeutic_context": "Working on establishing healthier boundaries at work and developing self-compassion practices.",
    "preferred_contact_method": "email",
    "preferred_session_format": "virtual"
  }'::jsonb as preferences,
  '{
    "name": "David Thompson",
    "relationship": "Spouse",
    "phone": "+1 555-0123",
    "email": null,
    "notes": "Primary emergency contact"
  }'::jsonb as emergency_contact
FROM public.users u
WHERE u.user_type = 'mentor'
AND NOT EXISTS (
  SELECT 1 FROM public.members m
  WHERE m.practitioner_id = u.id
  AND m.is_demo = true
  AND m.first_name = 'Emma'
);

-- ============================================
-- DEMO MEMBER 2: Lucas Martin (Pending, Medium Engagement)
-- Newer client with less content
-- ============================================
INSERT INTO public.members (practitioner_id, first_name, last_name, email, phone, date_of_birth, status, engagement_level, is_demo, internal_notes, preferences, emergency_contact)
SELECT
  u.id as practitioner_id,
  'Lucas' as first_name,
  'Martin' as last_name,
  NULL as email,
  NULL as phone,
  '1988-07-22'::date as date_of_birth,
  'active'::member_status as status,
  'medium'::engagement_level as engagement_level,
  true as is_demo,
  'Lucas is a new client interested in developing better stress management techniques. Prefers direct, action-oriented approaches.' as internal_notes,
  '{
    "communication_style": "Direct and action-oriented. Prefers concrete techniques over abstract discussions.",
    "key_strengths": ["Problem-solving", "Resilience", "Logical thinking"],
    "areas_of_sensitivity": ["Discussing emotions directly", "Vulnerability"],
    "therapeutic_context": "Initial consultation pending. Interested in CBT-based approaches.",
    "preferred_contact_method": "phone",
    "preferred_session_format": "in_person"
  }'::jsonb as preferences,
  '{
    "name": null,
    "relationship": null,
    "phone": null,
    "email": null,
    "notes": null
  }'::jsonb as emergency_contact
FROM public.users u
WHERE u.user_type = 'mentor'
AND NOT EXISTS (
  SELECT 1 FROM public.members m
  WHERE m.practitioner_id = u.id
  AND m.is_demo = true
  AND m.first_name = 'Lucas'
);

-- ============================================
-- SESSIONS TAB: Create multiple sessions for Emma
-- ============================================

-- Session 1: Completed session (2 weeks ago)
INSERT INTO public.sessions (member_id, practitioner_id, session_type, session_format, scheduled_at, duration_minutes, status, notes, summary, mood_rating)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'initial_consultation'::session_type as session_type,
  'virtual'::session_format as session_format,
  NOW() - INTERVAL '14 days' as scheduled_at,
  60 as duration_minutes,
  'completed' as status,
  'First session focused on understanding Emma''s background and current challenges. Discussed her work environment and identified key stressors. She expressed motivation to work on setting boundaries.' as notes,
  'Initial consultation completed. Established rapport and identified primary focus areas: work stress, perfectionism, and self-compassion.' as summary,
  6 as mood_rating
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.member_id = m.id
  AND s.session_type = 'initial_consultation'
);

-- Session 2: Completed follow-up (1 week ago)
INSERT INTO public.sessions (member_id, practitioner_id, session_type, session_format, scheduled_at, duration_minutes, status, notes, summary, mood_rating)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'follow_up'::session_type as session_type,
  'virtual'::session_format as session_format,
  NOW() - INTERVAL '7 days' as scheduled_at,
  50 as duration_minutes,
  'completed' as status,
  'Reviewed journaling homework from last week. Emma identified several patterns in her stress responses. Introduced breathing techniques for moments of overwhelm.' as notes,
  'Good progress on self-awareness. Emma has been consistent with journaling. Introduced grounding techniques.' as summary,
  7 as mood_rating
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.member_id = m.id
  AND s.session_type = 'follow_up'
);

-- Session 3: Upcoming scheduled session
INSERT INTO public.sessions (member_id, practitioner_id, session_type, session_format, scheduled_at, duration_minutes, status, notes, summary, mood_rating)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'follow_up'::session_type as session_type,
  'virtual'::session_format as session_format,
  NOW() + INTERVAL '3 days' as scheduled_at,
  50 as duration_minutes,
  'scheduled' as status,
  NULL as notes,
  NULL as summary,
  NULL as mood_rating
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.member_id = m.id
  AND s.status = 'scheduled'
);

-- Session for Lucas: Initial consultation (upcoming)
INSERT INTO public.sessions (member_id, practitioner_id, session_type, session_format, scheduled_at, duration_minutes, status, notes, summary, mood_rating)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'initial_consultation'::session_type as session_type,
  'in_person'::session_format as session_format,
  NOW() + INTERVAL '5 days' as scheduled_at,
  60 as duration_minutes,
  'scheduled' as status,
  NULL as notes,
  NULL as summary,
  NULL as mood_rating
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Lucas'
AND NOT EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.member_id = m.id
);

-- ============================================
-- PROGRESS TAB: Milestones for Emma
-- ============================================

-- Milestone 1: In Discovery phase
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Develop self-compassion practice' as title,
  'Build a daily practice of self-compassion, replacing self-critical thoughts with kinder self-talk.' as description,
  'emotional' as category,
  'discovery' as status,
  (NOW() + INTERVAL '60 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.milestones ml
  WHERE ml.member_id = m.id
  AND ml.title = 'Develop self-compassion practice'
);

-- Milestone 2: In Building phase
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Set boundaries at work' as title,
  'Learn to say no to extra tasks and communicate workload limits to manager.' as description,
  'behavioral' as category,
  'building' as status,
  (NOW() + INTERVAL '30 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.milestones ml
  WHERE ml.member_id = m.id
  AND ml.title = 'Set boundaries at work'
);

-- Milestone 3: In Thriving phase
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Daily journaling habit' as title,
  'Maintain a consistent evening journaling practice to process daily experiences and emotions.' as description,
  'behavioral' as category,
  'thriving' as status,
  (NOW() + INTERVAL '14 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.milestones ml
  WHERE ml.member_id = m.id
  AND ml.title = 'Daily journaling habit'
);

-- Milestone 4: Independent (achieved)
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, achieved_at)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Identify stress triggers' as title,
  'Recognize and name the specific situations and thoughts that trigger stress responses.' as description,
  'therapy_goal' as category,
  'independent' as status,
  NOW() - INTERVAL '5 days' as achieved_at
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.milestones ml
  WHERE ml.member_id = m.id
  AND ml.title = 'Identify stress triggers'
);

-- ============================================
-- PROGRESS TAB: Milestone comments for Emma
-- ============================================
INSERT INTO public.milestone_comments (milestone_id, practitioner_id, content)
SELECT
  ml.id as milestone_id,
  ml.practitioner_id,
  'Emma has been making excellent progress with her journaling. She''s now consistently writing every evening and finding it helps her process the day.' as content
FROM public.milestones ml
JOIN public.members m ON ml.member_id = m.id
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND ml.title = 'Daily journaling habit'
AND NOT EXISTS (
  SELECT 1 FROM public.milestone_comments mc
  WHERE mc.milestone_id = ml.id
);

INSERT INTO public.milestone_comments (milestone_id, practitioner_id, content)
SELECT
  ml.id as milestone_id,
  ml.practitioner_id,
  'Working on practicing "I" statements when expressing workload concerns. Had a successful conversation with her manager last week.' as content
FROM public.milestones ml
JOIN public.members m ON ml.member_id = m.id
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND ml.title = 'Set boundaries at work'
AND NOT EXISTS (
  SELECT 1 FROM public.milestone_comments mc
  WHERE mc.milestone_id = ml.id
);

-- ============================================
-- OVERVIEW/SESSIONS TAB: Progress notes for Emma
-- ============================================
INSERT INTO public.progress_notes (member_id, practitioner_id, title, content, note_type, is_private)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Initial observations' as title,
  'Emma presents as articulate and self-aware. She has a strong desire to improve but tends to be self-critical when progress isn''t immediate. Will focus on normalizing the non-linear nature of growth.' as content,
  'observation' as note_type,
  true as is_private
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.progress_notes pn
  WHERE pn.member_id = m.id
  AND pn.title = 'Initial observations'
);

INSERT INTO public.progress_notes (member_id, practitioner_id, title, content, note_type, is_private)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Treatment approach' as title,
  'Combining CBT techniques with mindfulness-based approaches. Focus areas: cognitive restructuring for perfectionist thoughts, boundary-setting skills, and self-compassion exercises.' as content,
  'treatment_plan' as note_type,
  true as is_private
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Emma'
AND NOT EXISTS (
  SELECT 1 FROM public.progress_notes pn
  WHERE pn.member_id = m.id
  AND pn.title = 'Treatment approach'
);

-- ============================================
-- MILESTONE FOR LUCAS (simple, pending client)
-- ============================================
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Complete initial assessment' as title,
  'Conduct comprehensive intake interview and establish treatment goals.' as description,
  'therapy_goal' as category,
  'discovery' as status,
  (NOW() + INTERVAL '14 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true
AND m.first_name = 'Lucas'
AND NOT EXISTS (
  SELECT 1 FROM public.milestones ml
  WHERE ml.member_id = m.id
);
