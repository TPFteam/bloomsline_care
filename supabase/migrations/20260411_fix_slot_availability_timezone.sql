-- Fix booking conflict check in get_available_slots to use practitioner's timezone
-- Previously: b.start_time::DATE = p_date (compares UTC date to local date — misses midnight-boundary bookings)
-- Now: converts start_time to practitioner's timezone before comparing dates

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
      -- Interpret schedule times as being in the practitioner's timezone, convert to UTC
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
    -- FIX: Convert booking time to practitioner's timezone before comparing dates
    -- Previously: b.start_time::DATE = p_date (used UTC date, missed midnight-boundary bookings)
    AND (b.start_time AT TIME ZONE v_timezone)::DATE = p_date
    AND b.status NOT IN ('cancelled')
  ),
  -- Also check sessions table for conflicts (sessions without bookings)
  existing_sessions AS (
    SELECT
      s.scheduled_at - (v_buffer_before || ' minutes')::INTERVAL AS blocked_start,
      s.scheduled_at + (s.duration_minutes || ' minutes')::INTERVAL + (v_buffer_after || ' minutes')::INTERVAL AS blocked_end
    FROM sessions s
    WHERE s.practitioner_id = p_practitioner_id
    AND (s.scheduled_at AT TIME ZONE v_timezone)::DATE = p_date
    AND s.status NOT IN ('cancelled')
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
  AND NOT EXISTS (
    SELECT 1 FROM existing_sessions es
    WHERE ts.slot_time < es.blocked_end
    AND ts.slot_time + (p_duration || ' minutes')::INTERVAL > es.blocked_start
  )
  AND ts.slot_time >= v_min_booking_time
  ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
