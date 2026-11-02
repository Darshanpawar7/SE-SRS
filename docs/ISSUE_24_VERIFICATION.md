# Issue #24: Protect audit record integrity

The Supabase schema now permits authenticated project members to read and insert activity records only for their own projects. There are no update/delete policies, and application roles have no UPDATE, DELETE, or TRUNCATE privileges on `activity_logs`. Audit rows also use `ON DELETE RESTRICT`, so deleting a project cannot cascade away its history. Client retries remain idempotent through insert-on-conflict-do-nothing behavior.

Automated coverage checks that the schema grants only SELECT and INSERT on audit rows, contains no audit UPDATE/DELETE policy, and restricts project deletion while audit rows exist. Existing audit tests verify that re-sending a duplicate record does not overwrite its original contents.

Manual verification (run after applying `database/schema.sql`): sign in as an authenticated project member, insert and read an audit row for the member's project, then attempt UPDATE and DELETE on that row; both changes must be rejected. Attempt to delete a project that has audit rows; the foreign-key restriction must reject it.

## Validation status

Schema and automated checks are implemented. The live Supabase policy checks require applying the schema to the project and running the manual verification above.
