-- Allow a user to be a member under multiple practitioners.
-- Drop the old unique constraint on user_id alone,
-- replace with a composite unique on (user_id, practitioner_id).

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_user_id_unique;

-- Clear user_id on soft-deleted rows to avoid conflicts
UPDATE public.members SET user_id = NULL WHERE deleted_at IS NOT NULL AND user_id IS NOT NULL;

ALTER TABLE public.members ADD CONSTRAINT members_user_practitioner_unique
  UNIQUE (user_id, practitioner_id);
