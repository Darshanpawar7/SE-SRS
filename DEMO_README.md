# SprintFlow — reference-inspired combined demo

This source archive combines the open PRs #84–#89. The PRs are already published.
Do not run a publishing script or copy this branch over main. This branch is for
trying all changes together while Darshan reviews the individual PRs.

## Start the demo

Install Node.js 24 LTS. Extract the ZIP, then run in Terminal:

```bash
cd "$HOME/Downloads/SE-SRS-demo-eshwar-reference-upgrade"
bash run-demo.sh
```

Open the local URL printed by Vite. Keep Terminal open; Ctrl+C stops the demo.
If extracted elsewhere, use that folder instead. Dependencies install with npm ci
and the existing lockfile. No database credentials are needed for local demo.

Choose Eshwar; local demo password: PES2UG24CS173.
For lead-only project/settings actions choose Darshan; demo password: PES2UG24CS143.
Cloud mode requires real Supabase Auth credentials, not these demo passwords.

## Features to try

1. Overview → Reports & analytics: completion ring, workflow donut, priority/status
   bars, workload estimates, completion heatmap, 7/28/90-day controls and CSV counts.
2. Click a chart legend, priority, owner or heatmap date to inspect matching tasks.
   Invalid/future ranges show an explanation. Missing observations stay absent.
3. Work items: left filter sidebar, due-date bounds, oldest/due/recent sorting and
   named saved views. Views stay in this browser under account/project keys.
4. Open a task row to preview it, inspect blocker details and recorded audit events,
   then choose Edit work item. Closing the drawer keeps the list filters.
5. Project map: search relationships, select cards, pan empty space, zoom and Fit.
   Open task editors/sprint boards from the inspector. Relationship table shows
   all matches; the canvas states its 80-task rendering limit.
6. Switch to charcoal/teal using the Dark button. Try compact desktop navigation,
   animated reports and sliding drawers. Database Settings has the full preferences.
   Motion is enabled by default and respects the workspace/system preferences.
7. Sign out with a draft open: the next profile starts with no previous private
   draft or editor. Saved filters are scoped; appearance preferences are device-wide.

Haptics are opt-in and only work on supporting devices/browsers after interaction.
There is no forced Mac trackpad vibration.

## PRs / review order

Merge #84 first. Review #85's session safeguards next. The remaining feature PRs
target main independently and include the original prerequisite stability commit.

- #84 Build, task editing and durable audit/persistence fixes
  https://github.com/Darshanpawar7/SE-SRS/pull/84
- #85 Verified sessions, scoped caches and private draft disposal
  https://github.com/Darshanpawar7/SE-SRS/pull/85
- #86 Interactive reports, recorded history and chart drill-downs
  https://github.com/Darshanpawar7/SE-SRS/pull/86
- #87 Due dates, blockers, saved views and task previews
  https://github.com/Darshanpawar7/SE-SRS/pull/87
- #88 Dark/light themes, stronger borders, navigation and richer motion
  https://github.com/Darshanpawar7/SE-SRS/pull/88
- #89 Project relationship map and shared runtime build chunk
  https://github.com/Darshanpawar7/SE-SRS/pull/89

## Cloud prerequisite

Before using these fields with Supabase, have the database owner review/apply
database/migrations/20261103_work_signals.sql to a test project and verify reads,
writes and RLS. The additive migration preserves existing grants/RLS. It is not
applied automatically. Do not rerun seeded schema.sql just to add columns.
Without these columns, writes are rejected and retained for retry.
Local demo needs no migration.

Initial cloud restore requires network identity verification. Browser backups
are plaintext local data; cache separation does not replace RLS or encryption.

## Data definitions and scope

Snapshot cards describe the current selected sprint. Date controls filter the
recorded completion/timing/flow history, not historical task ownership or scope.
Current-assignee workload is an estimate distribution, not a productivity ranking.
Reopened tasks may complete more than once. Deleted/moved items and missing audit
events limit historical coverage. No past observations or delivery confidence
scores are invented. Daily flow observations remain browser-local.

These are presentation and workflow enhancements related to Sprint 1/2.
Record owner acceptance for proposed metadata/UX extensions. No new completed
SRS requirement, automatic main merge, cloud deployment or development freeze
is claimed. Existing academic documents/videos remain source history; their
manual submission gaps have not been certified complete by this demo.

## Validation

Before the local session disconnected, the combined integration passed:
- 240 tests across 36 files.
- ESLint with zero warnings.
- Production build; framework split removes the large-entry-chunk warning.
- 57 compiled-app JSDOM behavior checks, including reports, saved views, drawer
  editing, theme/motion persistence, project map navigation and profile isolation.

All six PRs' current build, unit/workflow, lint and security checks were green
when this demo was assembled on 3 November 2026. Audit blocks high/critical
findings; seven moderate ESLint-tooling findings remain.

Native Chrome could not launch in this run. Native visuals, focus/screen readers,
touch/hardware haptics, OS tab termination and live cloud migration/TLS remain
manual checks. JSDOM rebundles emitted production modules for behavioral checks.

You can run the repository checks after npm ci:

```bash
npm test
npm run lint -- --max-warnings=0
npm run build
npm run audit:security
```

See docs/enhancements/10–15 for implementation notes and limitations.
