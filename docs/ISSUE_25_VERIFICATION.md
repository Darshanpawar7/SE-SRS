# Issue #25: Attribute changes to verified actors

Cloud audit records no longer trust the actor name sent by the browser. The
activity-log insert policy requires a project member whose name matches the
verified profile, and a database trigger replaces the submitted actor with the
profile name resolved from the authenticated Supabase Auth email. A session
without a matching profile is rejected.

The client continues to create audit records for offline use, while every
record sent to Supabase is attributed by the database boundary. This prevents
changing a client-side profile value from impersonating another actor in the
shared audit history.

Automated schema tests verify the actor policy, trigger, and verified profile
assignment. After applying `database/schema.sql`, manually insert an audit row
with a different `user_name` as an authenticated member and confirm the stored
row contains the authenticated profile name. Repeat with an account that has no
matching profile and confirm the insert is rejected.
