# Issue #13: Sprint totals and completion

Sprint metrics use only tasks assigned to the selected sprint. Unassigned backlog tasks and other sprints do not contribute. Completion is rounded Done Points / Total Points × 100; an empty or missing selection reports zero. Sprint cards and the selected dashboard use the same task selection helper.

Automated cases cover mixed sprint/backlog data, weighted completion, empty scope, and recalculation after task completion, estimation, reassignment and deletion.

Manual check: select a sprint containing an 8-point Done task and a 2-point To Do task. Verify 10 planned, 8 completed, 2 remaining and 80% completion. A 21-point Done task in another sprint must not change these results.

## Validation

Verified on 26 October 2026: `npm test` (15 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings). Validation used cached local dependencies: Vite 5.4.21 and Vitest 4.1.11; CI installs the repository lockfile. Hosted Supabase behavior was not exercised for this browser-side change.
