-- Add signup source tracking to users table
-- This allows us to track whether a user came from:
-- 1. Organic waitlist signup
-- 2. Practitioner invitation (added as a member)

-- Add signup_source column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'waitlist';

-- Add constraint for allowed values
ALTER TABLE public.users
ADD CONSTRAINT users_signup_source_check
CHECK (signup_source IN ('waitlist', 'practitioner_invite'));

-- Add invited_by_practitioner_id column (nullable - only set for practitioner invites)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS invited_by_practitioner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS users_signup_source_idx ON public.users(signup_source);
CREATE INDEX IF NOT EXISTS users_invited_by_practitioner_idx ON public.users(invited_by_practitioner_id);

-- Add comments for documentation
COMMENT ON COLUMN public.users.signup_source IS 'How the user signed up: waitlist (organic) or practitioner_invite (added by practitioner as member)';
COMMENT ON COLUMN public.users.invited_by_practitioner_id IS 'The practitioner who invited this user (only set when signup_source is practitioner_invite)';
