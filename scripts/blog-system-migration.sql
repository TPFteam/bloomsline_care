-- ============================================================================
-- Blog system — practitioner-authored posts with admin approval
-- ============================================================================
-- Practitioners write posts in the care app and submit them for review. An
-- admin approves (or requests changes) in /admin/blogs. The public site
-- (bloomsline.com/blog) renders ONLY `published_snapshot` — the last approved
-- copy — so editing a live post never changes what the public sees until an
-- admin re-approves. Every change goes back through review.
--
-- Idempotent. Safe to run anytime.
-- ============================================================================

create table if not exists blog_posts (
  id                 uuid primary key default gen_random_uuid(),
  practitioner_id    uuid not null references auth.users(id) on delete cascade,
  title              text not null default '',
  slug               text unique,
  excerpt            text not null default '',
  content            text not null default '',   -- markdown with {{image}} tokens (working copy)
  images             jsonb not null default '[]'::jsonb, -- [{ token, url }] body images, kept out of the text
  cover_image_url    text,
  language           text not null default 'en',  -- 'en' | 'fr'
  status             text not null default 'draft', -- draft | pending | changes_requested | published
  -- The last admin-approved copy. NULL until first approval. The public site
  -- reads from here only, so unreviewed edits never leak live.
  published_snapshot jsonb,
  review_note        text,        -- admin feedback when changes are requested
  submitted_at       timestamptz,
  reviewed_at        timestamptz,
  reviewed_by        uuid,
  published_at       timestamptz, -- first time it ever went live
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- For tables created before the images column existed.
alter table blog_posts add column if not exists images jsonb not null default '[]'::jsonb;

create index if not exists blog_posts_practitioner_idx on blog_posts (practitioner_id, updated_at desc);
create index if not exists blog_posts_pending_idx       on blog_posts (submitted_at) where status = 'pending';
create index if not exists blog_posts_live_idx          on blog_posts (published_at desc) where published_snapshot is not null;

-- updated_at touch -----------------------------------------------------------
create or replace function blog_posts_touch() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists blog_posts_touch_trg on blog_posts;
create trigger blog_posts_touch_trg before update on blog_posts
  for each row execute function blog_posts_touch();

-- Guard: only the admin API (service_role) may publish. Practitioners can move
-- their post between draft/pending (submit) but can never write the published
-- snapshot, stamp review fields, or set status='published' themselves.
create or replace function blog_posts_guard() returns trigger as $$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'UPDATE' then
      new.published_snapshot := old.published_snapshot;
      new.published_at       := old.published_at;
      new.reviewed_at        := old.reviewed_at;
      new.reviewed_by        := old.reviewed_by;
      new.review_note        := old.review_note;
      if new.status not in ('draft', 'pending') then new.status := old.status; end if;
    else -- INSERT
      new.published_snapshot := null;
      new.published_at := null; new.reviewed_at := null; new.reviewed_by := null; new.review_note := null;
      if new.status not in ('draft', 'pending') then new.status := 'draft'; end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists blog_posts_guard_trg on blog_posts;
create trigger blog_posts_guard_trg before insert or update on blog_posts
  for each row execute function blog_posts_guard();

-- RLS ------------------------------------------------------------------------
alter table blog_posts enable row level security;

-- Practitioners fully manage their own posts (drafts included).
drop policy if exists blog_posts_owner on blog_posts;
create policy blog_posts_owner on blog_posts
  for all
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

-- Anyone (incl. anon) may read posts that have gone live at least once.
drop policy if exists blog_posts_public_read on blog_posts;
create policy blog_posts_public_read on blog_posts
  for select
  using (published_snapshot is not null);

-- Admin reads the pending queue + writes approvals through the service role
-- (createAdminClient), which bypasses RLS — no admin policy needed here.

-- Storage: public bucket for cover + body images -----------------------------
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists blog_images_read on storage.objects;
create policy blog_images_read on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists blog_images_upload on storage.objects;
create policy blog_images_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'blog-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists blog_images_update on storage.objects;
create policy blog_images_update on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists blog_images_delete on storage.objects;
create policy blog_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = auth.uid()::text);
