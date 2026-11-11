# System Validation Pre-check (second machine)

> **Note added when PR #99 was merged.** This is an independent pre-check of the same
> build (`f9e0727`), made by Dhatri Shivaprasad on a second machine on 6 November 2026.
> That machine had no browser that could be automated, so the browser cases below are
> marked Blocked here. They were run in Chrome, Edge and Firefox for the main report,
> [`SYSTEM_VALIDATION_REPORT.md`](../SYSTEM_VALIDATION_REPORT.md). This pre-check
> independently confirms the production build, lint, the 234 unit tests and the preview
> server on a second machine.


**Issue:** #92 — Testing: System Validation Report
**Run date:** 6 November 2026 (Asia/Calcutta)
**Source:** local `main`, commit `f9e0727`
**Validation status:** browser and Supabase-dependent cases remain blocked.

## Environment and method

| Item | Observed value |
| :--- | :--- |
| OS | Microsoft Windows NT 10.0.26300.0 |
| Node.js | v24.18.0 |
| Browser runtime | Not available in this session; browser discovery returned no browsers. Chrome, Edge, and Firefox UI runs were not performed. |
| Production build | `npm run build` passed with Vite 7.3.7; 143 modules transformed. |
| Unit suite | `npm test` passed: 234 tests in 35 files. No failure was reported. The output did not report a skipped count. |
| Lint | `npm run lint` passed. |
| Preview | `npm run preview -- --host 127.0.0.1` started at `http://127.0.0.1:4173/`. Read-only HTTP smoke check: root HTML 200, JS asset 200, CSS asset 200. |
| CI | Not run. |
| Live Supabase project | Not connected or tested. No `.env` or `.env.local` file or key was opened or printed for this report. |

The production bundle was built from the local `main` worktree and served with Vite
preview. The preview and its assets were reachable over localhost. A browser-control
runtime was unavailable (`agent.browsers.list()` returned `[]`), so UI, visual,
keyboard, network-panel, and browser compatibility checks could not be executed.
The Vitest suite is supporting automated evidence, not a substitute for those
production-browser checks. Every test-case result below is therefore marked
**Blocked** unless the case itself was actually exercised in the production browser;
none was.

## Test-case results

“Actual” records the observed state of this run. Where a mapped unit test passed, that
result is called out as a proxy and is not presented as a system-test pass.

| Test case / requirement | Scenario and steps | Expected result | Actual result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-AUTH-01 / PMS-F-001 | Open sign-in, select Team Lead, sign in, inspect navbar, refresh. | Profile name and role appear; session survives refresh. | Production-browser steps not run. Automated auth tests passed in `src/tests/auth.test.js`. | Blocked | `npm test`; browser unavailable. |
| TC-TASK-01 / PMS-F-002 | Create `Implement burndown chart` with High priority, 5 points, and Dhatri assigned; refresh. | Backlog card displays all values and persists. | Production-browser steps not run. Task form and persistence tests passed in the full suite. | Blocked | `src/tests/taskForm.test.js`, `src/tests/supabaseSync.test.js`. |
| TC-TASK-02 / PMS-F-016 | Change an existing task priority to Critical and save. | Card shows a text-labelled Critical badge. | Production-browser steps not run. | Blocked | Full suite passed; no deployed UI interaction. |
| TC-TASK-03 / PMS-F-002 | Save with an empty title, then a whitespace-only title. | Both saves are rejected inline; no task is created. | Production-browser steps not run. | Blocked | `src/tests/taskForm.test.js` passed in full suite. |
| TC-KAN-01 / PMS-F-003 | Open board and inspect the five columns and counts. | Backlog, To Do, In Progress, Code Review, Done appear in order with counts. | Production-browser steps not run. | Blocked | `src/tests/workflow.test.js` passed in full suite. |
| TC-KAN-02 / PMS-F-004 | Drag a Backlog card to In Progress, release, refresh. | Card moves, counts change, and status persists. | Production-browser drag and refresh not run. | Blocked | `src/tests/workflow.test.js`, `src/tests/taskUpdates.test.js` passed in full suite. |
| TC-KAN-03 / PMS-F-005 | Advance a To Do task once; try advancing a Done task. | To Do moves to In Progress; Done stays Done. | Production-browser steps not run. | Blocked | `src/tests/workflow.test.js` passed in full suite. |
| TC-KAN-04 / PMS-F-004 | Drag a card and release outside every drop target. | Card returns to its original column with unchanged status. | Production-browser drag not run. | Blocked | No dedicated production-browser evidence. |
| TC-FILT-01 / PMS-F-011 | Filter High priority, then enter a search with no matching task. | Only High tasks show first; then a clear empty state offers reset. | Production-browser steps not run. | Blocked | `src/tests/taskFilters.test.js` passed in full suite. |
| TC-EST-01 / PMS-F-006 | Select each allowed Fibonacci estimate and attempt a non-Fibonacci value. | Only 1, 2, 3, 5, 8, 13, 21 are accepted and persisted. | Production-browser steps not run. Automated estimation tests passed. | Blocked | `src/tests/estimation.test.js`, `src/tests/storyPoints.test.js`. |
| TC-EST-02 / PMS-F-008 | Assign tasks worth 3, 5, 8 points; remove the 5-point task. | Capacity changes from 16 to 11. | Production-browser steps not run. | Blocked | `src/tests/sprintMetrics.test.js` passed in full suite. |
| TC-SPR-01 / PMS-F-007 | Create Sprint 3 with goal and two-week dates. | Sprint appears with metadata and is available for task assignment. | Production-browser steps not run. | Blocked | `src/tests/sprintLifecycle.test.js` passed in full suite. |
| TC-BURN-01 / PMS-F-009 | Note actual burn, complete a task, revisit dashboard. | Actual line drops by completed points; ideal line stays unchanged. | Production-browser steps not run. | Blocked | `src/tests/burndown.test.js` passed in full suite. |
| TC-DASH-01 / PMS-F-010 | Open dashboard with completed and incomplete sprint tasks. | Progress, velocity, workload appear; progress equals completed/total points. | Production-browser steps not run. | Blocked | `src/tests/kpiDashboard.test.js` passed in full suite. |
| TC-WORK-01 / PMS-F-017 | Open workload with tasks across at least three members. | Per-member points appear and sum to assigned sprint points. | Production-browser steps not run. | Blocked | `src/tests/workload.test.js` passed in full suite. |
| TC-DOCS-01 / PMS-F-018 | Open the in-app documentation view. | Headings are readable and no sections are missing. | Production-browser steps not run. | Blocked | No production-browser evidence. |
| TC-SUPA-01 / PMS-F-013 | Connect Supabase, create a task, inspect PostgreSQL, refresh. | Matching row exists and task remains after refresh. | Not run: no live Supabase project was used. | Blocked | Live cloud setup required. |
| TC-OFF-01 / PMS-F-014 | With no Supabase configuration, create two tasks, close and reopen app. | Both tasks restore from LocalStorage and offline mode is indicated. | Production-browser/tab-close steps not run. Offline persistence tests passed as proxy. | Blocked | `src/tests/offlineFallback.test.js`, `src/tests/persistenceRecovery.test.js`. |
| TC-SET-01 / PMS-F-015 | Save valid Supabase configuration, then try malformed URL. | Valid config selects cloud mode; malformed URL is rejected and prior config remains. | Production-browser settings steps not run. Config validation tests passed as proxy. | Blocked | `src/tests/configSecurity.test.js`, `src/tests/supabaseSync.test.js`. |
| TC-LOG-01 / PMS-F-012 | Create, edit, delete one task; inspect audit log. | Exactly three ordered CREATE/UPDATE/DELETE records include actor, time, entity. | Production-browser steps not run. Audit unit tests passed. | Blocked | `src/tests/auditTrail.test.js` passed in full suite. |
| TC-PERF-01 / PMS-NF-001 | Measure a real drag transition with the browser Performance API. | Transition completes under 50 ms. | Not measured. No browser Performance API measurement was performed; no 50 ms claim is made. | Blocked | Manual browser measurement required. |
| TC-AVAIL-01 / PMS-NF-002 | Disable network while app is open and continue using it. | App remains usable, reports offline mode, and has no unhandled error. | Network-disable interaction not run. Offline fallback tests passed as proxy. | Blocked | `src/tests/offlineFallback.test.js` passed in full suite. |
| TC-COMPAT-01 / PMS-NF-003 | Run TC-KAN-01, TC-KAN-02, TC-TASK-01 in Chrome, Edge, Firefox. | Equivalent behavior and layout in all three browsers. | Not run in Chrome, Edge, or Firefox; no browser runtime was available. | Blocked | Each browser must be tested manually. |
| TC-SEC-01 / PMS-NF-004 | Inspect Supabase requests in DevTools. | Requests use HTTPS/TLS 1.3; no credential appears in a URL. | Not run: no browser DevTools or live Supabase requests. | Blocked | Live cloud and browser DevTools required. |
| TC-LOAD-01 / PMS-NF-005 | Seed 100 tasks and interact with board. | All tasks remain accessible; render and drag stay responsive. | 100-task production-board interaction not run. | Blocked | `src/tests/kanbanPerformance.test.jsx` is not evidence of this 100-task system case. |
| TC-RECOV-01 / PMS-NF-006 | Disconnect, create tasks, reconnect. | Offline tasks are preserved without loss. | Network transition not run. Recovery tests passed as proxy. | Blocked | `src/tests/persistenceRecovery.test.js`, `src/tests/offlineFallback.test.js`. |

## STP §5.4 security validation

| Check | Expected result | Actual result | Status | Evidence / rerun requirement |
| :--- | :--- | :--- | :--- | :--- |
| XSS input sanitization | Script/event-handler payloads never execute; text is rendered safely. | Automated payload and text-sanitization tests passed; browser script-execution check not run. | Blocked | `src/tests/userText.test.js`; inject payloads in task title, description, and sprint goal in a browser. |
| Row Level Security | Cross-project task query returns no unauthorized rows / is denied. | Direct Supabase API query not run. Static RLS contract tests passed. | Blocked | `src/tests/databaseSecurity.test.js`; requires two projects and accounts plus direct API requests. |
| TLS 1.3 | Supabase traffic uses HTTPS/TLS 1.3 only. | Not run; this preview check used localhost and made no Supabase request. | Blocked | Inspect browser DevTools Security/Network panels against configured Supabase. |
| Session token handling | Tokens are stored securely and expired tokens are rejected. | Live JWT storage/expiry behavior not inspected. Automated local session validation tests passed. | Blocked | `src/tests/auth.test.js`; perform authenticated browser test without exposing token values. |
| API key exposure | Bundle contains no service-role/secret credential. | Credential configuration tests passed. The built bundle was not audited for arbitrary secret values. | Blocked | `src/tests/configSecurity.test.js`; review bundle safely and record only whether forbidden markers were found, never values. |
| Input validation fuzzing | Empty, oversized, and special-character inputs are handled without crash. | Sanitization/length validation tests passed; full form fuzzing in production browser not run. | Blocked | `src/tests/userText.test.js`; complete browser form-field fuzzing. |

## Requirements traceability results

These are system-validation statuses, not claims that the automated proxies failed.
Each is **Blocked** because the acceptance workflow requires production-browser or
live-service execution, which was unavailable. The evidence column identifies the
automated proxy where one was run.

| Requirement | Test case | System result | Automated evidence from this run |
| :--- | :--- | :--- | :--- |
| PMS-F-001 | TC-AUTH-01 | Blocked | `auth.test.js` passed |
| PMS-F-002 | TC-TASK-01, TC-TASK-03 | Blocked | `taskForm.test.js` passed |
| PMS-F-003 | TC-KAN-01 | Blocked | `workflow.test.js` passed |
| PMS-F-004 | TC-KAN-02, TC-KAN-04 | Blocked | `workflow.test.js`, `taskUpdates.test.js` passed; outside-drop case still needs browser validation |
| PMS-F-005 | TC-KAN-03 | Blocked | `workflow.test.js` passed |
| PMS-F-006 | TC-EST-01 | Blocked | `estimation.test.js`, `storyPoints.test.js` passed |
| PMS-F-007 | TC-SPR-01 | Blocked | `sprintLifecycle.test.js` passed |
| PMS-F-008 | TC-EST-02 | Blocked | `sprintMetrics.test.js` passed |
| PMS-F-009 | TC-BURN-01 | Blocked | `burndown.test.js` passed |
| PMS-F-010 | TC-DASH-01 | Blocked | `kpiDashboard.test.js` passed |
| PMS-F-011 | TC-FILT-01 | Blocked | `taskFilters.test.js` passed |
| PMS-F-012 | TC-LOG-01 | Blocked | `auditTrail.test.js` passed |
| PMS-F-013 | TC-SUPA-01 | Blocked | `supabaseSync.test.js` passed; live PostgreSQL persistence not checked |
| PMS-F-014 | TC-OFF-01 | Blocked | `offlineFallback.test.js`, `persistenceRecovery.test.js` passed |
| PMS-F-015 | TC-SET-01 | Blocked | `configSecurity.test.js`, `supabaseSync.test.js` passed |
| PMS-F-016 | TC-TASK-02 | Blocked | Full suite passed; browser badge not checked |
| PMS-F-017 | TC-WORK-01 | Blocked | `workload.test.js` passed |
| PMS-F-018 | TC-DOCS-01 | Blocked | No production-browser evidence |
| PMS-NF-001 | TC-PERF-01 | Blocked | No Performance API measurement; target not claimed |
| PMS-NF-002 | TC-AVAIL-01 | Blocked | `offlineFallback.test.js` passed |
| PMS-NF-003 | TC-COMPAT-01 | Blocked | Chrome, Edge, Firefox not run |
| PMS-NF-004 | TC-SEC-01 | Blocked | Live TLS inspection not run |
| PMS-NF-005 | TC-LOAD-01 | Blocked | 100-task browser test not run |
| PMS-NF-006 | TC-RECOV-01 | Blocked | `persistenceRecovery.test.js` passed |

## Rerun procedure and evidence to capture

From the repository root on `main`:

```powershell
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Open the preview URL in Chrome, then repeat in Edge and Firefox. For each test case
above, follow its numbered steps in `docs/TEST_CASE_SPECIFICATION.md`, record the
actual card, field, navigation, persistence, or error result, and capture a screenshot
or a redacted DevTools observation. For TC-PERF-01, record the Performance API timing
and browser/version; do not infer it from Vitest. For TC-SUPA-01, TC-SEC-01 and the RLS
security check, use an authorized test Supabase project and accounts, redact all tokens
and keys, and record only response status/count and TLS version. Run the six STP §5.4
checks above and attach redacted evidence. No GitHub issues were raised because this
run confirmed no defect; the browser- and cloud-blocked cases remain unverified and may
still expose defects.
