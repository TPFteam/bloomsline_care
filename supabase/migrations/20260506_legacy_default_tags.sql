-- Per-practitioner flag: keep showing the original 7 default note tags
-- (recurrence, hypothese, general, symptome, transfert, contre_transfert,
-- ajustement_envisage) for existing practitioners. New signups going forward
-- only get the 2 fixed defaults (recurrence, hypothese) and build their own
-- custom tags from there.
--
-- The flag also drives the lock-icon UI: all default tags shown via this flag
-- render with a 🔒 to signal "these are system-provided, not custom".

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS uses_legacy_default_tags BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every practitioner who exists today keeps the legacy 7 defaults.
UPDATE public.users
SET uses_legacy_default_tags = true
WHERE uses_legacy_default_tags = false
  AND user_type = 'mentor';

COMMENT ON COLUMN public.users.uses_legacy_default_tags IS
  'When true, NotesTab shows all 7 legacy default note tags. When false (new signups), only the 2 FIXED_NOTE_TYPES are shown as defaults — practitioners build custom tags themselves.';
