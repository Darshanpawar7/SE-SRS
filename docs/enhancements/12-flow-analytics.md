# Recorded delivery analytics

Adds observed cumulative flow, 28-date completion throughput, cycle-time samples with median and nearest-rank p85, and an actionable oldest-open-work chart. Maps to PMS-F-009/011/012/013. Data tables accompany SVG charts. Charts are keyboard-accessible through native details controls and task buttons; motion respects the user's system setting.

Workflow snapshots begin when the dashboard is opened and are sampled on task changes and each minute while open, one latest observation per UTC day. Missing dates remain absent. Snapshots are browser-local and scoped by cache owner, project and sprint; no shared historical series is invented. The last 28 observed dates are plotted (not necessarily 28 consecutive dates). Throughput covers 28 calendar dates and counts retained Done transitions; reopened items can complete again. Cycle time requires a recorded In Progress → subsequent Done pair, including a start before the visible window. Missing starts remain unknown. Metrics cover tasks currently in the selected sprint; deleted or moved tasks without a reliable historical scope are excluded. Sample sizes and definitions are visible. No delivery forecast or synthetic past data is generated.

## Interactive reports extension

Overview now has a Reports & analytics panel. It includes a completion ring, workflow donut, priority-by-status stacked bars, current-assignee point distribution, completion heatmap and a task drill-down table. Current snapshot totals include unknown/unassigned buckets so they reconcile. Zero estimated points is unavailable rather than a fabricated 0% completion score. Workload represents estimates, not employee productivity.

The 7/28/90-day presets and custom range accept 1–90 inclusive UTC calendar dates, reject invalid dates, reversed ranges and future dates, and filter all historical completion/timing/flow charts in this panel. Snapshot cards and current open-work age remain independent of the historical range, as stated beside the controls. Flow observations inside a range remain absent on unobserved dates. The original Overview retains its independent 28-date analytics summary.

Donut legends, priority rows, owner rows and heatmap cells select matching tasks. A task completing twice contributes two throughput events but appears once in its date drill-down. CSV exports explicitly contain recorded completion transitions per UTC date. Completion percentages use current completed points/current sprint points; they are not estimates of delivery confidence or accuracy. All interactions are presentation/filtering extensions to existing Sprint 1/2 visibility and estimation requirements; no database migration or new requirement completion is claimed.

## Review accuracy and retention fixes

Multi-field edits retain their explicit status transition in the audit entry. Throughput excludes creation directly in Done. Returning to To Do/Backlog resets the cycle start. Both open-age panels measure now independently of the completion window. Older missing transitions are not inferred from prose or rewritten.

Derived observations retain 90 calendar dates and at most 50 recent sprint-history keys; expired keys are pruned during recording. Current task/project/audit/pending-work caches are not pruned.
