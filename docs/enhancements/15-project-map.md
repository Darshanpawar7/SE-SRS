# Interactive project relationship map

Provides an ERD-inspired explorer of the actual Project → Sprint → Work item relationships already in the Sprint 1/2 data model. It is a presentation extension of project/sprint visibility and work-item navigation, not a new dependency engine, schema editor or completed new SRS requirement. Owner acceptance should be recorded alongside the other proposed enhancements.

- Strictly selects the active project's sprints and tasks. Foreign/missing project IDs are not included.
- Separates unscheduled backlog from tasks referencing a missing or foreign sprint.
- Supports task/sprint/owner/label search, pointer-drag panning, native scroll/keyboard panning, zoom (10–160%), fit-to-screen and reset to 100%.
- Select a card to inspect it. Task editor, project details and sprint-board actions reuse existing application paths. Project editing remains available only to the lead through the existing permission checks; Supabase RLS remains the authorization boundary.
- The canvas renders at most 80 matching task nodes. The visible limit is stated; the relationship table exposes all matches and offers ordinary task buttons as a keyboard-accessible alternative to the spatial layout.
- Empty/deleted selections show an unavailable state. No relationships are fabricated, moved by panning, or written by the map. No additional database columns/migration are needed.

Sidebar navigation and the command menu expose Project map. Styles use existing tokens and pick up PR #88's theme/motion preferences. Merge #84 first, and review #85 for verified cloud-session loading. Native pointer/touch, focus, zoom readability and screen-reader checks remain manual if only JSDOM is available. Unit tests cover scope exclusion, orphan membership, search, complete table data, canvas limits and zoom bounds.
