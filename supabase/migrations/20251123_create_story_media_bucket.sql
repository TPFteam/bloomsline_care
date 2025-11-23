-- Create storage bucket for story media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-media', 'story-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for story-media bucket

-- Policy: Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'story-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to read their own files
CREATE POLICY "Users can read own media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'story-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'story-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access (for published stories)
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-media');
