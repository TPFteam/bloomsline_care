-- Track practitioner invites sent by members
create table if not exists practitioner_invites (
  id uuid default gen_random_uuid() primary key,
  member_user_id uuid not null references auth.users(id),
  member_name text,
  practitioner_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'signed_up')),
  created_at timestamptz default now(),
  sent_at timestamptz,
  email_message_id text
);

-- Index for lookups
create index idx_practitioner_invites_member on practitioner_invites(member_user_id);
create index idx_practitioner_invites_email on practitioner_invites(practitioner_email);

-- RLS
alter table practitioner_invites enable row level security;

-- Members can insert their own invites
create policy "Members can insert own invites"
  on practitioner_invites for insert
  with check (auth.uid() = member_user_id);

-- Members can read their own invites
create policy "Members can read own invites"
  on practitioner_invites for select
  using (auth.uid() = member_user_id);

-- Service role can update (for edge function to set status/sent_at)
create policy "Service role full access"
  on practitioner_invites for all
  using (auth.role() = 'service_role');
