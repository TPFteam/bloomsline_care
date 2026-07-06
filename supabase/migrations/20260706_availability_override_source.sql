-- Distinguish imported public holidays from hand-entered time off.
--
-- Time off and imported public holidays both live in availability_overrides
-- (is_available = false). We add a `source` marker so the UI can lock editing
-- on imported holidays (they are re-derivable from a country's holiday list,
-- not bespoke entries) while manual time off stays fully editable.
--
--   'manual'  → entered by the practitioner (default; all existing rows)
--   'holiday' → imported from a country's public-holiday list
--
-- Existing rows keep 'manual'; re-importing a holiday date upgrades it to
-- 'holiday' (the import path deletes-then-inserts per date).

ALTER TABLE availability_overrides
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
