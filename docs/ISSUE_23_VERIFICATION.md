# Issue #23: Isolate data by role and membership

The database schema enables row-level security for every application table and
removes the previous public access policies. Authenticated requests are mapped
to the provisioned profile by verified Supabase Auth email. Project membership
controls visibility of projects, sprints, tasks, comments, and activity logs;
owner and lead roles control project and membership administration.

Automated schema tests cover RLS on all application tables, authenticated
policy scope, membership checks, role checks, and the absence of public
`USING (true)` policies.

Manual verification after applying `database/schema.sql`:

1. Sign in as a seeded project member and confirm that member project data is
   readable and writable only within the permitted role.
2. Sign in as an authenticated user without a membership row and confirm that
   project data is not visible or writable.
3. Use an anonymous request and confirm that application tables reject reads
   and writes.
4. Confirm that contributors cannot manage project membership or project
   metadata, while owners and leads can perform only their permitted actions.
