# Auth and project schema rollout

The additive migration is `database/migrations/20261106_auth_projects_rls.sql`.
The same migration is included at the end of `database/schema.sql`, so a fresh
Supabase project receives the base schema, seed rows, and the auth additions.
Reapplying the migration preserves existing project, task, and seed records.

## Legacy text IDs

Existing `profiles.user_id`, `projects.owner_id`, `project_members.user_id`,
and task assignee IDs are text and may contain values such as `u-1`. The
migration does not rewrite or remove those values. It adds nullable
`profiles.auth_user_id UUID` referencing `auth.users(id)` and links existing
profiles only when a matching Auth account has a confirmed email. New confirmed
accounts get a profile with a generated `auth:<uuid>` legacy text ID. Before
production rollout, review duplicate emails and ensure each legacy member's
email belongs to the intended verified Auth account; do not manually map based
only on a client-provided ID.

The old membership role check is replaced to allow the current `lead`,
`scrum_master`, `developer`, and `viewer` roles while retaining legacy
`owner`/`contributor` rows. Existing role values and seeded data are retained.
New project mutations should use the security-definer RPCs; direct client table
writes for profile, project, and membership records are revoked.

## Non-enumerating invitation response

`add_project_member_by_email(project_id, email, role)` returns only `invited`.
For a verified existing Auth account it adds the profile to the project
immediately; otherwise it records a pending invitation. The same response is
returned in both cases. Pending invitations are claimed using
`claim_project_invitations()`, which reads `auth.uid()` and
`auth.users.email_confirmed_at`; it accepts no email argument.

## SQL Editor verification

Run as the Supabase SQL Editor database administrator. Replace the UUID values
with real `profiles.auth_user_id` values for test accounts and ensure each has
the named project role. This simulates the `authenticated` JWT claims for each
role, runs read-only checks, then rolls back. SQL Editor administrator access
itself bypasses RLS, so the `SET LOCAL ROLE authenticated` and request claim
settings are essential. If the role switch is rejected by the project's SQL
Editor configuration, run these checks through a user JWT instead.

```sql
BEGIN;
SET LOCAL ROLE authenticated;

-- Repeat this block with each test account UUID and expected role.
-- Lead:
SELECT set_config('request.jwt.claim.sub', '<LEAD_AUTH_UUID>', true);
SELECT set_config('request.jwt.claims', '{"sub":"<LEAD_AUTH_UUID>","role":"authenticated"}', true);
SELECT public.is_project_member('<PROJECT_UUID>'::uuid) AS member,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['lead']) AS lead,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['scrum_master']) AS scrum_master;

-- Scrum master:
SELECT set_config('request.jwt.claim.sub', '<SCRUM_MASTER_AUTH_UUID>', true);
SELECT set_config('request.jwt.claims', '{"sub":"<SCRUM_MASTER_AUTH_UUID>","role":"authenticated"}', true);
SELECT public.is_project_member('<PROJECT_UUID>'::uuid) AS member,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['scrum_master']) AS scrum_master,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['lead']) AS lead;

-- Developer:
SELECT set_config('request.jwt.claim.sub', '<DEVELOPER_AUTH_UUID>', true);
SELECT set_config('request.jwt.claims', '{"sub":"<DEVELOPER_AUTH_UUID>","role":"authenticated"}', true);
SELECT public.is_project_member('<PROJECT_UUID>'::uuid) AS member,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['developer']) AS developer,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['lead']) AS lead;

-- Viewer:
SELECT set_config('request.jwt.claim.sub', '<VIEWER_AUTH_UUID>', true);
SELECT set_config('request.jwt.claims', '{"sub":"<VIEWER_AUTH_UUID>","role":"authenticated"}', true);
SELECT public.is_project_member('<PROJECT_UUID>'::uuid) AS member,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['viewer']) AS viewer,
       public.has_project_role('<PROJECT_UUID>'::uuid, ARRAY['lead']) AS lead;

-- Non-member: use a confirmed account with no membership in this project.
SELECT set_config('request.jwt.claim.sub', '<NON_MEMBER_AUTH_UUID>', true);
SELECT set_config('request.jwt.claims', '{"sub":"<NON_MEMBER_AUTH_UUID>","role":"authenticated"}', true);
SELECT public.is_project_member('<PROJECT_UUID>'::uuid) AS member,
       count(*) AS visible_project_rows
FROM public.projects WHERE id = '<PROJECT_UUID>'::uuid;

ROLLBACK;
```

Expected role checks: each named member gets `member = true` and only its own
role predicate true; the non-member gets `member = false` and
`visible_project_rows = 0`. To verify the last-lead guard, as a lead attempt to
demote or remove the only lead through the respective management RPC; it must
raise `A project must retain at least one lead`. A member cannot target their
own membership in either management RPC.
