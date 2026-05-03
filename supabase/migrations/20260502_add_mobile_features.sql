-- Add mobile_features column to users table
-- Controls which features are visible in the mobile app for each practitioner's patients
-- Default: all features enabled
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mobile_features JSONB DEFAULT '{"moments": true, "stories": true, "my_care": true}'::jsonb;

COMMENT ON COLUMN public.users.mobile_features IS 'Per-practitioner toggle for mobile app features (moments, stories, my_care). Affects all patients linked to this practitioner.';
