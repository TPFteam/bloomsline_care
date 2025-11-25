-- Story Views Analytics Table
-- Run this in your Supabase SQL Editor

-- Create the story_views table
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  referrer TEXT -- where the visitor came from (e.g., google.com, twitter.com)
);

-- Create index for faster queries by story
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- Enable Row Level Security
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert a view (for tracking public views)
CREATE POLICY "Anyone can insert story views" ON story_views
  FOR INSERT
  WITH CHECK (true);

-- Policy: Story owners can read their own story views
CREATE POLICY "Story owners can read their story views" ON story_views
  FOR SELECT
  USING (
    story_id IN (
      SELECT id FROM stories WHERE user_id = auth.uid()
    )
  );

-- Policy: Story owners can delete their own story views (optional, for cleanup)
CREATE POLICY "Story owners can delete their story views" ON story_views
  FOR DELETE
  USING (
    story_id IN (
      SELECT id FROM stories WHERE user_id = auth.uid()
    )
  );
