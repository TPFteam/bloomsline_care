-- Document folders — group reusable document templates (e.g. a "Welcome kit"
-- bundling a few consent/intake docs). A template belongs to at most one
-- folder. Deleting a folder ungroups its templates (never deletes them).

create table if not exists document_folders (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table document_templates
  add column if not exists folder_id uuid references document_folders(id) on delete set null;

create index if not exists idx_document_folders_practitioner on document_folders(practitioner_id);
create index if not exists idx_document_templates_folder on document_templates(folder_id);

-- RLS: a practitioner manages only their own folders.
alter table document_folders enable row level security;

drop policy if exists "Users can manage own document folders" on document_folders;
create policy "Users can manage own document folders"
  on document_folders
  for all
  using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

comment on table document_folders is 'Practitioner-defined folders that group document_templates (e.g. a welcome kit).';
