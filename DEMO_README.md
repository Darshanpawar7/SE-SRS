# SprintFlow — review fixes demo (6 November 2026)

This download includes current main at 62ec271b6b20761200796d370ce4f1e4a676e62f plus open PRs #103, #104 and #105. Darshan's approved session fixes from #85 and the final testing reports from #102 are preserved. The three follow-up PRs are published and remain open for review.

## Run

Install Node.js 24 LTS, extract this archive, then run:

```bash
cd "$HOME/Downloads/SE-SRS-demo-eshwar-review-fixes"
bash run-demo.sh
```

Open the URL printed by Vite. Keep Terminal open; Ctrl+C stops it.
Choose Eshwar, demo password PES2UG24CS173. For lead-only settings choose Darshan,
demo password PES2UG24CS143. Cloud mode requires real Supabase Auth credentials.

The publishing is already done. Do not run an older publish-prs.sh script.

## What changed

- #103: explicit status transitions on multi-field edits; genuine completion
  counting; reset cycle start on return to To Do/Backlog; current open age;
  90-date / 50-key limits for disposable flow observations.
- #104: ordinary task edits recover from specifically missing planning columns
  on an older schema. Nonempty due dates/blockers stay queued until migration.
  Explicit clears still work on a migrated database.
- #105: own-actor saved notifications, themed toast icons, appearance before
  sign-in paint, memoized map/indexed membership and fairly limited drawing.
  The relationship table still lists every matching work item.

PRs:
https://github.com/Darshanpawar7/SE-SRS/pull/103
https://github.com/Darshanpawar7/SE-SRS/pull/104
https://github.com/Darshanpawar7/SE-SRS/pull/105

## Verification and limits

Each final PR head has green GitHub build, unit/workflow, lint and security
checks. The combined demo branch has its own checks on GitHub Actions.
Local source checks before the connection dropped also passed. Do not interpret
unit/fake-backend tests as live cloud or native hardware certification.

Combined verification: 272 tests in 41 files, lint, build and audit checks passed on GitHub Actions.
The unit report for your issue #91 is already on main and the issue is closed.
Darshan fixed and merged #85, including transient-auth retry and 15 regression
tests, while this review was in progress. Those changes are included here.

The team closed issue #96 on 6 November, but the current System Validation Report
still marks four live-cloud checks as Blocked and its result table is empty.
Those results are not certified here; the backend tester must supply the test-project
evidence for Supabase integration, HTTPS request inspection and cross-account RLS.
No live cloud checks or migrations are claimed by this demo. New planning
values require database/migrations/20261103_work_signals.sql; it is not applied
automatically. Local demo requires no database.

Existing academic reports retain the commit-specific results stated in them.
These follow-ups concern existing Sprint 1/2 behavior. No main merge, release
or development freeze is performed by this demo branch.

After installation, run checks with npm test, npm run lint -- --max-warnings=0,
npm run build and npm run audit:security.
