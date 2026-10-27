# Issue #15: Recorded daily sprint burndown

Actual remaining points come from saved observations, replacing the interpolated curve. Loading data and task/sprint changes record the latest observation for that UTC day in sprintflow_burndown_history. Snapshots contain date, total points, remaining points and sprint status. Earlier dates remain unchanged and completed sprint history is frozen.

Each date appears on the chart with an ideal linear guideline. The first observed scope provides the ideal baseline when no start-date snapshot exists. Unknown and future actual values remain blank and break the line. Observations after the deadline extend the chart to the actual observation date, without backdating completion. Empty and one-day sprints render safely. A table exposes exact values.

Automated cases cover observed values versus invented interpolation, gaps, scope changes, separate sprints, empty/completed/late sprints, persistence beyond 20 entries, reset and accessible chart markup.

Manual check: change a task to Done and confirm today's remaining points change immediately. Reload and confirm the observation persists. Inspect the daily values table. Historical dates without observations must say Not recorded.

Follow-up layout fix: a chart longer than its card (for example a sprint viewed weeks after its end date) now scrolls inside the card instead of stretching it past the screen edge, where the latest recorded value was cut off, and the dates under the axis are no longer clipped. Manual check: on a laptop screen, open the dashboard for a sprint whose dates are long past; the chart scrolls sideways inside its card, the Ideal/Actual legend stays visible, and every date label is readable.

History is local to this browser, including when task data is loaded from Supabase. No observations are generated while the app is closed; absent days are intentionally blank. Clearing site data or resetting the demo removes history. Cross-device history synchronization is outside this issue.

## Validation

Verified on 26 October 2026: `npm test` (14 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings). Validation used cached local dependencies: Vite 5.4.21 and Vitest 4.1.11; CI installs the repository lockfile. Hosted Supabase behavior was not exercised for this browser-side change.
