-- Drop the legacy "History" card columns from members, now that their data
-- lives in the customizable "About patient" sections
--   user_preferences.overview_sections  (template)
--   members.overview_content            (per-patient values)
--
-- Every reader/writer is now off these columns:
--   [x] Overview "History" card UI removed (about/preferences cards)
--   [x] AI builders read overview_content (summary, session-prep,
--       practitioner-context, Bloom chat) — see src/lib/members/about-sections.ts
--   [x] Edit Member form (page + modal) no longer reads/writes them
--   [x] create-demo-members.ts seeds overview_content + a section template
--   [x] MemberFormExtras "background notes" writes overview_content.hist_notes
--       (Add-Member handler seeds the History section via ensureSections)
--
-- The only remaining references are the field declarations in
-- src/types/member.ts (Member.internal_notes / Member.preferences) — remove
-- those after this migration runs.
--
-- ⚠️ Still: confirm the migrated data looks right in-app for a few patients
-- (e.g. Sonia Lebari, the alisée-eggermont intakes) FIRST. This is destructive
-- and irreversible — the legacy columns are the safety net for the one-time
-- history→sections migration. Keep them until you are sure.

alter table public.members drop column if exists internal_notes;
alter table public.members drop column if exists preferences;
