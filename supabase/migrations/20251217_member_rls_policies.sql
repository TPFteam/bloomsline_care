-- Migration: RLS Policies for Member Access
-- Purpose: Allow members to view and interact with their assigned/shared resources

-- =====================================================
-- RESOURCE ASSIGNMENTS - Members can view their own
-- =====================================================

-- Members can view their own assignments
CREATE POLICY "Members can view own assignments"
  ON public.resource_assignments FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can update their own assignment status (mark as in_progress)
CREATE POLICY "Members can update own assignment status"
  ON public.resource_assignments FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RESOURCES - Members can view assigned/shared resources
-- =====================================================

-- Members can view resources they have assignments for or that are shared with them
CREATE POLICY "Members can view assigned and shared resources"
  ON public.resources FOR SELECT
  USING (
    -- Resources assigned to member
    id IN (
      SELECT resource_id FROM public.resource_assignments
      WHERE member_id IN (
        SELECT id FROM public.members WHERE user_id = auth.uid()
      )
    )
    OR
    -- Resources shared with member
    id IN (
      SELECT resource_id FROM public.member_shared_resources
      WHERE member_id IN (
        SELECT id FROM public.members WHERE user_id = auth.uid()
      )
    )
    -- Also include their existing access (public resources, own resources, etc.)
    OR practitioner_id = auth.uid()
    OR visibility = 'public'
  );

-- =====================================================
-- MEMBER SHARED RESOURCES - Members can view their shares
-- =====================================================

-- Members can view resources shared with them
CREATE POLICY "Members can view shared resources"
  ON public.member_shared_resources FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can update viewed_at when they view a shared resource
CREATE POLICY "Members can update viewed_at on shared resources"
  ON public.member_shared_resources FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RESOURCE RESPONSES - Members can manage their responses
-- =====================================================

-- Members can create their own responses
CREATE POLICY "Members can create own responses"
  ON public.resource_responses FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can update their own draft responses
CREATE POLICY "Members can update own draft responses"
  ON public.resource_responses FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
    AND status = 'draft'
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can view their own responses
CREATE POLICY "Members can view own responses"
  ON public.resource_responses FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RESOURCE SUBMISSIONS - Members can manage their submissions
-- =====================================================

-- Members can create submissions
CREATE POLICY "Members can create own submissions"
  ON public.resource_submissions FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can update their own draft submissions
CREATE POLICY "Members can update own draft submissions"
  ON public.resource_submissions FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
    AND status = 'draft'
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can view their own submissions
CREATE POLICY "Members can view own submissions"
  ON public.resource_submissions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- MEMBERS TABLE - Members can view their own record
-- =====================================================

-- Members can view their own member record
CREATE POLICY "Members can view own member record"
  ON public.members FOR SELECT
  USING (
    user_id = auth.uid()
  );
