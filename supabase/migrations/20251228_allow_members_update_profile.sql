-- ============================================
-- Allow all members to update their own profile
-- ============================================

-- Drop the self-serve only update policy
DROP POLICY IF EXISTS "Self-serve users can update own member" ON public.members;

-- Create a new policy that allows ALL members to update their own record
-- (both self-serve and practitioner-managed members)
CREATE POLICY "Members can update own profile"
  ON public.members FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );
