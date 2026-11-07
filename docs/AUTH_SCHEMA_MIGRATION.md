# Auth and project schema rollout

For an existing installation, apply these migrations in order:
`20261103_work_signals.sql`, `20261106_auth_projects_rls.sql`,
`20261106_create_project_dates.sql`, and
`20261107_project_dashboard_members.sql`. A fresh installation can run
`database/schema.sql` once; it includes the schema and these auth/project
additions without inserting the old four-person demo seed. Existing seed rows
are not deleted or rewritten. The date overload of `create_project` writes the
project dates and creator lead membership in one RPC transaction.

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

`add_project_member_by_email(project_id, email, role)` always stores a pending
invitation and returns only `invited`; it does not look up Auth accounts.
`respond_project_invitation(invitation_id, accept)` verifies the caller's
confirmed email against the invitation and adds membership only after an
explicit acceptance. Declines are recorded. The former automatic
`claim_project_invitations()` RPC is revoked from application roles.

`list_project_members(project_id)` checks project membership before returning
names, emails and project roles. `list_project_invitations(project_id)` returns
pending invitations to project members; with a NULL project ID it returns only
pending invitations matching the caller's verified email. Leads can cancel or
resend through `manage_project_invitation`. Role changes and removals remain
lead-only and the last-lead trigger prevents removing or demoting the final
lead.

The final migration enables Realtime publication membership idempotently for
`public.tasks`, `public.sprints`, and `public.project_members`. The client
subscribes with a `project_id` filter, and each authenticated subscription is
still subject to table grants and RLS policies.

To enable Realtime manually (the migration already does this safely), run these
statements only for tables not already listed in `supabase_realtime`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
```

Check the publication membership and row-security flags with:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('tasks', 'sprints', 'project_members')
ORDER BY tablename;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       count(p.policyname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN ('tasks', 'sprints', 'project_members')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;
```

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

## Invitation email deployment

The Members page invokes `supabase/functions/invite-member`. Configure the app
URL as an allowed redirect in Supabase Auth URL settings. Set the Edge
Function secrets with
`supabase secrets set APP_URL=https://your-app.example.com RESEND_API_KEY=<your-resend-key> INVITE_FROM_EMAIL="SprintFlow <invites@your-verified-domain>"`,
then deploy with `supabase functions deploy invite-member`. Verify the sender
domain in Resend before using it. Supabase injects the publishable and secret
key maps into Edge Functions; the function reads them with `Deno.env.get`, and
no privileged key is stored in this repository or sent by the frontend.

The function verifies the caller JWT and lead role, stores the pending
invitation through the authenticated RPC, and attempts
`auth.admin.inviteUserByEmail`. When Auth cannot deliver (including for an
existing account), it sends a project invitation notice through Resend. The
recipient signs in or signs up using that address, verifies it, then accepts
the pending invitation in the app; accepting inserts the membership with the
invited role. If the function is unavailable, the app falls back to the
in-app invitation RPC. Supabase's built-in email provider currently permits
two Auth emails per hour and restricts recipients to authorized organization
addresses. Configure custom SMTP in Supabase Auth for signup confirmation and
reliable Auth email delivery. See the README for links to current Supabase
deployment and email settings documentation.
