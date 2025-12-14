-- Update member_shared_resources unique constraint
-- Allow multiple practitioners to share the same resource with the same member
-- Each practitioner-member-resource combination should be unique

-- Drop the old constraint
ALTER TABLE public.member_shared_resources
DROP CONSTRAINT IF EXISTS member_shared_resources_member_id_resource_id_key;

-- Add the new constraint that includes practitioner_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'member_shared_resources_member_resource_practitioner_key'
  ) THEN
    ALTER TABLE public.member_shared_resources
    ADD CONSTRAINT member_shared_resources_member_resource_practitioner_key
    UNIQUE(member_id, resource_id, practitioner_id);
  END IF;
END $$;
