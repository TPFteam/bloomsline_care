-- Phase 1 of the storage URL → path migration ("expand" step of expand-contract).
--
-- We're moving from "DB stores public/signed URL → render <img src>" to
-- "DB stores storage path → render mints a fresh signed URL on demand".
-- Path-based + RLS is the only model that supports revocable sharing
-- between users (a future requirement) — capability-token signed URLs
-- can't be revoked.
--
-- This migration ADDs path columns alongside the existing URL columns.
-- Code that lands in the same deploy reads the new columns first and
-- falls back to deriving a path from the URL columns if not yet
-- migrated. Existing rows continue to render exactly as before until
-- the data-migration script populates the new columns.
--
-- A later cleanup migration will drop the URL columns once we're
-- confident nothing reads them.

-- =====================================================
-- moments — add path columns
-- =====================================================

ALTER TABLE public.moments
  ADD COLUMN IF NOT EXISTS media_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

COMMENT ON COLUMN public.moments.media_path IS
  'Storage path inside the moments_media bucket (e.g. {user_id}/{moment_id}/image.jpg). Renderers should call createSignedUrl() at view time. Replaces media_url long-term.';
COMMENT ON COLUMN public.moments.thumbnail_path IS
  'Storage path for the thumbnail variant. Same bucket, same convention as media_path.';

-- =====================================================
-- moment_media — add media_path
-- =====================================================
-- Per-item media rows for multi-media moments (created in 20260221).
-- Same convention: path mirrors media_url, render code prefers path.

ALTER TABLE public.moment_media
  ADD COLUMN IF NOT EXISTS media_path TEXT;

COMMENT ON COLUMN public.moment_media.media_path IS
  'Storage path inside moments_media. Renderers should prefer this and call createSignedUrl().';

-- =====================================================
-- stories — add a parallel path-array JSONB
-- =====================================================
-- Stories currently store media as `media_urls JSONB` (an array of
-- public URLs) plus URLs embedded inside `content` blocks. The new
-- `media_paths` column mirrors `media_urls` but holds storage paths.
-- We keep the legacy `media_urls` field around during the migration.
-- A later cleanup migration removes it.

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_paths JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.stories.media_paths IS
  'Parallel to media_urls but holds storage paths inside the story-media bucket. Renderers should prefer this over media_urls and call createSignedUrl() at render time.';
