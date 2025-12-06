-- Create calendar integration and booking tables
-- This enables practitioners to connect their calendars and accept bookings

-- Create enum for booking status
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- Create enum for day of week
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Create calendar_connections table (stores OAuth tokens)
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider info
  provider TEXT NOT NULL DEFAULT 'google', -- 'google', 'outlook', etc.
  provider_email TEXT, -- Email associated with the calendar account

  -- OAuth tokens (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Calendar settings
  calendar_id TEXT DEFAULT 'primary', -- Which calendar to use
  sync_enabled BOOLEAN DEFAULT true,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Create availability_schedules table (weekly recurring availability)
CREATE TABLE IF NOT EXISTS availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule details
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'America/New_York',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT unique_user_day_slot UNIQUE (user_id, day_of_week, start_time, end_time)
);

-- Create availability_overrides table (specific date overrides)
CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Override details
  override_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false, -- false = blocked, true = extra availability
  start_time TIME, -- null if blocking entire day
  end_time TIME,
  reason TEXT, -- e.g., "Holiday", "Vacation", "Special hours"

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_override_time CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

-- Create booking_settings table (practitioner preferences)
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Session defaults
  default_duration INTEGER DEFAULT 60, -- minutes
  buffer_before INTEGER DEFAULT 0, -- minutes before appointment
  buffer_after INTEGER DEFAULT 15, -- minutes after appointment

  -- Booking rules
  min_notice_hours INTEGER DEFAULT 24, -- minimum hours in advance to book
  max_advance_days INTEGER DEFAULT 60, -- how far in advance can book

  -- Session types offered
  session_types JSONB DEFAULT '[
    {"id": "initial", "name": "Initial Consultation", "duration": 60, "price": null},
    {"id": "follow_up", "name": "Follow-up Session", "duration": 50, "price": null},
    {"id": "check_in", "name": "Check-in", "duration": 30, "price": null}
  ]',

  -- Booking page settings
  booking_page_enabled BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false, -- manual approval vs auto-confirm
  cancellation_policy TEXT,
  booking_instructions TEXT,

  -- Notifications
  email_notifications BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bookings table (actual appointments)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Client info (can be existing member or guest)
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,

  -- Booking details
  session_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,

  -- Status
  status booking_status DEFAULT 'pending',

  -- Additional info
  notes TEXT, -- Client's notes/reason for booking
  practitioner_notes TEXT, -- Private notes from practitioner

  -- Calendar sync
  google_event_id TEXT, -- ID of event in Google Calendar
  outlook_event_id TEXT, -- ID of event in Outlook

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT, -- 'client' or 'practitioner'
  cancellation_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_booking_time CHECK (start_time < end_time)
);

-- Create indexes
CREATE INDEX idx_calendar_connections_user ON calendar_connections(user_id);
CREATE INDEX idx_availability_schedules_user ON availability_schedules(user_id);
CREATE INDEX idx_availability_schedules_day ON availability_schedules(day_of_week);
CREATE INDEX idx_availability_overrides_user ON availability_overrides(user_id);
CREATE INDEX idx_availability_overrides_date ON availability_overrides(override_date);
CREATE INDEX idx_booking_settings_user ON booking_settings(user_id);
CREATE INDEX idx_bookings_practitioner ON bookings(practitioner_id);
CREATE INDEX idx_bookings_member ON bookings(member_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_client_email ON bookings(client_email);

-- Enable RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_connections
CREATE POLICY "Users can manage own calendar connections"
  ON calendar_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for availability_schedules
CREATE POLICY "Users can manage own availability"
  ON availability_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read availability for booking (read-only)
CREATE POLICY "Anyone can view practitioner availability"
  ON availability_schedules
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM booking_settings
      WHERE user_id = availability_schedules.user_id
      AND booking_page_enabled = true
    )
  );

-- RLS Policies for availability_overrides
CREATE POLICY "Users can manage own overrides"
  ON availability_overrides
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read overrides for booking
CREATE POLICY "Anyone can view practitioner overrides"
  ON availability_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM booking_settings
      WHERE user_id = availability_overrides.user_id
      AND booking_page_enabled = true
    )
  );

-- RLS Policies for booking_settings
CREATE POLICY "Users can manage own booking settings"
  ON booking_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read booking settings for booking page
CREATE POLICY "Anyone can view enabled booking settings"
  ON booking_settings
  FOR SELECT
  USING (booking_page_enabled = true);

-- RLS Policies for bookings
CREATE POLICY "Practitioners can view own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

