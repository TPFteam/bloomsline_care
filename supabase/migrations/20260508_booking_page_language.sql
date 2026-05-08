-- Public booking page language — independent from the practitioner's
-- dashboard UI language so they can work internally in English while
-- showing the public page in French (or vice versa).
--
-- Allowed values: 'en', 'fr'. NULL = fall back to user.preferred_language.

ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS booking_page_language TEXT
  CHECK (booking_page_language IN ('en', 'fr'));

-- Backfill: copy the practitioner's current preferred_language so existing
-- booking pages keep their current behavior.
UPDATE booking_settings bs
SET booking_page_language = CASE
  WHEN u.preferred_language = 'fr' THEN 'fr'
  ELSE 'en'
END
FROM users u
WHERE bs.user_id = u.id
  AND bs.booking_page_language IS NULL;
