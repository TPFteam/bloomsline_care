-- Document bundles — send a whole folder of document templates to a patient in
-- one email / one link, signed one after another. Each document in the bundle
-- is still a normal member_documents row (own token, status, signed PDF), so
-- the existing per-document signing + PDF pipeline is reused unchanged; the
-- bundle just groups them and carries the shared link the patient opens.

create table if not exists document_bundles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  practitioner_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references document_folders(id) on delete set null,
  title text not null,                       -- folder name captured at send time
  share_token text not null unique,
  token_expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table member_documents
  add column if not exists bundle_id uuid references document_bundles(id) on delete cascade,
  add column if not exists bundle_seq int;   -- order within the bundle

create index if not exists idx_member_documents_bundle on member_documents (bundle_id);
create index if not exists idx_document_bundles_token on document_bundles (share_token);
create index if not exists idx_document_bundles_member on document_bundles (member_id);

-- RLS: practitioners manage their own bundles. Patient-side signing reads via
-- the service-role client (like member_documents), so no public policy needed.
alter table document_bundles enable row level security;

drop policy if exists "Practitioners manage own document bundles" on document_bundles;
create policy "Practitioners manage own document bundles"
  on document_bundles
  for all
  using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

-- Patients can read bundles addressed to them (so the mobile app can open the
-- sequential signing link).
drop policy if exists "Patients read own document bundles" on document_bundles;
create policy "Patients read own document bundles"
  on document_bundles for select
  to authenticated
  using (
    exists (
      select 1 from members m
      where m.id = document_bundles.member_id
        and m.user_id = auth.uid()
    )
  );

comment on table document_bundles is 'Groups member_documents sent together from a folder, signed sequentially via one link.';
