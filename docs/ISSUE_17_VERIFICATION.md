# Issue #17: Team workload and capacity

The dashboard's workload panel is rendered by `WorkloadList` from `summarizeWorkload`. Each team member's assigned points, completed points and completion rate come only from the tasks assigned to them in the selected sprint; a member with no assigned points shows 0%, never NaN. Work that no team member owns (unassigned, or assigned to someone outside the team) is shown on its own line, so the member totals plus the unassigned points always equal the sprint total. Each member's progress bar exposes its value to assistive technology.

Automated cases cover per-member points and completion rates, the zero-points case, reconciliation with the sprint total, recalculation after reassignment and completion, and the rendered panel.

Manual check: in a sprint with tasks for at least three members, add up each member's "story points assigned" plus the unassigned line and confirm it equals the dashboard's Total Story Points. Reassign one task and confirm both members' totals change straight away.

## Validation

Verified on 26 October 2026: `npm test` (80 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings).
