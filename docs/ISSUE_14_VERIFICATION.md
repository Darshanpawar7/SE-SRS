# Issue #14: Sprint lifecycle and selection

Sprints progress only from planned to active to completed. Starting a sprint validates its name and calendar dates and rejects a second active sprint in the same project. Missing sprints, skipped states, repeated transitions and reopening completed sprints are rejected. Creation always sets planned status and the current project ID.

Starting a sprint selects its board and metrics. View sprint also permits selecting planned or completed reports without changing lifecycle state. The selected ID is saved in browser storage and restored on reload; a stale ID falls back to the active sprint, then the first sprint. Reset clears the selection.

Automated cases cover lifecycle persistence, invalid transitions, per-project active limits, malformed/reversed dates, same-day sprints and selection recovery.

Manual check: create a planned sprint, complete any existing active sprint, start the new sprint, open Kanban and Dashboard, then reload. The new sprint remains selected. Complete it and verify its report is still selectable. Lifecycle validation is an application control; database authorization is tracked separately.

## Validation

Verified on 26 October 2026: `npm test` (25 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings). Validation used cached local dependencies: Vite 5.4.21 and Vitest 4.1.11; CI installs the repository lockfile. Hosted Supabase behavior was not exercised for this browser-side change.
