-- Fix the FK from resource_responses.shared_resource_id →
-- member_shared_resources(id) so that deleting the parent share (or its
-- ancestor resource, which cascades into member_shared_resources) no
-- longer fails with a constraint violation.
--
-- Original constraint was created via the Supabase dashboard as
-- ON DELETE NO ACTION, which blocks resource deletion entirely: the
-- cascade chain resources → member_shared_resources tries to wipe shares,
-- and any response referencing one of those shares prevents the cascade.
--
-- Switch to ON DELETE SET NULL so we preserve responses for audit (same
-- pattern as resource_responses.resource_id, see migration 20251219).
-- The response keeps its rendered snapshot; the broken FK pointer just
-- nulls out.

alter table public.resource_responses
  drop constraint if exists resource_responses_shared_resource_id_fkey;

alter table public.resource_responses
  add constraint resource_responses_shared_resource_id_fkey
  foreign key (shared_resource_id)
  references public.member_shared_resources(id)
  on delete set null;
