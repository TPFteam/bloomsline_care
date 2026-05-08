-- Add the `is_recurring` column on `resources`.
--
-- The worksheet editor has been writing `is_recurring: true|false` to the
-- resources table since the recurring-resource feature was introduced (see
-- src/app/resources/create/worksheet/page.tsx:1770/1786 in the create + update
-- payloads). The column was never declared in a migration, so writes have
-- been silently failing or only landing in environments where it had been
-- added by hand via the Supabase dashboard. This migration makes the
-- column part of the schema for real.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS does nothing if the column already
-- exists in the target environment (likely true in production where the
-- column was added by hand).

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.resources.is_recurring IS
  'When TRUE, a member can submit this resource multiple times (weekly check-ins, daily logs, etc.) and each submission is preserved as its own resource_responses row. When FALSE, the resource is meant to be filled out once.';
