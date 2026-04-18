-- Add image attachments support for session notes.
-- Stores an array of { url, filename, size } objects per note.
-- Images are stored in the 'session-notes-attachments' Supabase Storage bucket.

ALTER TABLE progress_notes
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Storage bucket must be created via Supabase dashboard:
-- Name: session-notes-attachments
-- Public: false (private — accessed via signed URLs)
-- Max file size: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