-- Anyone can create a booking (for public booking page)
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Clients can view their own bookings by email (via RPC function instead)
-- We'll handle client-side booking lookup via a secure RPC function

-- Create updated_at triggers
CREATE TRIGGER trigger_availability_schedules_updated_at
  BEFORE UPDATE ON availability_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_practitioner_profile_updated_at();

CREATE TRIGGER trigger_booking_settings_updated_at
  BEFORE UPDATE ON booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_practitioner_profile_updated_at();

CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_practitioner_profile_updated_at();

-- Function to get available time slots for a practitioner on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_practitioner_id UUID,
  p_date DATE,
  p_duration INTEGER DEFAULT 60
)
RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ
) AS $$
DECLARE
  v_day day_of_week;
  v_timezone TEXT := 'America/New_York';
  v_buffer_before INTEGER := 0;
  v_buffer_after INTEGER := 15;
  v_min_notice_hours INTEGER := 24;
  v_min_booking_time TIMESTAMPTZ;
BEGIN
  -- Get day of week (trim removes padding from to_char output)
  v_day := trim(lower(to_char(p_date, 'day')))::day_of_week;

  -- Get booking settings (with defaults if not found)
  SELECT
    COALESCE(bs.buffer_before, 0),
    COALESCE(bs.buffer_after, 15),
    COALESCE(bs.min_notice_hours, 24)
  INTO v_buffer_before, v_buffer_after, v_min_notice_hours
  FROM booking_settings bs
  WHERE bs.user_id = p_practitioner_id;

  -- Get timezone from availability schedule (with default)
  SELECT COALESCE(avs.timezone, 'America/New_York')
  INTO v_timezone
  FROM availability_schedules avs
  WHERE avs.user_id = p_practitioner_id
  LIMIT 1;

  -- If still null, use default
  IF v_timezone IS NULL THEN
    v_timezone := 'America/New_York';
  END IF;

  -- Calculate minimum booking time
  v_min_booking_time := NOW() + (v_min_notice_hours || ' hours')::INTERVAL;

  -- Check if date is blocked by override
  IF EXISTS (
    SELECT 1 FROM availability_overrides ao
    WHERE ao.user_id = p_practitioner_id
    AND ao.override_date = p_date
    AND ao.is_available = false
    AND ao.start_time IS NULL
  ) THEN
    RETURN;
  END IF;

  -- Return available slots based on schedule
  RETURN QUERY
  WITH schedule_slots AS (
    SELECT
      (p_date || ' ' || avs.start_time)::TIMESTAMP AT TIME ZONE v_timezone AS slot_start_tz,
      (p_date || ' ' || avs.end_time)::TIMESTAMP AT TIME ZONE v_timezone AS slot_end_tz
    FROM availability_schedules avs
    WHERE avs.user_id = p_practitioner_id
    AND avs.day_of_week = v_day
    AND avs.is_active = true
  ),
  existing_bookings AS (
    SELECT
      b.start_time - (v_buffer_before || ' minutes')::INTERVAL AS blocked_start,
      b.end_time + (v_buffer_after || ' minutes')::INTERVAL AS blocked_end
    FROM bookings b
    WHERE b.practitioner_id = p_practitioner_id
    AND b.start_time::DATE = p_date
    AND b.status NOT IN ('cancelled')
  ),
  time_slots AS (
    SELECT
      generate_series(
        ss.slot_start_tz,
        ss.slot_end_tz - (p_duration || ' minutes')::INTERVAL,
        '30 minutes'::INTERVAL
      ) AS slot_time
    FROM schedule_slots ss
  )
  SELECT
    ts.slot_time AS slot_start,
    ts.slot_time + (p_duration || ' minutes')::INTERVAL AS slot_end
  FROM time_slots ts
  WHERE NOT EXISTS (
    SELECT 1 FROM existing_bookings eb
    WHERE ts.slot_time < eb.blocked_end
    AND ts.slot_time + (p_duration || ' minutes')::INTERVAL > eb.blocked_start
  )
  AND ts.slot_time >= v_min_booking_time
  ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE calendar_connections IS 'OAuth connections to external calendars (Google, Outlook)';
COMMENT ON TABLE availability_schedules IS 'Weekly recurring availability for practitioners';
COMMENT ON TABLE availability_overrides IS 'Date-specific availability overrides (blocks or extra hours)';
COMMENT ON TABLE booking_settings IS 'Practitioner booking preferences and settings';
COMMENT ON TABLE bookings IS 'Appointment bookings between practitioners and clients';
COMMENT ON FUNCTION get_available_slots IS 'Returns available time slots for a practitioner on a given date';
