-- ─────────────────────────────────────────────────────────────────────
-- One-off cleanup: remove member_shared_resources rows where the
-- sharer practitioner doesn't own the resource AND the patient never
-- engaged with the share.
--
-- Background:
--   These rows existed because practitioners shared resources owned by
--   other practitioners (admin transfers, templates, library imports).
--   The UI's `/shared-resources` page joins to `resources` via the
--   browser client, but RLS blocks the join for non-owner practitioners
--   so the title comes back null and the row renders as "Untitled."
--
--   Confirmed: 21 shares match, all with `has_response = no — never
--   responded`. Safe to delete — no clinical data is lost.
--
-- Non-destructive guards:
--   * Only deletes shares with NO matching resource_responses row, in
--     ANY status. The instant a response exists, the row is preserved.
--   * Only deletes cross-practitioner shares — same-practitioner rows
--     stay untouched.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Preview the exact rows about to be deleted. Run this alone first
--    to confirm the count matches the 21 from the audit query.
select count(*) as about_to_delete
from   public.member_shared_resources msr
join   public.resources              r   on r.id = msr.resource_id
where  r.practitioner_id is distinct from msr.practitioner_id
  and  not exists (
         select 1
         from public.resource_responses resp
         where resp.member_id       = msr.member_id
           and resp.resource_id     = msr.resource_id
           and resp.practitioner_id = msr.practitioner_id
       );

-- 2. Do the cleanup.
delete from public.member_shared_resources msr
using       public.resources r
where       r.id = msr.resource_id
  and       r.practitioner_id is distinct from msr.practitioner_id
  and       not exists (
              select 1
              from public.resource_responses resp
              where resp.member_id       = msr.member_id
                and resp.resource_id     = msr.resource_id
                and resp.practitioner_id = msr.practitioner_id
            );

-- 3. Verify zero cross-practitioner-no-response rows remain.
select count(*) as still_orphan
from   public.member_shared_resources msr
join   public.resources              r   on r.id = msr.resource_id
where  r.practitioner_id is distinct from msr.practitioner_id
  and  not exists (
         select 1
         from public.resource_responses resp
         where resp.member_id       = msr.member_id
           and resp.resource_id     = msr.resource_id
           and resp.practitioner_id = msr.practitioner_id
       );
-- Expect: 0
