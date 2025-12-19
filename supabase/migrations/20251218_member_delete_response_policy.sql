-- Migration: Allow members to delete their own responses
-- Purpose: Enable members to delete and re-submit their worksheet responses

-- Members can delete their own responses
CREATE POLICY "Members can delete own responses"
  ON public.resource_responses FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );
