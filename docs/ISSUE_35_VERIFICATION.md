# Issue 35 — Maintainable boundaries and zero-warning lint

The task editor now initializes its draft on mount, with a keyed child form. Closing/reopening or changing task, selected sprint or signed-in member gets a fresh draft; unrelated rerenders preserve typing. No prop-to-state synchronization effect is needed. The provider starts in loading state and updates it after asynchronous storage I/O; an effect cleanup prevents the first StrictMode request from applying stale data. User-triggered refreshes explicitly enter loading state.

Service persistence stays in DataService; orchestration stays in ProjectProvider; task input stays in TaskForm; validation and metrics remain pure utility modules. No database or authorization changes.

Both previously advisory rules are errors; unused disable directives are errors. Run `npm run lint -- --max-warnings=0`, `npm test` and `npm run build`. No warning was silenced and no rule disabled to obtain a clean result. CI's lint command can also use --max-warnings=0 (issue 22). Build success is a measured result for a particular revision, not a promise that every future change will pass.
