ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS external_booking_url TEXT DEFAULT NULL;
