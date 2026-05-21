-- Per-practitioner reusable note templates. Practitioners create
-- their own set; the templates dropdown in the note editor lets them
-- insert one into the current note as a scaffold to fill in.
--
-- Content is stored as plain text (with newlines). The editor
-- converts to HTML paragraphs at insertion time.

create table if not exists public.note_templates (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_note_templates_practitioner
  on public.note_templates (practitioner_id);

alter table public.note_templates enable row level security;

drop policy if exists "Practitioners read own templates"   on public.note_templates;
drop policy if exists "Practitioners insert own templates" on public.note_templates;
drop policy if exists "Practitioners update own templates" on public.note_templates;
drop policy if exists "Practitioners delete own templates" on public.note_templates;

create policy "Practitioners read own templates"
  on public.note_templates for select
  to authenticated
  using (practitioner_id = auth.uid());

create policy "Practitioners insert own templates"
  on public.note_templates for insert
  to authenticated
  with check (practitioner_id = auth.uid());

create policy "Practitioners update own templates"
  on public.note_templates for update
  to authenticated
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

create policy "Practitioners delete own templates"
  on public.note_templates for delete
  to authenticated
  using (practitioner_id = auth.uid());
