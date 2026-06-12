-- Custom overview sections for the patient overview.
--
-- Two layers:
--   * user_preferences.overview_sections — the practitioner's TEMPLATE: an
--     ordered list of section definitions [{ id, title }]. Defined once,
--     shown on every one of their patients.
--   * members.overview_content — PER-PATIENT content keyed by section id:
--     { [sectionId]: [ {id,type:'paragraph',text} | {id,type:'list',items:[]} ] }
--
-- Built as a NEW, separate card alongside the existing History / Key
-- considerations. Old data is left untouched (migrated + removed later).

alter table public.user_preferences
  add column if not exists overview_sections jsonb not null default '[]'::jsonb;

alter table public.members
  add column if not exists overview_content jsonb not null default '{}'::jsonb;
