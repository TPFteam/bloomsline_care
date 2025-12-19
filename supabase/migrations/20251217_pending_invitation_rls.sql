-- Migration: RLS Policies for Pending Invitations
-- Purpose: Allow members to view and accept/reject pending invitations by email

-- =====================================================
-- MEMBERS TABLE - View pending invitations by email
-- =====================================================

-- Members can view pending invitations where email matches their JWT email
CREATE POLICY "Members can view pending invitations by email"
  ON public.members FOR SELECT
  USING (
    status = 'pending'
    AND lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Members can update (accept) pending invitations where email matches
CREATE POLICY "Members can accept pending invitations"
  ON public.members FOR UPDATE
  USING (
    status = 'pending'
    AND lower(email) = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
  );

-- Members can delete (reject) pending invitations where email matches
CREATE POLICY "Members can reject pending invitations"
  ON public.members FOR DELETE
  USING (
    status = 'pending'
    AND lower(email) = lower(auth.jwt() ->> 'email')
  );

-- =====================================================
-- PRACTITIONER PROFILES - Members can view practitioner info
-- =====================================================

-- Members can view practitioner profiles for their practitioner or inviting practitioner
CREATE POLICY "Members can view inviting practitioner profile"
  ON public.practitioner_profiles FOR SELECT
  USING (
    -- For active members
    id IN (
      SELECT practitioner_id FROM public.members
      WHERE user_id = auth.uid()
    )
    OR
    -- For pending invitations (using JWT email)
    id IN (
      SELECT practitioner_id FROM public.members
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND status = 'pending'
    )
  );

-- =====================================================
-- USERS TABLE - Members can view practitioner user info
-- =====================================================

-- Members can view practitioner user info for invitations
CREATE POLICY "Members can view inviting practitioner user"
  ON public.users FOR SELECT
  USING (
    -- For active members
    id IN (
      SELECT practitioner_id FROM public.members
      WHERE user_id = auth.uid()
    )
    OR
    -- For pending invitations (using JWT email)
    id IN (
      SELECT practitioner_id FROM public.members
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND status = 'pending'
    )
  );
