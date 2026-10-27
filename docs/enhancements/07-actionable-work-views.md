# Actionable work views

The explorer now exposes quick views for My open work, Urgent (unfinished high/critical), Review, Unassigned and Stale (seven elapsed days). Quick-view counts use the current scope before text/filter predicates. All filters intersect; Clear filters restores All work and resets those predicates while preserving scope. An explicit Unscheduled backlog scope exposes tasks without a sprint. Selected-sprint scope is empty when no sprint is selected, rather than silently including backlog tasks. The table also shows the saved UTC update date.

Verify that switching scope updates counts, My work uses the signed-in member, completed tasks do not appear in urgent/stale/owner views, combined filters work, and CSV exports exactly the visible intersection.
