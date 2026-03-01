-- Add publications column to both practitioner tables
-- Publications: podcasts, books, blogs, articles, etc.

ALTER TABLE public_practitioners
  ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]';

ALTER TABLE practitioner_profiles
  ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]';
