# Issue #26: Enforce Supabase row-level security

RLS is enabled for all seven application tables: `profiles`, `projects`, `project_members`, `sprints`, `tasks`, `comments`, and `activity_logs`. Public policies were removed. Authenticated requests are mapped from the verified Supabase Auth email to a provisioned profile; project membership scopes data access, and owner/lead roles gate project and membership administration. Anonymous table access is revoked.

The schema seeds project membership for all four Team 11 accounts. Cloud access therefore requires matching Supabase Auth users and seeded profile emails. When credentials are absent or a cloud request is denied, the client retains its existing browser-local fallback.

Automated coverage checks the RLS declaration on every application table, authenticated policy scope, membership/role checks, and the absence of public `USING (true)` policies.

Manual verification (run after applying `database/schema.sql`):
1. Sign in as each seeded Team 11 Supabase Auth user and confirm project data is available.
2. Use an authenticated user with no `project_members` row and confirm project rows are not visible or writable.
3. Use an unauthenticated/anon request and confirm table access is denied.
4. Confirm a contributor cannot add or change project membership, while an owner or lead can manage eligible member roles.

## Validation status

Schema and automated checks are implemented. Live Supabase Auth identities and API policy checks are environment-dependent and must be run against the team's project.
