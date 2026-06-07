-- Per-template "send automatically when a patient is added" default.
-- The add-patient modal pre-checks auto_send templates; the practitioner can
-- still adjust per patient before saving.

alter table public.document_templates
  add column if not exists auto_send boolean not null default false;
