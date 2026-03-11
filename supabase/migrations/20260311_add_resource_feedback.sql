-- Add member feedback column to resource_responses
-- Values: 'negative', 'neutral', 'positive' (or NULL if skipped)
ALTER TABLE public.resource_responses
  ADD COLUMN IF NOT EXISTS member_feedback TEXT CHECK (member_feedback IN ('negative', 'neutral', 'positive'));

-- Add member feedback to shared resources (for resources without a response record)
ALTER TABLE public.member_shared_resources
  ADD COLUMN IF NOT EXISTS member_feedback TEXT CHECK (member_feedback IN ('negative', 'neutral', 'positive'));
