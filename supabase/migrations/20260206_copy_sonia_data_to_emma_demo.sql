-- Copy Sonia Lebari's data structure to all Emma demo profiles (English version)
-- This updates Emma demo members to have the same rich content as Sonia

-- ============================================
-- STEP 1: Update Emma's preferences and internal notes with Sonia's content
-- ============================================
UPDATE public.members
SET
  preferences = '{
    "communication_style": ["Needs relational safety before any sensitive exploration", "Tends to respond through thinking rather than feeling"],
    "key_strengths": ["Emotional intelligence", "Reflective capacity", "Therapeutic engagement"],
    "areas_of_sensitivity": ["Recognition in relationships", "Body trauma", "Dissociation"],
    "therapeutic_context": "Relational functioning marked by early over-adaptation and strong control in relationships\n\nDevelopmental trauma history (body trauma during adolescence)\n\nOngoing therapeutic work around internal safety, relationship patterns, and subjective recognition\n\nCurrent life situation is fragile (unemployment, financial precarity, uncomfortable housing) which may increase dissociation/freezing\n\nEngaged therapy, solid alliance but sensitive to recognition issues in the relationship",
    "preferred_contact_method": "email",
    "preferred_session_format": "virtual"
  }'::jsonb,
  internal_notes = 'Patient engaged in deep therapeutic work. Solid therapeutic alliance. Sensitive to recognition issues. Current work on internal safety and relationship patterns.',
  updated_at = NOW()
WHERE is_demo = true
AND first_name = 'Emma';

-- ============================================
-- STEP 2: Delete existing milestones for Emma demo members and create new ones based on Sonia's goals
-- ============================================
DELETE FROM public.milestone_comments
WHERE milestone_id IN (
  SELECT ml.id FROM public.milestones ml
  JOIN public.members m ON ml.member_id = m.id
  WHERE m.is_demo = true AND m.first_name = 'Emma'
);

DELETE FROM public.milestones
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma');

-- Create milestones based on Sonia's active goals
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Access emotions safely' as title,
  'Access emotions without forcing or dissociating' as description,
  'general' as category,
  'building' as status,
  (NOW() + INTERVAL '30 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Be present in relationships' as title,
  'Be present in relationships without protecting through control or performance' as description,
  'general' as category,
  'discovery' as status,
  (NOW() + INTERVAL '60 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

-- ============================================
-- STEP 3: Delete existing progress notes for Emma and create new ones
-- ============================================
DELETE FROM public.progress_notes
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma');

-- Create session summary note
INSERT INTO public.progress_notes (member_id, practitioner_id, title, content, note_type, is_private, created_at)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Session Summary' as title,
  'Follow-up session focused on accessing emotions and recognition in relationships. Patient shows increasing ability to identify emotional states without dissociating. Continuing work on internal safety.' as content,
  'general' as note_type,
  false as is_private,
  NOW() - INTERVAL '8 days' as created_at
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

-- Create observation note
INSERT INTO public.progress_notes (member_id, practitioner_id, title, content, note_type, is_private, created_at)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Clinical Observation' as title,
  'Good mentalization capacity when the setting feels safe. Tendency to freeze or over-adapt when perceiving expectations. Work on subjective recognition is progressing.' as content,
  'observation' as note_type,
  true as is_private,
  NOW() - INTERVAL '15 days' as created_at
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

-- Create treatment plan note
INSERT INTO public.progress_notes (member_id, practitioner_id, title, content, note_type, is_private, created_at)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Treatment Plan' as title,
  'Focus areas:\n1. Internal safety and emotional regulation\n2. Relationships without control or performance\n3. Subjective recognition and experience validation\n4. Gradual trauma work when window of tolerance allows' as content,
  'treatment_plan' as note_type,
  true as is_private,
  NOW() - INTERVAL '30 days' as created_at
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

-- ============================================
-- STEP 4: Update sessions with more relevant content
-- ============================================
UPDATE public.sessions
SET
  notes = 'Session focused on exploring protective mechanisms in relationships. Patient identifies tendency to anticipate expectations to avoid disappointment. Working on the legitimacy of her own needs.',
  summary = 'Progress in awareness of over-adaptation patterns. Opening toward expressing authentic needs.'
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma')
AND status = 'completed'
AND session_type = 'follow_up';

UPDATE public.sessions
SET
  notes = 'First meeting. Gathered history and reasons for consultation. Therapeutic alliance building. Patient expresses need for recognition and safety in relationships.',
  summary = 'Initial consultation. Identified focus areas: internal safety, relationship patterns, subjective recognition.'
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma')
AND status = 'completed'
AND session_type = 'initial_consultation';
