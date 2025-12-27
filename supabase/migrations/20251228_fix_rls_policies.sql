-- ============================================
-- Security Fix: RLS Policy Improvements
-- ============================================

-- ============================================
-- 1. Fix overly permissive notification INSERT policy
-- Only authenticated users should be able to have notifications
-- created for them (via service role in API)
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can insert notifications" ON notifications;

-- Create a more restrictive policy - only service role can insert
-- (This effectively requires using service role key in API)
-- For authenticated users, we allow insert only if they're inserting for themselves
CREATE POLICY "Authenticated users can receive notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. Fix notification_deliveries - restrict to service role
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can manage deliveries" ON notification_deliveries;

-- Only allow authenticated service role operations
-- Regular users shouldn't access this table at all
-- The service role key bypasses RLS anyway

-- ============================================
-- 3. Add delete policy for notifications
-- Users should be able to delete their own notifications
-- ============================================

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. Improve bookings INSERT policy
-- Only allow bookings for practitioners with enabled booking pages
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

-- Create a more secure policy
CREATE POLICY "Anyone can create bookings for enabled practitioners"
  ON bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_settings
      WHERE user_id = bookings.practitioner_id
      AND booking_page_enabled = true
    )
  );

-- ============================================
-- 5. Add policy for clients to view their own bookings
-- This allows clients to see bookings they've made
-- ============================================

DROP POLICY IF EXISTS "Clients can view own bookings by email" ON bookings;
CREATE POLICY "Clients can view own bookings by email"
  ON bookings FOR SELECT
  USING (
    -- Practitioners can always see their bookings (existing policy)
    auth.uid() = practitioner_id
    OR
    -- Clients can see bookings linked to their member account
    (
      member_id IS NOT NULL
      AND member_id IN (
        SELECT id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 6. Ensure calendar_connections tokens are protected
-- Already has good RLS, just adding explicit service role note
-- ============================================

-- Calendar connections are already properly protected
-- Users can only manage their own connections

-- ============================================
-- 7. Add missing INSERT policy for bloom_messages via conversation
-- Ensure users can only add messages to their own conversations
-- ============================================

-- Drop existing if it exists to recreate with better check
DROP POLICY IF EXISTS "Users can insert own messages" ON bloom_messages;

CREATE POLICY "Users can insert messages in own conversations"
  ON bloom_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND
    conversation_id IN (
      SELECT id FROM bloom_conversations WHERE user_id = auth.uid()
    )
  );
