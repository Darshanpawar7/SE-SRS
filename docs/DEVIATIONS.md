# Deviations and Verification Limits

## PMS-NF-001 (#31)

The repeatable local benchmark measures the state update and `KanbanBoard` React component render to static HTML for a 100-task fixture. Combined p95 was 6.8576 ms in the isolated run and 26.6921 ms during the full-suite run concurrent with lint. Browser DOM commit, layout, paint, and the complete pointer-driven drag/drop interaction have not been measured, so no browser end-to-end claim is made. See [PERFORMANCE.md](PERFORMANCE.md) for the setup, command, results, and coverage limits.
