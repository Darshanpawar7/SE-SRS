# Issue #16: Executive KPI dashboard

The four dashboard KPIs (total story points, delivered velocity, sprint completion and remaining workload) are built by `buildKpiCards` from the selected sprint's metrics and rendered by `KpiCards`. They are derived from task state on every render, so moving, completing or re-estimating a task updates them immediately without a page reload. The completion bar now exposes its value to assistive technology.

Automated cases cover KPI values against task data, recalculation after a status change and a re-estimate, the rendered cards, and the empty-sprint state (zeros, never NaN).

Manual check: open the dashboard and note the four values. Move a To Do task in the selected sprint to Done on the board, return to the dashboard without reloading, and confirm delivered velocity rises by that task's points, remaining workload falls by the same amount, and completion equals completed points divided by total points.

## Validation

Verified on 26 October 2026: `npm test` (75 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings).
