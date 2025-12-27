-- ============================================
-- Notification System Tables
-- ============================================

-- 1. Notifications Table (main notification storage)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('practitioner', 'member')),

  -- Notification Content
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Related Entity
  entity_type TEXT, -- 'resource', 'session', 'booking', 'member', 'resource_response'
  entity_id UUID,

  -- Metadata (extra data like names, titles, etc.)
  metadata JSONB DEFAULT '{}',

  -- Deep link to relevant page
  action_url TEXT,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = FALSE;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- 2. Notification Deliveries Table (for tracking email/push delivery)
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,

  -- Delivery Info
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),

  -- Delivery Details
  recipient_address TEXT, -- Email address or phone number
  external_id TEXT, -- SendGrid message ID, FCM ID, etc.
  error_message TEXT,

  -- Timestamps
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_pending ON notification_deliveries(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_deliveries_notification ON notification_deliveries(notification_id);

-- 3. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('practitioner', 'member')),

  -- Global Settings
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,

  -- Quiet Hours (don't send push during these times)
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'UTC',

  -- Per-Type Preferences
  -- Each key is a notification type, value is { email: bool, push: bool }
  preferences JSONB DEFAULT '{
    "resource_shared": {"email": true, "push": true},
    "resource_assigned": {"email": true, "push": true},
    "assignment_due_soon": {"email": false, "push": true},
    "assignment_overdue": {"email": true, "push": true},
    "session_scheduled": {"email": true, "push": true},
    "session_reminder_24h": {"email": true, "push": true},
    "session_reminder_1h": {"email": false, "push": true},
    "session_cancelled": {"email": true, "push": true},
    "session_rescheduled": {"email": true, "push": true},
    "booking_confirmed": {"email": true, "push": true},
    "booking_cancelled": {"email": true, "push": true},
    "booking_request": {"email": true, "push": true},
    "resource_submitted": {"email": true, "push": true},
    "resource_started": {"email": false, "push": false},
    "member_invitation_accepted": {"email": true, "push": false},
    "member_invitation_rejected": {"email": false, "push": false},
    "member_inactive": {"email": true, "push": false},
    "reschedule_requested": {"email": true, "push": true},
    "session_confirmed": {"email": false, "push": true},
    "weekly_summary": {"email": true, "push": false},
    "ritual_reminder": {"email": false, "push": true},
    "bloom_checkin": {"email": false, "push": true}
  }',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Push Tokens Table (for mobile/web push notifications)
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT, -- For managing multiple devices
  device_name TEXT, -- Human-readable device name

  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_active ON push_tokens(user_id) WHERE is_active = TRUE;

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Notification Deliveries: Only service role
CREATE POLICY "Service can manage deliveries"
  ON notification_deliveries FOR ALL
  USING (true);

-- Notification Preferences: Users can manage their own
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Push Tokens: Users can manage their own
CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Realtime Subscriptions
-- ============================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
