-- Copy Sonia Lebari's data structure to all Emma demo profiles (Bilingual EN/FR)
-- This updates Emma demo members to have the same rich content as Sonia

-- ============================================
-- STEP 1: Update Emma's preferences and internal notes with bilingual content
-- ============================================
UPDATE public.members
SET
  preferences = '{
    "communication_style": {
      "en": ["Needs relational safety before any sensitive exploration", "Tends to respond through thinking rather than feeling"],
      "fr": ["Besoin de sécurité relationnelle préalable avant toute exploration sensible", "Tendance à répondre par la pensée plutôt que par l''affect"]
    },
    "key_strengths": {
      "en": ["Emotional intelligence", "Reflective capacity", "Therapeutic engagement"],
      "fr": ["Intelligence émotionnelle", "Capacité de réflexion", "Engagement thérapeutique"]
    },
    "areas_of_sensitivity": {
      "en": ["Recognition in relationships", "Body trauma", "Dissociation"],
      "fr": ["Reconnaissance dans le lien", "Trauma corporel", "Dissociation"]
    },
    "therapeutic_context": {
      "en": "Relational functioning marked by early over-adaptation and strong control in relationships\n\nDevelopmental trauma history (body trauma during adolescence)\n\nOngoing therapeutic work around internal safety, relationship patterns, and subjective recognition\n\nCurrent life situation is fragile (unemployment, financial precarity, uncomfortable housing) which may increase dissociation/freezing\n\nEngaged therapy, solid alliance but sensitive to recognition issues in the relationship",
      "fr": "Fonctionnement relationnel marqué par une suradaptation précoce et un fort contrôle du lien\n\nHistoire traumatique développementale (trauma corporel à l''adolescence)\n\nTravail thérapeutique en cours autour de la sécurité interne, du rapport au lien, et de la reconnaissance subjective\n\nSituation de vie actuelle fragile (chômage, précarité matérielle, logement inconfortable) pouvant majorer la dissociation / le gel\n\nThérapie engagée, alliance solide mais sensible aux enjeux de reconnaissance dans le lien"
    },
    "preferred_contact_method": "email",
    "preferred_session_format": "virtual"
  }'::jsonb,
  internal_notes = 'EN: Patient engaged in deep therapeutic work. Solid therapeutic alliance. Sensitive to recognition issues. Current work on internal safety and relationship patterns.

FR: Patiente engagée dans un travail thérapeutique profond. Alliance thérapeutique solide. Sensible aux enjeux de reconnaissance. Travail actuel sur la sécurité interne et le rapport au lien.',
  updated_at = NOW()
WHERE is_demo = true
AND first_name = 'Emma';

-- ============================================
-- STEP 2: Delete existing milestones for Emma demo members and create new ones
-- ============================================
DELETE FROM public.milestone_comments
WHERE milestone_id IN (
  SELECT ml.id FROM public.milestones ml
  JOIN public.members m ON ml.member_id = m.id
  WHERE m.is_demo = true AND m.first_name = 'Emma'
);

DELETE FROM public.milestones
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma');

-- Create bilingual milestones
INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Access emotions safely / Accéder à l''affect' as title,
  'EN: Access emotions without forcing or dissociating
FR: Accéder à l''affect sans forçage ni dissociation' as description,
  'general' as category,
  'building' as status,
  (NOW() + INTERVAL '30 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

INSERT INTO public.milestones (member_id, practitioner_id, title, description, category, status, target_date)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Be present in relationships / Exister dans le lien' as title,
  'EN: Be present in relationships without protecting through control or performance
FR: Exister dans le lien sans se protéger par le contrôle ou la performance' as description,
  'general' as category,
  'discovery' as status,
  (NOW() + INTERVAL '60 days')::date as target_date
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

-- ============================================
-- STEP 3: Delete existing progress notes for Emma and create bilingual ones
-- ============================================
DELETE FROM public.progress_notes
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma');

-- Create session summary note
INSERT INTO public.progress_notes (member_id, practitioner_id, title, content, note_type, is_private, created_at)
SELECT
  m.id as member_id,
  m.practitioner_id,
  'Session Summary' as title,
  'EN: Follow-up session focused on accessing emotions and recognition in relationships. Patient shows increasing ability to identify emotional states without dissociating. Continuing work on internal safety.

FR: Séance de suivi centrée sur l''accès aux émotions et la reconnaissance dans les relations. La patiente montre une capacité croissante à identifier ses états émotionnels sans dissocier. Poursuite du travail sur la sécurité interne.' as content,
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
  'Clinical Observation / Observation clinique' as title,
  'EN: Good mentalization capacity when the setting feels safe. Tendency to freeze or over-adapt when perceiving expectations. Work on subjective recognition is progressing.

FR: Bonne capacité de mentalisation quand le cadre est sécurisant. Tendance au gel ou à la suradaptation quand elle perçoit une attente. Le travail sur la reconnaissance subjective progresse.' as content,
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
  'Treatment Plan / Plan de traitement' as title,
  'EN: Focus areas:
1. Internal safety and emotional regulation
2. Relationships without control or performance
3. Subjective recognition and experience validation
4. Gradual trauma work when window of tolerance allows

FR: Axes de travail:
1. Sécurité interne et régulation émotionnelle
2. Rapport au lien sans contrôle ni performance
3. Reconnaissance subjective et validation de l''expérience
4. Travail progressif sur le trauma corporel quand la fenêtre de tolérance le permet' as content,
  'treatment_plan' as note_type,
  true as is_private,
  NOW() - INTERVAL '30 days' as created_at
FROM public.members m
WHERE m.is_demo = true AND m.first_name = 'Emma';

-- ============================================
-- STEP 4: Update sessions with bilingual content
-- ============================================
UPDATE public.sessions
SET
  notes = 'EN: Session focused on exploring protective mechanisms in relationships. Patient identifies tendency to anticipate expectations to avoid disappointment. Working on the legitimacy of her own needs.

FR: Séance centrée sur l''exploration des mécanismes de protection dans le lien. La patiente identifie sa tendance à anticiper les attentes pour éviter la déception. Travail sur la légitimité de ses besoins propres.',
  summary = 'EN: Progress in awareness of over-adaptation patterns. Opening toward expressing authentic needs.
FR: Progrès dans la conscience des mécanismes de suradaptation. Ouverture vers l''expression des besoins authentiques.'
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma')
AND status = 'completed'
AND session_type = 'follow_up';

UPDATE public.sessions
SET
  notes = 'EN: First meeting. Gathered history and reasons for consultation. Therapeutic alliance building. Patient expresses need for recognition and safety in relationships.

FR: Première rencontre. Recueil de l''histoire et des motifs de consultation. Alliance thérapeutique en construction. La patiente exprime un besoin de reconnaissance et de sécurité dans le lien.',
  summary = 'EN: Initial consultation. Identified focus areas: internal safety, relationship patterns, subjective recognition.
FR: Consultation initiale. Identification des axes de travail: sécurité interne, rapport au lien, reconnaissance subjective.'
WHERE member_id IN (SELECT id FROM public.members WHERE is_demo = true AND first_name = 'Emma')
AND status = 'completed'
AND session_type = 'initial_consultation';
