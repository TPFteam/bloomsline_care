-- Add 'link_only' to visibility options for resources
-- This allows resources to be shared via link without being listed in the Digital Library

-- Update the check constraint to include 'link_only'
ALTER TABLE public.resources
DROP CONSTRAINT IF EXISTS resources_visibility_check;

ALTER TABLE public.resources
ADD CONSTRAINT resources_visibility_check
CHECK (visibility IN ('private', 'public', 'link_only'));

-- Update RLS policy to allow anyone to view link_only resources (like public ones)
-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can view public published resources" ON public.resources;

-- Create new policy that includes both 'public' and 'link_only'
CREATE POLICY "Anyone can view public or link_only published resources"
  ON public.resources FOR SELECT
  USING (
    (visibility IN ('public', 'link_only') AND status = 'published')
    OR auth.uid() = practitioner_id
  );

-- Drop the old owner-only policy since it's now combined above
DROP POLICY IF EXISTS "Practitioners can view own resources" ON public.resources;

-- Add index for the new visibility value
CREATE INDEX IF NOT EXISTS resources_visibility_link_only_idx
  ON public.resources(visibility)
  WHERE visibility = 'link_only';

-- Update comment
COMMENT ON COLUMN public.resources.visibility IS 'Resource visibility: private (only owner), link_only (anyone with link, not in library), public (in Digital Library)';
