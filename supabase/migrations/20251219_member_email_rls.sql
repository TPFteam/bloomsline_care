-- Migration: Allow members to view their record by email match
-- Purpose: Fallback for when user_id is not yet linked

-- Drop the old policy if exists
DROP POLICY IF EXISTS "Members can view own member record" ON public.members;

-- Create updated policy that allows viewing by user_id OR email
CREATE POLICY "Members can view own member record"
  ON public.members FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Also update user_id when member logs in with matching email
CREATE OR REPLACE FUNCTION public.link_member_user_on_login()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user logs in, link their user_id to member record if email matches
  UPDATE public.members
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for when user is created/updated
DROP TRIGGER IF EXISTS link_member_on_user_login ON auth.users;
CREATE TRIGGER link_member_on_user_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_member_user_on_login();

-- Run once to link existing members
UPDATE public.members m
SET user_id = u.id
FROM auth.users u
WHERE m.email = u.email
  AND m.user_id IS NULL;
