-- Copy Sonia Lebari's data structure to all Emma demo profiles
-- This updates Emma demo members to have the same rich content as Sonia

-- ============================================
-- STEP 1: Update Emma's preferences and internal notes with Sonia's content
-- ============================================
UPDATE public.members
SET
  preferences = '{
    "communication_style": ["Besoin de sécurité relationnelle préalable avant toute exploration sensible", "Tendance à répondre par la pensée plutôt que par l''affect"],
    "key_strengths": ["Intelligence émotionnelle", "Capacité de réflexion", "Engagement thérapeutique"],
    "areas_of_sensitivity": ["Reconnaissance dans le lien", "Trauma corporel", "Dissociation"],
    "therapeutic_context": "Fonctionnement relationnel marqué par une suradaptation précoce et un fort contrôle du lien\n\nHistoire traumatique développementale (trauma corporel à l''adolescence)\n\nTravail thérapeutique en cours autour de la sécurité interne, du rapport au lien, et de la reconnaissance subjective\n\nSituation de vie actuelle fragile (chômage, précarité matérielle, logement inconfortable) pouvant majorer la dissociation / le gel\n\nThérapie engagée, alliance solide mais sensible aux enjeux de reconnaissance dans le lien",
    "preferred_contact_method": "email",
    "preferred_session_format": "virtual"
  }'::jsonb,
  internal_notes = 'Patiente engagée dans un travail thérapeutique profond. Alliance thérapeutique solide. Sensible aux enjeux de reconnaissance. Travail actuel sur la sécurité interne et le rapport au lien.',
  updated_at = NOW()
WHERE is_demo = true
AND first_name = 'Emma';

-- ============================================
-- STEP 2: Delete existing milestones for Emma demo members and create new ones based on Sonia's goals
-- ============================================
DELETE FROM public.milestones
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma');

-- Delete existing milestone comments for Emma
DELETE FROM public.milestone_comments
WHERE milestone_id IN (
  SELECT ml.id FROM public.milestones ml
  JOIN public.members m ON ml.member_id = m.id
  WHERE m.is_demo = true AND m.first_name = 'Emma'
);

-- Create milestones based on Sonia's active goals
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Accéder à l''affect' as title,
  'Accéder à l''affect sans forçage ni dissociation' as description,
  'general' as category,
  'building' as status,
  (NOW() + INTERVAL '30 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Exister dans le lien' as title,
  'Exister dans le lien sans se protéger par le contrôle ou la performance' as description,
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
  'Follow-up session. Travail sur l''accès à l''affect et la reconnaissance dans le lien. La patiente montre une capacité croissante à identifier ses états émotionnels sans passer par la dissociation. Poursuite du travail sur la sécurité interne.' as content,
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
  'Observation clinique' as title,
  'Bonne capacité de mentalisation quand le cadre est sécurisant. Tendance au gel ou à la suradaptation quand elle perçoit une attente. Le travail sur la reconnaissance subjective progresse.' as content,
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
  'Plan de traitement' as title,
  'Axes de travail:\n1. Sécurité interne et régulation émotionnelle\n2. Rapport au lien sans contrôle ni performance\n3. Reconnaissance subjective et validation de l''expérience\n4. Travail progressif sur le trauma corporel quand la fenêtre de tolérance le permet' as content,
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
  notes = 'Séance centrée sur l''exploration des mécanismes de protection dans le lien. La patiente identifie sa tendance à anticiper les attentes pour éviter la déception. Travail sur la légitimité de ses besoins propres.',
  summary = 'Progrès dans la conscience des mécanismes de suradaptation. Ouverture vers l''expression des besoins authentiques.'
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma')
AND status = 'completed'
AND session_type = 'follow_up';

UPDATE public.sessions
SET
  notes = 'Première rencontre. Recueil de l''histoire et des motifs de consultation. Alliance thérapeutique en construction. La patiente exprime un besoin de reconnaissance et de sécurité dans le lien.',
  summary = 'Consultation initiale. Identification des axes de travail: sécurité interne, rapport au lien, reconnaissance subjective.'
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma')
AND status = 'completed'
AND session_type = 'initial_consultation';
