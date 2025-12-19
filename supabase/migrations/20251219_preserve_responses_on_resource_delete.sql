-- Migration: Preserve responses when resources are deleted
-- Purpose: Keep submission data even if the original resource is deleted

-- Add resource_snapshot column to store a copy of the resource at submission time
ALTER TABLE public.resource_responses
ADD COLUMN IF NOT EXISTS resource_snapshot JSONB;

-- Make resource_id nullable (so it can be SET NULL when resource is deleted)
ALTER TABLE public.resource_responses
ALTER COLUMN resource_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE public.resource_responses
DROP CONSTRAINT IF EXISTS resource_responses_resource_id_fkey;

-- Re-add the foreign key with ON DELETE SET NULL instead of CASCADE
ALTER TABLE public.resource_responses
ADD CONSTRAINT resource_responses_resource_id_fkey
FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE SET NULL;

-- Add comment explaining the snapshot column
COMMENT ON COLUMN public.resource_responses.resource_snapshot IS 'Snapshot of resource (title, blocks) at submission time for data preservation';
