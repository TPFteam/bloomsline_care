-- ============================================
-- Make practitioner_id optional for self-serve users
-- ============================================

-- Allow members to exist without a practitioner (self-serve users)
ALTER TABLE public.members ALTER COLUMN practitioner_id DROP NOT NULL;

-- Add is_self_serve flag to distinguish self-serve vs practitioner-managed members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_self_serve BOOLEAN DEFAULT false;

-- Update RLS policy to allow self-serve users to view their own record
DROP POLICY IF EXISTS "Members can view own record" ON public.members;
CREATE POLICY "Members can view own record"
  ON public.members FOR SELECT
  USING (
    auth.uid() = practitioner_id
    OR auth.uid() = user_id
  );

-- Allow self-serve users to create their own member record
DROP POLICY IF EXISTS "Self-serve users can create own member" ON public.members;
CREATE POLICY "Self-serve users can create own member"
  ON public.members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_self_serve = true
  );

-- Allow self-serve users to update their own record
DROP POLICY IF EXISTS "Self-serve users can update own member" ON public.members;
CREATE POLICY "Self-serve users can update own member"
  ON public.members FOR UPDATE
  USING (
    auth.uid() = user_id
    AND is_self_serve = true
  );

-- Keep existing practitioner policies (they still work with OR condition in SELECT)
