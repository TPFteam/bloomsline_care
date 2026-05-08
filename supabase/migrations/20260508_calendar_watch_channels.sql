-- Recurring Sessions — Phase 2: Two-way Google Calendar sync
--
-- Adds the infrastructure to listen for changes that originate in Google
-- Calendar and reconcile them back into our `bookings` / `sessions` rows.
--
-- 1) calendar_watch_channels — one row per active Google "watch" channel.
--    Google sends a small POST to our webhook each time the calendar changes;
--    the channel_id in the request maps back to a practitioner here.
--    Channels expire after ~7 days; a cron renews them before expiry.
--
-- 2) bookings.attendee_status — last known patient response (accepted /
--    declined / tentative / needs_action). Surfaced as a UI badge so the
--    practitioner notices a decline before the day-of.
--
-- 3) bookings.detached_from_series — true when a single occurrence has been
--    moved/edited away from the series rule (Google "exception" instance).
--    Exceptions stay in our DB but no longer mirror the parent's RRULE.
--
-- 4) sessions mirrors the same two columns so the member-tracking display
--    can reflect the same state without an extra join.

-- ============================================================================
-- calendar_watch_channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_watch_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Google identifiers — required to acknowledge incoming pings.
  channel_id TEXT NOT NULL UNIQUE,    -- our generated UUID; Google echoes this in headers
  resource_id TEXT NOT NULL,          -- Google's opaque calendar resource handle

  -- Google's incremental-sync token. We update this every time we successfully
  -- pull events; it lets us ask "what changed since last time?" without a full re-scan.
  sync_token TEXT,

  -- Channel TTL. Google caps watches at ~7 days; we re-register before this passes.
  expires_at TIMESTAMPTZ NOT NULL,

  -- Stop-channel handle (for graceful unsubscription)
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_watch_channels_user
  ON calendar_watch_channels(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_watch_channels_active_expires
  ON calendar_watch_channels(active, expires_at)
  WHERE active = true;

-- RLS — only the practitioner themselves can see their own watch row;
-- the webhook endpoint uses the admin client.
ALTER TABLE calendar_watch_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_watch_channels" ON calendar_watch_channels;
CREATE POLICY "users_view_own_watch_channels"
  ON calendar_watch_channels FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- bookings: attendee response + series-detach flag
-- ============================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS attendee_status TEXT
    CHECK (attendee_status IN ('accepted', 'declined', 'tentative', 'needs_action')),
  ADD COLUMN IF NOT EXISTS detached_from_series BOOLEAN DEFAULT false;

-- ============================================================================
-- sessions: mirror the same two columns
-- ============================================================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS attendee_status TEXT
    CHECK (attendee_status IN ('accepted', 'declined', 'tentative', 'needs_action')),
  ADD COLUMN IF NOT EXISTS detached_from_series BOOLEAN DEFAULT false;
