-- ============================================================================
-- Blog post translations (EN + FR)
-- ============================================================================
-- Run on the CARE Supabase project (sfzlbjdjqbzxruwzebjc).
--
-- The practitioner writes in one language, which stays in the existing
-- title / excerpt / content columns (with `language` marking which one).
-- Any additional language variants live here, keyed by locale:
--   { "en": { "title": "...", "excerpt": "...", "content": "..." } }
-- Cover image and slug stay shared across languages.
--
-- On approval, the API folds the original + translations into
-- published_snapshot.localized so the public site needs no extra reads.
-- Idempotent.
-- ============================================================================

alter table blog_posts
  add column if not exists translations jsonb not null default '{}'::jsonb;
