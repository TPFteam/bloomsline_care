-- Migration: Allow NULL assignment_id in resource_responses
-- Purpose: Support responses to shared resources (which don't have assignments)

-- Make assignment_id nullable
ALTER TABLE public.resource_responses ALTER COLUMN assignment_id DROP NOT NULL;

-- Add comment explaining why it's nullable
COMMENT ON COLUMN public.resource_responses.assignment_id IS 'NULL for responses to shared resources, references assignment for assigned resources';
