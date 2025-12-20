-- ============================================
-- Create Moments Media Storage Bucket
-- ============================================

-- Create the moments_media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moments_media',
    'moments_media',
    true,  -- Public bucket for easy access
    52428800,  -- 50MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for moments_media bucket
-- ============================================

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own moments media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'moments_media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own moments media"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'moments_media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can view files (since bucket is public)
CREATE POLICY "Public can view moments media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'moments_media');

-- Policy: Users can update their own files
CREATE POLICY "Users can update own moments media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'moments_media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own moments media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'moments_media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
