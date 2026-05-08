-- Recurring Sessions — Phase 0: Foundations
--
-- Adds the columns used to group occurrences of a recurring booking series
-- on both the `bookings` and `sessions` tables.
--
-- Conventions used elsewhere in this PR:
--   - One series ⇒ one `series_id` (UUID, generated once at series creation)
--   - The first occurrence row in a series is the "anchor" — its `id` becomes
--     `series_parent_id` on every other row in the series. The anchor itself
--     stores `recurrence_rule`; children leave it NULL.
--   - `series_position` is 1-indexed (1..series_total), used for display
--     ("Week 3 of 12").
--
-- Rolling out is safe: all new columns are NULLable, all existing rows stay
-- valid (single bookings have NULL series_*).
--
-- NOTE: an earlier version of this migration also created a partial unique
-- index `bookings_no_double_book` to prevent slot races. That index has been
-- removed from this file because existing data contains historical
-- overbookings (two patients in the same minute) that would block the
-- constraint. We can reintroduce it in a later migration once historical
-- rows have been transitioned out of the `confirmed` state.

-- ============================================================================
-- Bookings
-- ============================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS series_id UUID,
  ADD COLUMN IF NOT EXISTS series_parent_id UUID,
  ADD COLUMN IF NOT EXISTS series_position INTEGER,
  ADD COLUMN IF NOT EXISTS series_total INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_series_id
  ON bookings(series_id)
  WHERE series_id IS NOT NULL;

-- ============================================================================
-- Sessions (member-tracking mirror)
-- ============================================================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS series_id UUID,
  ADD COLUMN IF NOT EXISTS series_parent_id UUID,
  ADD COLUMN IF NOT EXISTS series_position INTEGER,
  ADD COLUMN IF NOT EXISTS series_total INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_series_id
  ON sessions(series_id)
  WHERE series_id IS NOT NULL;
