-- Migration: Merge assessments into worksheets
-- This migration updates all existing assessment resources to be worksheets with scoring enabled
-- The assessment data is preserved in the settings field

-- Update all assessment type resources to worksheet type
-- The existing settings (questions, scoring ranges, etc.) are preserved
UPDATE resources
SET type = 'worksheet',
    settings = CASE
      -- If settings already has enableScoring, keep it as is
      WHEN settings->>'enableScoring' IS NOT NULL THEN settings
      -- Otherwise, add enableScoring: true to preserve assessment behavior
      ELSE jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{enableScoring}',
        'true'::jsonb
      )
    END,
    updated_at = NOW()
WHERE type = 'assessment';

-- Add a comment to document this migration
COMMENT ON TABLE resources IS 'Resources table - assessment type has been merged into worksheet with enableScoring flag';
