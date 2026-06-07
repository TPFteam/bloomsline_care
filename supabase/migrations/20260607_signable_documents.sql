-- Signable documents (consent / intake forms).
--
-- Two tables:
--   document_templates  — practice-level reusable documents a practitioner
--                         authors once (uploaded PDF/DOCX or authored in-app).
--   member_documents    — a per-patient instance sent for signature. Holds the
--                         status (sent → viewed → signed), the signing token,
--                         the captured signature + audit trail, and a frozen
--                         snapshot of the template so later edits never change
--                         what a patient actually signed.
--
-- The final flattened signed PDF is written to the existing `member-files`
-- bucket and also gets a `member_files` row (category 'consent') so it shows
-- up in the member's Files tab and is downloadable by the practitioner.
--
-- Token-based signing (web link + mobile) is performed server-side with the
-- service role, so it bypasses RLS; the policies below only cover the
-- authenticated practitioner and the linked patient.

-- ---------------------------------------------------------------------------
-- document_templates
-- ---------------------------------------------------------------------------
create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null default 'consent' check (type in ('consent', 'intake', 'other')),
  source text not null default 'upload' check (source in ('upload', 'authored')),
  file_path text,                 -- when source = 'upload' (member-files path)
  content jsonb,                  -- when source = 'authored' (rich-text blocks)
  locale text not null default 'fr',
  require_signature boolean not null default true,
  required_before_session boolean not null default false,
  allow_guardian boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_templates_practitioner
  on public.document_templates (practitioner_id);

alter table public.document_templates enable row level security;

drop policy if exists "Practitioners read own document templates"   on public.document_templates;
drop policy if exists "Practitioners insert own document templates" on public.document_templates;
drop policy if exists "Practitioners update own document templates" on public.document_templates;
drop policy if exists "Practitioners delete own document templates" on public.document_templates;

create policy "Practitioners read own document templates"
  on public.document_templates for select
  to authenticated
  using (practitioner_id = auth.uid());

create policy "Practitioners insert own document templates"
  on public.document_templates for insert
  to authenticated
  with check (practitioner_id = auth.uid());

create policy "Practitioners update own document templates"
  on public.document_templates for update
  to authenticated
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

create policy "Practitioners delete own document templates"
  on public.document_templates for delete
  to authenticated
  using (practitioner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- member_documents
-- ---------------------------------------------------------------------------
create table if not exists public.member_documents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  practitioner_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.document_templates(id) on delete set null,
  template_snapshot jsonb not null default '{}'::jsonb,  -- frozen title/content/file_path at send time
  status text not null default 'sent' check (status in ('sent', 'viewed', 'signed', 'declined')),
  share_token text not null unique,
  token_expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signer_relationship text not null default 'self' check (signer_relationship in ('self', 'guardian')),
  signature_path text,            -- raw signature image in member-files
  signed_pdf_path text,           -- final flattened signed PDF in member-files
  audit jsonb not null default '{}'::jsonb,  -- { ip, user_agent, events: [...] }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_documents_member
  on public.member_documents (member_id);
create index if not exists idx_member_documents_practitioner
  on public.member_documents (practitioner_id);
create index if not exists idx_member_documents_token
  on public.member_documents (share_token);

alter table public.member_documents enable row level security;

drop policy if exists "Practitioners read own member documents"   on public.member_documents;
drop policy if exists "Practitioners insert own member documents" on public.member_documents;
drop policy if exists "Practitioners update own member documents" on public.member_documents;
drop policy if exists "Practitioners delete own member documents" on public.member_documents;
drop policy if exists "Patients read own member documents"        on public.member_documents;

-- Practitioner — full control over documents they sent.
create policy "Practitioners read own member documents"
  on public.member_documents for select
  to authenticated
  using (practitioner_id = auth.uid());

create policy "Practitioners insert own member documents"
  on public.member_documents for insert
  to authenticated
  with check (practitioner_id = auth.uid());

create policy "Practitioners update own member documents"
  on public.member_documents for update
  to authenticated
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

create policy "Practitioners delete own member documents"
  on public.member_documents for delete
  to authenticated
  using (practitioner_id = auth.uid());

-- Patient — read documents tied to their linked member record (mobile side).
create policy "Patients read own member documents"
  on public.member_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.id = member_documents.member_id
        and m.user_id = auth.uid()
    )
  );
