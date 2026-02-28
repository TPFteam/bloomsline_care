-- ============================================
-- MERGE SMALL SESSION NOTES INTO SESSION SUMMARY
-- For each session: concatenate all non-summary notes into the
-- session_summary note (create one if it doesn't exist), then
-- delete the small notes.
-- ============================================

-- Step 1: Append small notes to EXISTING session_summary notes
WITH aggregated AS (
  SELECT
    pn.session_id,
    pn.member_id,
    pn.practitioner_id,
    string_agg(
      pn.content,
      E'\n\n---\n\n'
      ORDER BY pn.created_at ASC
    ) AS merged_content
  FROM progress_notes pn
  WHERE pn.session_id IS NOT NULL
    AND pn.note_type != 'session_summary'
  GROUP BY pn.session_id, pn.member_id, pn.practitioner_id
),
existing_summaries AS (
  SELECT DISTINCT ON (session_id)
    id, session_id, content
  FROM progress_notes
  WHERE note_type = 'session_summary'
    AND session_id IS NOT NULL
  ORDER BY session_id, created_at ASC
)
UPDATE progress_notes pn
SET
  content = es.content || E'\n\n---\n\n' || agg.merged_content,
  updated_at = now()
FROM existing_summaries es
JOIN aggregated agg ON agg.session_id = es.session_id
WHERE pn.id = es.id;

-- Step 2: Create session_summary notes for sessions that don't have one yet
WITH aggregated AS (
  SELECT
    pn.session_id,
    pn.member_id,
    pn.practitioner_id,
    string_agg(
      pn.content,
      E'\n\n---\n\n'
      ORDER BY pn.created_at ASC
    ) AS merged_content
  FROM progress_notes pn
  WHERE pn.session_id IS NOT NULL
    AND pn.note_type != 'session_summary'
  GROUP BY pn.session_id, pn.member_id, pn.practitioner_id
),
sessions_with_summary AS (
  SELECT DISTINCT session_id
  FROM progress_notes
  WHERE note_type = 'session_summary'
    AND session_id IS NOT NULL
)
INSERT INTO progress_notes (member_id, practitioner_id, session_id, content, note_type, is_private, created_at, updated_at)
SELECT
  agg.member_id,
  agg.practitioner_id,
  agg.session_id,
  agg.merged_content,
  'session_summary',
  true,
  now(),
  now()
FROM aggregated agg
WHERE agg.session_id NOT IN (SELECT session_id FROM sessions_with_summary);

-- Step 3: Delete the small notes (now merged)
DELETE FROM progress_notes
WHERE session_id IS NOT NULL
  AND note_type != 'session_summary';
