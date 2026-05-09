-- Server-side file-type + size validation on the `story-media` bucket.
--
-- The other patient-touched buckets (moments_media, resource-responses) were
-- created with `file_size_limit` and `allowed_mime_types` set. story-media
-- predates that pattern (created 2025-11-23) and accepts arbitrary uploads —
-- including executables, large archives, anything a malicious client cares
-- to send. Bucket-level validation is enforced by Supabase Storage on every
-- upload before bytes are persisted, so a client that lies about the
-- declared MIME type still has to lie *consistently* (and we only persist
-- the file if the declared type is in the allowlist).
--
-- This is a partial defense — the declared `Content-Type` is still
-- attacker-controlled. Magic-byte sniffing would require an Edge Function
-- that runs on upload events; tracked separately. The bucket allowlist
-- closes the trivial path: any client that sends `Content-Type:
-- application/x-msdownload` is rejected at the storage edge.
--
-- Allowlist mirrors what the apps legitimately upload to story-media
-- today: images (in story content), short videos, and voice notes.
-- 50MB matches the care-app client-side guard in block-editor.tsx.
--
-- Idempotent: UPDATE on existing row.

UPDATE storage.buckets
SET file_size_limit = 52428800,  -- 50 MB
    allowed_mime_types = ARRAY[
      -- Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      -- Video
      'video/mp4', 'video/webm', 'video/quicktime',
      -- Audio (voice notes from the mobile app + browser recordings from care)
      'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a'
    ]
WHERE id = 'story-media';
