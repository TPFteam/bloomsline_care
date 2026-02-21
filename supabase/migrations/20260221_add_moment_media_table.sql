-- ============================================
-- Add moment_media junction table for multi-media moments
-- ============================================

-- Add 'mixed' to the moment_type enum for multi-type moments
ALTER TYPE moment_type ADD VALUE IF NOT EXISTS 'mixed';

-- Create moment_media table to store multiple media items per moment
CREATE TABLE IF NOT EXISTS moment_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    duration_seconds INTEGER,      -- for audio/video items
    file_size_bytes BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by moment_id
CREATE INDEX IF NOT EXISTS idx_moment_media_moment_id ON moment_media(moment_id);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE moment_media ENABLE ROW LEVEL SECURITY;

-- Users can view media for their own moments
CREATE POLICY "Users can view own moment media"
    ON moment_media FOR SELECT
    TO authenticated
    USING (
        moment_id IN (
            SELECT id FROM moments WHERE user_id = auth.uid()
        )
    );

-- Users can insert media for their own moments
CREATE POLICY "Users can insert own moment media"
    ON moment_media FOR INSERT
    TO authenticated
    WITH CHECK (
        moment_id IN (
            SELECT id FROM moments WHERE user_id = auth.uid()
        )
    );

-- Users can delete media for their own moments
CREATE POLICY "Users can delete own moment media"
    ON moment_media FOR DELETE
    TO authenticated
    USING (
        moment_id IN (
            SELECT id FROM moments WHERE user_id = auth.uid()
        )
    );
