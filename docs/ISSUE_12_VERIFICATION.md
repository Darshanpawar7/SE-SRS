# Issue #12: Fibonacci estimate validation

The estimate buttons offer 1, 2, 3, 5, 8, 13 and 21. Task create/update validates before changing React state; the data service validates every record before replacing saved tasks. Unsupported numbers, fractions, strings and missing estimates are rejected. The task modal stays open and displays save errors.

Automated cases cover the exact scale, invalid input rejection without overwriting existing storage, all allowed values, and empty task lists. The lint job now installs its dependencies before running.

Manual check: create a task with 13 points, reopen it, change to 21, and reload. Both saved values should appear correctly. Invalid stored estimates must be corrected explicitly before saving.

## Validation

Verified on 26 October 2026: `npm test` (24 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings). Validation used cached local dependencies: Vite 5.4.21 and Vitest 4.1.11; CI installs the repository lockfile. Hosted Supabase behavior was not exercised for this browser-side change.
