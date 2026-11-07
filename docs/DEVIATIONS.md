# Deviations and Verification Limits

## PMS-NF-001 (#31)

The repeatable local benchmark measures the state update and `KanbanBoard`
React component render to static HTML for a 100-task fixture. Combined p95
was 6.8576 ms in the isolated run and 26.6921 ms during the full-suite run
concurrent with lint. Browser DOM commit, layout, paint, and the complete
pointer-driven drag/drop interaction have not been measured, so no browser
end-to-end claim is made. See [PERFORMANCE.md](PERFORMANCE.md) for the setup,
command, results, and coverage limits.

## Supabase project membership and dashboard

Fresh installs through `database/schema.sql` no longer insert the four-person
Team 11 sample project. Existing installations are preserved: these SQL files
do not delete already seeded rows, so an administrator must review any legacy
sample memberships in the SQL Editor. The local demo dataset remains available
only when the app runs without Supabase. Cloud role labels, project members,
assignees, workload, and dashboard totals now come from the selected project's
membership and task/sprint rows.

The `invite-member` Edge Function attempts a Supabase Auth invitation after
saving the in-app pending invitation. If Auth cannot deliver (including to an
existing account), it sends a project notification through Resend. Delivery
requires deploying the function, configuring its Resend API key and verified
sender, and allowing the app redirect URL in Supabase Auth. Supabase's built-in
provider is limited to two emails per hour and authorized team addresses, so
custom SMTP is also needed for signup confirmation to ordinary teammate
addresses. The function has not been deployed or tested against a live
Supabase project.
Realtime publication membership is configured by SQL; live subscription and
RLS behavior were not tested against Supabase.
