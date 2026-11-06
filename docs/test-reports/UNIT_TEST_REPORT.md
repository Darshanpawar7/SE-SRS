# Unit Test Report

## SprintFlow -- Project Management System

**Team 11 | Section 5C | PES University**
**Owner (STP §9, QA Lead):** Gurubelli Yekambar Eshwar Rao (PES2UG24CS173) -- tracking issue #91
**Testing phase:** 2--6 November 2026 | **Executed:** 6 November 2026
**Related Documents:** `docs/STP_Document_Team11.md` (Sections 5, 13, 14), `docs/TEST_CASE_SPECIFICATION.md`, `docs/test-reports/CODE_COVERAGE_REPORT.md`

---

## 1. Purpose and Scope

This report records the execution of SprintFlow's automated unit and integration test
suite, the first test level in the Software Test Plan (STP Section 5.1). It covers every
test file under `src/tests/`: pure logic in `src/utils`, the data service layer in
`src/services`, the React contexts, and the component tests that render the Kanban board,
task dialog, dashboard widgets and sign-in view without a browser.

End-to-end behaviour in a real browser is reported separately in the
[System Validation Report](SYSTEM_VALIDATION_REPORT.md). How much of the code this suite
exercises is reported in the [Code Coverage](CODE_COVERAGE_REPORT.md) and
[Branch Coverage](BRANCH_COVERAGE_REPORT.md) reports.

---

## 2. Test Environment

| Item | Value |
| :--- | :--- |
| Code under test | `main` at commit `f9e0727` (after PR #90, 3 Nov 2026) |
| Test runner | Vitest 4.1.12, `environment: 'node'` (`vite.config.js`) |
| Runtime | Node.js 24.15.0 on Windows 11 Pro |
| Command | `npm test` (`vitest run`) |
| Test data | Seed data in `src/services/mockData.js` and in-test fixtures |
| Raw results | [`evidence/unit-test-results.junit.xml`](evidence/unit-test-results.junit.xml), [`evidence/unit-test-results.json`](evidence/unit-test-results.json) |

The STP (Section 6.2) lists Vite 5 and Vitest 2. The project moved to Vite 7 and Vitest 4
when vulnerable dependencies were remediated (issue #30, merged in PR #76).

---

## 3. Execution Summary

| Measure | Result |
| :--- | ---: |
| Test files executed | 35 |
| Test groups (`describe` blocks) | 63 |
| Test cases executed | 234 |
| Passed | **234** |
| Failed | 0 |
| Skipped / pending | 0 |
| Pass rate | **100%** |
| Wall-clock duration | 2.0 s |

**Verdict: PASS.** Every unit and integration test passed, which meets the STP Section 5.3
entry criterion for system testing ("all unit tests passing, 0 failures").

---

## 4. Results by Test File

"Modules under test" lists the application modules each test file imports, taken from the
file's own `import` statements.

| # | Test file | Modules under test | Tests | Passed | Failed | Duration |
| ---: | :--- | :--- | ---: | ---: | ---: | ---: |
| 1 | `accessibility.test.jsx` | `utils/accessibility`, `components/kanban/KanbanBoard`, `components/kanban/TaskModal`, `context/ProjectContext`, `context/AuthContext`, `utils/constants` | 6 | 6 | 0 | 30 ms |
| 2 | `auditTrail.test.js` | `utils/auditTrail`, `services/supabaseClient`, `services/mockData`, `components/dashboard/AuditTrail`, `context/AuthContext`, `context/ProjectContext` | 17 | 17 | 0 | 178 ms |
| 3 | `auth.test.js` | `services/authService`, `services/supabaseClient`, `utils/constants`, `context/AuthContext`, `context/ProjectContext`, `components/auth/SignInView` | 10 | 10 | 0 | 55 ms |
| 4 | `burndown.test.js` | `utils/burndown`, `services/supabaseClient`, `components/dashboard/BurndownChart` | 8 | 8 | 0 | 45 ms |
| 5 | `commands.test.js` | `utils/commands` | 3 | 3 | 0 | 3 ms |
| 6 | `configSecurity.test.js` | `services/supabaseClient` | 3 | 3 | 0 | 5 ms |
| 7 | `databaseSecurity.test.js` | — | 2 | 2 | 0 | 5 ms |
| 8 | `deliverySignals.test.js` | `utils/deliverySignals` | 6 | 6 | 0 | 12 ms |
| 9 | `estimation.test.js` | `utils/estimation` | 3 | 3 | 0 | 5 ms |
| 10 | `flowAnalytics.test.js` | `utils/flowAnalytics` | 4 | 4 | 0 | 23 ms |
| 11 | `kanbanPerformance.test.jsx` | `utils/constants`, `utils/taskUpdates`, `components/kanban/KanbanBoard`, `context/ProjectContext`, `context/AuthContext` | 1 | 1 | 0 | 939 ms |
| 12 | `kpiDashboard.test.js` | `utils/estimation`, `utils/taskUpdates`, `utils/kpis`, `components/dashboard/KpiCards` | 4 | 4 | 0 | 20 ms |
| 13 | `labels.test.js` | `utils/labels`, `components/kanban/LabelPills`, `services/supabaseClient` | 6 | 6 | 0 | 18 ms |
| 14 | `offlineFallback.test.js` | `services/supabaseClient`, `context/AuthContext`, `context/ProjectContext`, `components/layout/Navbar`, `services/mockData`, `utils/auditTrail`, `services/authService`, `utils/constants` | 14 | 14 | 0 | 93 ms |
| 15 | `persistenceRecovery.test.js` | `services/mockData`, `utils/auditTrail`, `services/localPersistence` | 11 | 11 | 0 | 214 ms |
| 16 | `projectMap.test.js` | `utils/projectMap` | 5 | 5 | 0 | 9 ms |
| 17 | `projectMetadata.test.js` | `utils/projectMetadata`, `utils/auditTrail`, `services/supabaseClient`, `services/mockData`, `utils/constants`, `context/AuthContext`, `context/ProjectContext`, `components/settings/ProjectSettingsModal` | 20 | 20 | 0 | 46 ms |
| 18 | `recovery.test.js` | `components/workspace/ErrorBoundary` | 1 | 1 | 0 | 6 ms |
| 19 | `savedWorkViews.test.js` | `utils/taskExplorer`, `utils/savedWorkViews` | 5 | 5 | 0 | 27 ms |
| 20 | `sprintLifecycle.test.js` | `utils/sprintLifecycle`, `services/supabaseClient` | 16 | 16 | 0 | 13 ms |
| 21 | `sprintMetrics.test.js` | `utils/estimation` | 6 | 6 | 0 | 7 ms |
| 22 | `sprintReports.test.js` | `utils/sprintReports` | 4 | 4 | 0 | 22 ms |
| 23 | `storyPoints.test.js` | `utils/constants`, `utils/storyPoints`, `services/supabaseClient`, `services/mockData` | 16 | 16 | 0 | 20 ms |
| 24 | `supabaseSync.test.js` | `services/supabaseClient`, `services/mockData`, `utils/auditTrail` | 15 | 15 | 0 | 38 ms |
| 25 | `taskExplorer.test.js` | `utils/taskExplorer` | 10 | 10 | 0 | 20 ms |
| 26 | `taskFilters.test.js` | `utils/taskFilters` | 2 | 2 | 0 | 6 ms |
| 27 | `taskForm.test.js` | `services/supabaseClient`, `utils/constants`, `utils/taskForm` | 5 | 5 | 0 | 10 ms |
| 28 | `taskSignals.test.js` | `components/workspace/TaskSignals` | 1 | 1 | 0 | 7 ms |
| 29 | `taskUpdates.test.js` | `utils/taskUpdates` | 3 | 3 | 0 | 9 ms |
| 30 | `userText.test.js` | `utils/taskForm`, `utils/projectMetadata`, `utils/labels`, `utils/userText`, `components/kanban/LabelPills`, `utils/constants` | 4 | 4 | 0 | 19 ms |
| 31 | `workflow.test.js` | `utils/constants`, `utils/kanban`, `utils/workflow`, `services/supabaseClient` | 8 | 8 | 0 | 11 ms |
| 32 | `workload.test.js` | `utils/estimation`, `components/dashboard/WorkloadList` | 5 | 5 | 0 | 17 ms |
| 33 | `workSignals.test.js` | `utils/workSignals`, `utils/taskExplorer`, `utils/auditTrail` | 3 | 3 | 0 | 13 ms |
| 34 | `workspaceFeedback.test.js` | `utils/workspaceFeedback` | 5 | 5 | 0 | 12 ms |
| 35 | `workViews.test.js` | `utils/workViews` | 2 | 2 | 0 | 5 ms |
| | **Total (35 files)** | | **234** | **234** | **0** | |

---

## 5. Unit-Level Coverage of the Requirements

Requirement IDs follow the SRS, which is the project's requirements baseline. The Test Plan
numbers some features differently; the mapping is in `docs/SPRINT1_DEVIATIONS.md`,
Section 1, and both IDs are shown here.

| Feature | SRS ID | Test Plan ID | Unit test files |
| :--- | :--- | :--- | :--- |
| Sign-in and profile switching | PMS-F-001 | PMS-F-001 | `auth` |
| Project metadata | PMS-F-002 | -- | `projectMetadata` |
| Five Kanban columns, drag and drop, one-click advance | PMS-F-003 to 005 | PMS-F-003 to 005 | `workflow`, `taskUpdates`, `kanbanPerformance`, `accessibility` |
| Create and update tasks (incl. priority) | PMS-F-006 | PMS-F-002, PMS-F-016 | `taskForm`, `taskUpdates`, `userText` |
| Labels and tags | PMS-F-007 | -- | `labels` |
| Fibonacci story points | PMS-F-008 | PMS-F-006 | `storyPoints`, `estimation` |
| Planned points and completion | PMS-F-009 | PMS-F-008 | `sprintMetrics`, `estimation` |
| Sprint lifecycle | PMS-F-010 | PMS-F-007 | `sprintLifecycle` |
| Burndown chart | PMS-F-011 | PMS-F-009 | `burndown` |
| KPI dashboard | PMS-F-012 | PMS-F-010 | `kpiDashboard`, `deliverySignals` |
| Team workload | PMS-F-013 | PMS-F-017 | `workload` |
| Audit trail | PMS-F-014 | PMS-F-012 | `auditTrail` |
| Supabase synchronisation and settings | PMS-F-015 | PMS-F-013, PMS-F-015 | `supabaseSync`, `configSecurity` |
| Offline mode | PMS-F-016 | PMS-F-014 | `offlineFallback`, `persistenceRecovery`, `recovery` |
| Filtering | PMS-F-017 | PMS-F-011 | `taskFilters`, `taskExplorer`, `workViews`, `savedWorkViews` |
| CI/CD pipeline | PMS-F-018 | -- | Enforced by the workflow itself (Section 8) |
| In-app documentation viewer | not in SRS | PMS-F-018 | None; static content, verified by TC-DOCS-01 |
| Performance under 50 ms | PMS-NF-001 | PMS-NF-001 | `kanbanPerformance` |
| Zero data loss across reloads | PMS-NF-004 | PMS-NF-006 | `persistenceRecovery`, `recovery`, `offlineFallback` |
| Row Level Security policies | PMS-SR-001 | -- | `databaseSecurity` |
| No hardcoded credentials; anon key only | PMS-SR-002 | -- | `configSecurity` |
| Input sanitisation (XSS) | PMS-SR-004 | -- | `userText` |
| Sprint 2 enhancements | -- | -- | `projectMap`, `flowAnalytics`, `sprintReports`, `workSignals`, `taskSignals`, `workspaceFeedback`, `commands` |

---

## 6. Performance Benchmark (Unit Level)

`kanbanPerformance.test.jsx` times the drag-and-drop state update and the Kanban
re-render for a 100-task fixture (5 warm-ups, 30 samples) against the 50 ms budget of
PMS-NF-001.

| Measure | p50 | p95 | Max |
| :--- | ---: | ---: | ---: |
| State update (`applyTaskUpdate`) | 0.01 ms | 0.03 ms | -- |
| Board render (`renderToStaticMarkup`) | 7.6 ms | 13.6 ms | -- |
| Combined | 7.6 ms | **13.7 ms** | 17.2 ms |

Result: **pass**, with the p95 at about a quarter of the budget.

This test measures wall-clock time, so its margin depends on the machine. Under coverage
instrumentation, which slows every statement, it measured 58--78 ms and failed. It has also
failed on a local machine while other heavy processes were running. It passed in every
completed CI run on `main` since 3 November. Pass/fail in this report comes from the
normal, uninstrumented run.

---

## 7. Slowest Test Cases

| Test case | File | Duration |
| :--- | :--- | ---: |
| records the state update and Kanban component render path for a 100-task fixture | `kanbanPerformance.test.jsx` | 939.2 ms |
| restores all saved entity types, activity, selection and burndown after a new module session | `persistenceRecovery.test.js` | 159.7 ms |
| formats record times relative to now, falling back to the old display text | `auditTrail.test.js` | 123.7 ms |
| shows waiting changes in the navbar instead of "Supabase Connected" | `offlineFallback.test.js` | 35.4 ms |
| records actual observations, keeps past days unchanged and leaves gaps/future days empty | `burndown.test.js` | 18.6 ms |

---

## 8. Continuous Integration History

The same suite runs on every push and pull request in the *CI/CD Pipeline - Team 11*
GitHub Actions workflow (build, `npm test`, lint and a security audit).

| Scope | Runs | Passed | Failed | Other |
| :--- | ---: | ---: | ---: | ---: |
| `main`, CI/CD Pipeline, since 5 Sep 2026 | 50 | 41 | 7 | 2 cancelled |
| `main`, Dependency Security Audit, since 2 Nov 2026 | 10 | 10 | 0 | 0 |
| All branches, last 200 workflow runs | 200 | 188 (94.0%) | 10 | 2 |

Five of the seven failures on `main` happened on 2 November, when a merge left conflict
markers in `TaskModal.jsx` and the build broke. PR #84 fixed it on 3 November, and every
`main` run since then has passed (two runs were cancelled because a newer merge superseded
them). The other two failures date from 15 September.

The STP target for CI pass rate is 95% (STP Section 14.1). The rate over the last 200
runs is 94.0%, just under target, and all of the shortfall comes from the two incidents
above.

---

## 9. Defects

No defects were found at unit level: all 234 tests passed. One observation, which is not a
defect:

| ID | Observation | Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| OBS-01 | `kanbanPerformance.test.jsx` asserts a wall-clock budget, so it fails under coverage instrumentation and can fail on a heavily loaded machine. | Coverage runs report one failure; the code is not slower. | Skip only the timing assertion when coverage is enabled, or keep the benchmark in a separate `npm run bench` step. |

---

## 10. Conclusion

The unit and integration suite is healthy: 234 of 234 tests pass in about two seconds.
Every SRS functional requirement except PMS-F-018 (CI/CD) has at least one unit test file,
and PMS-F-018 is the pipeline that runs them. Lint reports 0 errors and 0 warnings, and
`npm audit --audit-level=high` reports 0 vulnerabilities on the same commit. Unit-level
evidence is complete for the Testing phase.

---

## Appendix A -- Every Test Case

<details>
<summary><code>src/tests/accessibility.test.jsx</code> — 6 tests, 6 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| keyboard and screen-reader task workflow opens a focused task card on "Enter" and prevents the default action | Pass | 3.2 ms |
| keyboard and screen-reader task workflow opens a focused task card on " " and prevents the default action | Pass | 0.6 ms |
| keyboard and screen-reader task workflow does not activate for other keys or events bubbling from a child | Pass | 1.0 ms |
| keyboard and screen-reader task workflow renders focusable named task controls without nesting the quick action inside the card button role | Pass | 16.0 ms |
| keyboard and screen-reader task workflow associates task form labels, names the dialog, and announces validation errors | Pass | 5.4 ms |
| keyboard and screen-reader task workflow gives search and filter controls accessible names | Pass | 3.1 ms |

</details>

<details>
<summary><code>src/tests/auditTrail.test.js</code> — 17 tests, 17 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-014 immutable audit trail creates frozen records with actor, action, target and timestamp | Pass | 10.4 ms |
| PMS-F-014 immutable audit trail rejects records that could not be attributed or dated | Pass | 1.3 ms |
| PMS-F-014 immutable audit trail TC-LOG-01: create, title edit and delete add exactly three records in order | Pass | 4.0 ms |
| PMS-F-014 immutable audit trail TC-LOG-01 through the app: creating, editing and deleting a task each add one record | Pass | 9.4 ms |
| PMS-F-014 immutable audit trail records sprint creation and start made through the app | Pass | 2.6 ms |
| PMS-F-014 immutable audit trail audits sprint deletion and the task changes caused by detaching its tasks | Pass | 3.4 ms |
| PMS-F-014 immutable audit trail keeps long before and after values in full | Pass | 0.6 ms |
| PMS-F-014 immutable audit trail records a plain move as "moved task" and ignores a save with no changes | Pass | 0.6 ms |
| PMS-F-014 immutable audit trail records sprint creation and lifecycle transitions | Pass | 0.8 ms |
| PMS-F-014 immutable audit trail never truncates history and leaves earlier records unchanged | Pass | 6.2 ms |
| PMS-F-014 immutable audit trail keeps both records when two are logged at the same moment | Pass | 1.1 ms |
| PMS-F-014 immutable audit trail keeps the audit trail when demo data is reset, and records the reset | Pass | 1.0 ms |
| PMS-F-014 immutable audit trail only accepts complete audit records | Pass | 1.6 ms |
| PMS-F-014 immutable audit trail formats record times relative to now, falling back to the old display text | Pass | 123.7 ms |
| PMS-F-014 immutable audit trail shows the latest seven records, the total count and a full-history control | Pass | 6.6 ms |
| PMS-F-014 immutable audit trail shows status labels for moves in the seed history | Pass | 2.5 ms |
| PMS-F-014 immutable audit trail records a description-only project change | Pass | 0.7 ms |

</details>

<details>
<summary><code>src/tests/auth.test.js</code> — 10 tests, 10 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-001 team sign-in and profile switching TC-AUTH-01: signs in a team account and keeps the session after a reload | Pass | 7.1 ms |
| PMS-F-001 team sign-in and profile switching rejects a wrong password, an empty password and accounts outside the team | Pass | 3.5 ms |
| PMS-F-001 team sign-in and profile switching switches profile by signing out and signing in as another member | Pass | 1.0 ms |
| PMS-F-001 team sign-in and profile switching discards a stored session that was edited or corrupted | Pass | 1.0 ms |
| PMS-F-001 team sign-in and profile switching uses Supabase Auth when configured and still rejects non-team accounts | Pass | 2.1 ms |
| PMS-F-001 team sign-in and profile switching only lets the team lead use lead-only actions | Pass | 0.8 ms |
| PMS-F-001 team sign-in and profile switching renders the sign-in view with all four team profiles | Pass | 13.3 ms |
| PMS-F-001 team sign-in and profile switching shows only the sign-in view until a member signs in, then the application | Pass | 14.9 ms |
| PMS-F-001 team sign-in and profile switching offers local demo mode when the Supabase connection was saved in this browser | Pass | 3.6 ms |
| PMS-F-001 team sign-in and profile switching lets only the team lead reset the demo data, and only while Supabase is not connected | Pass | 7.1 ms |

</details>

<details>
<summary><code>src/tests/burndown.test.js</code> — 8 tests, 8 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-011 recorded daily burndown records actual observations, keeps past days unchanged and leaves gaps/future days empty | Pass | 18.6 ms |
| PMS-F-011 recorded daily burndown keeps only the latest observation today, tracks scope changes, and fixes the initial ideal baseline | Pass | 1.4 ms |
| PMS-F-011 recorded daily burndown isolates sprints and records zero after removal or completion | Pass | 0.6 ms |
| PMS-F-011 recorded daily burndown freezes completed history and records late completion on its real date | Pass | 1.9 ms |
| PMS-F-011 recorded daily burndown does not invent historical values for a legacy sprint first opened after its end | Pass | 0.7 ms |
| PMS-F-011 recorded daily burndown handles empty, future, one-day and invalid sprints without NaN or crashes | Pass | 1.2 ms |
| PMS-F-011 recorded daily burndown persists observations across service reads instead of truncating them to the audit feed | Pass | 2.3 ms |
| PMS-F-011 recorded daily burndown renders exact daily labels and actual values with accessible empty/one-point states | Pass | 17.8 ms |

</details>

<details>
<summary><code>src/tests/commands.test.js</code> — 3 tests, 3 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Command center shows actions without flooding the default menu with tasks | Pass | 2.1 ms |
| Command center searches descriptions and titles case-insensitively | Pass | 0.3 ms |
| Command center returns navigation and task matches and caps task results | Pass | 0.9 ms |

</details>

<details>
<summary><code>src/tests/configSecurity.test.js</code> — 3 tests, 3 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Supabase credential configuration ignores local environment files and keeps the example credential-free | Pass | 3.4 ms |
| Supabase credential configuration accepts only HTTPS URLs and non-secret public key values | Pass | 1.4 ms |
| Supabase credential configuration rejects service-role JWTs while allowing legacy anon public JWTs | Pass | 0.5 ms |

</details>

<details>
<summary><code>src/tests/databaseSecurity.test.js</code> — 2 tests, 2 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Supabase database security schema enables RLS on every application table and scopes policies to authenticated users | Pass | 4.7 ms |
| Supabase database security schema makes audit records append-only and prevents project deletion from cascading into history | Pass | 0.9 ms |

</details>

<details>
<summary><code>src/tests/deliverySignals.test.js</code> — 6 tests, 6 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Delivery signals computes counts from unfinished scoped items and independent review totals | Pass | 8.1 ms |
| Delivery signals provides honest empty and unknown states | Pass | 1.0 ms |
| Delivery signals uses creation fallback and seven elapsed days boundary | Pass | 0.6 ms |
| Delivery signals does not silently count unknown/future dates as stale | Pass | 0.6 ms |
| Delivery signals counts inclusive UTC calendar dates and clamps before/after schedule | Pass | 0.7 ms |
| Delivery signals handles one day and invalid ranges | Pass | 0.5 ms |

</details>

<details>
<summary><code>src/tests/estimation.test.js</code> — 3 tests, 3 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Agile Estimation & Metric Utilities calculates sprint metrics correctly | Pass | 3.0 ms |
| Agile Estimation & Metric Utilities handles empty task lists safely without division by zero | Pass | 0.5 ms |
| Agile Estimation & Metric Utilities calculates member workload and completion rates | Pass | 0.7 ms |

</details>

<details>
<summary><code>src/tests/flowAnalytics.test.js</code> — 4 tests, 4 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| recorded flow analytics uses paired real transitions, deduplicates events, and measures cycles | Pass | 18.4 ms |
| recorded flow analytics does not invent timing for missing starts or future/corrupt observations | Pass | 1.7 ms |
| recorded flow analytics counts reopened completions separately and restricts to current scope | Pass | 0.8 ms |
| recorded flow analytics replaces only today, preserves prior observations and leaves missing dates absent | Pass | 2.3 ms |

</details>

<details>
<summary><code>src/tests/kanbanPerformance.test.jsx</code> — 1 tests, 1 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| repeatable local Kanban drag/drop and render benchmark records the state update and Kanban component render path for a 100-task fixture | Pass | 939.2 ms |

</details>

<details>
<summary><code>src/tests/kpiDashboard.test.js</code> — 4 tests, 4 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-012 executive KPI dashboard reports total points, delivered velocity, completion and remaining work from the task data | Pass | 4.6 ms |
| PMS-F-012 executive KPI dashboard updates every KPI after a task mutation, with no reload | Pass | 2.6 ms |
| PMS-F-012 executive KPI dashboard renders the four cards with the computed values and an accessible progress bar | Pass | 10.4 ms |
| PMS-F-012 executive KPI dashboard shows zeros, not NaN, when the selected sprint has no tasks | Pass | 1.7 ms |

</details>

<details>
<summary><code>src/tests/labels.test.js</code> — 6 tests, 6 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-007 task labels and tags normalises typed labels into short lowercase tags | Pass | 5.4 ms |
| PMS-F-007 task labels and tags adds a label once and ignores blank or duplicate input | Pass | 2.0 ms |
| PMS-F-007 task labels and tags removes only the chosen label | Pass | 0.7 ms |
| PMS-F-007 task labels and tags cleans legacy label lists that contain duplicates or non-text values | Pass | 0.5 ms |
| PMS-F-007 task labels and tags renders one distinct pill per saved label on the task card | Pass | 7.0 ms |
| PMS-F-007 task labels and tags keeps added and removed labels across a save and reload | Pass | 2.0 ms |

</details>

<details>
<summary><code>src/tests/offlineFallback.test.js</code> — 14 tests, 14 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-016 offline CRUD fallback TC-OFF-01: without credentials, create, update and delete persist in local storage across reloads | Pass | 8.1 ms |
| PMS-F-016 offline CRUD fallback keeps sprint create, update and delete changes in local storage across reloads | Pass | 5.3 ms |
| PMS-F-016 offline CRUD fallback queues a sprint deletion and detached tasks until the cloud is reachable | Pass | 5.2 ms |
| PMS-F-016 offline CRUD fallback keeps a change locally and queues it when the cloud save fails | Pass | 2.0 ms |
| PMS-F-016 offline CRUD fallback shows the local change after a reload while the cloud is still unreachable, then syncs it | Pass | 2.2 ms |
| PMS-F-016 offline CRUD fallback TC-RECOV-01: tasks created while disconnected are not lost after reconnecting | Pass | 1.5 ms |
| PMS-F-016 offline CRUD fallback sends an offline delete later, so the deleted task does not come back | Pass | 2.2 ms |
| PMS-F-016 offline CRUD fallback queues audit records that fail to upload and inserts them later | Pass | 1.6 ms |
| PMS-F-016 offline CRUD fallback runs one retry at a time, so a queued record is sent once | Pass | 2.0 ms |
| PMS-F-016 offline CRUD fallback marks a change before sending it, so a reload during a slow save keeps the local copy | Pass | 8.5 ms |
| PMS-F-016 offline CRUD fallback loads the local copy, not the older cloud row, when writes fail but reads still work | Pass | 1.7 ms |
| PMS-F-016 offline CRUD fallback does not let an older save that finishes late clear a newer failed one | Pass | 13.3 ms |
| PMS-F-016 offline CRUD fallback shows waiting changes in the navbar instead of "Supabase Connected" | Pass | 35.4 ms |
| PMS-F-016 offline CRUD fallback keeps every queued change when a retry fails again | Pass | 4.5 ms |

</details>

<details>
<summary><code>src/tests/persistenceRecovery.test.js</code> — 11 tests, 11 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-NF-004 fresh-session recovery restores all saved entity types, activity, selection and burndown after a new module session | Pass | 159.7 ms |
| PMS-NF-004 fresh-session recovery queues the audit event before an unanswered entity upload and restores it in a fresh session | Pass | 11.8 ms |
| PMS-NF-004 fresh-session recovery keeps all configured-mode entities through failed uploads, restart and retry | Pass | 11.7 ms |
| PMS-NF-004 fresh-session recovery does not let an older projects read overwrite a newer save | Pass | 5.4 ms |
| PMS-NF-004 fresh-session recovery does not let an older sprints read overwrite a newer save | Pass | 3.7 ms |
| PMS-NF-004 fresh-session recovery does not let an older tasks read overwrite a newer save | Pass | 4.0 ms |
| PMS-NF-004 fresh-session recovery replays an interrupted multi-key write before exposing saved state | Pass | 4.0 ms |
| PMS-NF-004 fresh-session recovery preserves the journal if applying it is interrupted, then replays it | Pass | 2.6 ms |
| PMS-NF-004 fresh-session recovery does not overwrite existing entities when the initial journal cannot be saved | Pass | 1.1 ms |
| PMS-NF-004 fresh-session recovery keeps an audit event saved while an older shared-history read is pending | Pass | 3.7 ms |
| PMS-NF-004 fresh-session recovery recovers sprint deletion, detached tasks, audit and delete retry intent together | Pass | 6.0 ms |

</details>

<details>
<summary><code>src/tests/projectMap.test.js</code> — 5 tests, 5 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| never includes foreign project tasks or sprints in the map | Pass | 4.5 ms |
| distinguishes unscheduled work from a missing or foreign sprint | Pass | 1.1 ms |
| searches real labels and owners while preserving membership | Pass | 1.0 ms |
| limits canvas nodes while keeping every matching task available to the table | Pass | 2.3 ms |
| bounds zoom and recovers non-finite values | Pass | 0.5 ms |

</details>

<details>
<summary><code>src/tests/projectMetadata.test.js</code> — 20 tests, 20 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-002 project metadata accepts and normalises a valid key, name and date range | Pass | 7.1 ms |
| PMS-F-002 project metadata rejects the invalid key "" | Pass | 1.9 ms |
| PMS-F-002 project metadata rejects the invalid key "P" | Pass | 0.8 ms |
| PMS-F-002 project metadata rejects the invalid key "1PMS" | Pass | 0.7 ms |
| PMS-F-002 project metadata rejects the invalid key "PM-S" | Pass | 0.6 ms |
| PMS-F-002 project metadata rejects the invalid key "PMS 2" | Pass | 0.5 ms |
| PMS-F-002 project metadata rejects the invalid key "ABCDEFGHIJK" | Pass | 0.5 ms |
| PMS-F-002 project metadata rejects a key already used by another project, ignoring case | Pass | 0.7 ms |
| PMS-F-002 project metadata rejects invalid details {"name":"AB"} | Pass | 0.9 ms |
| PMS-F-002 project metadata rejects invalid details {"name":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} | Pass | 0.9 ms |
| PMS-F-002 project metadata rejects invalid details {"start_date":"2026-02-30"} | Pass | 0.6 ms |
| PMS-F-002 project metadata rejects invalid details {"target_date":"30/10/2026"} | Pass | 0.4 ms |
| PMS-F-002 project metadata rejects invalid details {"start_date":"2026-11-01"} | Pass | 0.4 ms |
| PMS-F-002 project metadata saves the details and shows the same values after a reload | Pass | 1.7 ms |
| PMS-F-002 project metadata checks key uniqueness against every Supabase project and syncs the new dates | Pass | 3.3 ms |
| PMS-F-002 project metadata rejects edits from members other than the lead, and edits before the project has loaded | Pass | 7.6 ms |
| PMS-F-002 project metadata stores new details and their audit record before Supabase answers | Pass | 7.6 ms |
| PMS-F-002 project metadata records which project fields changed in the audit trail | Pass | 0.7 ms |
| PMS-F-002 project metadata lets only the team lead edit; other members see the details read-only | Pass | 7.8 ms |
| PMS-F-002 project metadata falls back to placeholder text before the project has loaded | Pass | 0.6 ms |

</details>

<details>
<summary><code>src/tests/recovery.test.js</code> — 1 tests, 1 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Workspace recovery screen offers non-destructive retry and reload without exposing exception details | Pass | 5.7 ms |

</details>

<details>
<summary><code>src/tests/savedWorkViews.test.js</code> — 5 tests, 5 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| separates saved views by endpoint/account, member and project without key collisions | Pass | 3.6 ms |
| recovers corrupt saved data and validates persisted filters against current enums | Pass | 3.7 ms |
| bounds saved view count and text and handles duplicate stored identities | Pass | 3.1 ms |
| intersects inclusive due-date filters and leaves undated tasks out of a dated range | Pass | 15.5 ms |
| orders recorded timestamps with missing dates last and supports explicit unassigned work | Pass | 1.0 ms |

</details>

<details>
<summary><code>src/tests/sprintLifecycle.test.js</code> — 16 tests, 16 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-010 sprint lifecycle persists planned → active → completed and selected sprint | Pass | 5.0 ms |
| PMS-F-010 sprint lifecycle rejects planned → completed | Pass | 1.2 ms |
| PMS-F-010 sprint lifecycle rejects planned → planned | Pass | 0.3 ms |
| PMS-F-010 sprint lifecycle rejects active → planned | Pass | 0.3 ms |
| PMS-F-010 sprint lifecycle rejects active → active | Pass | 0.3 ms |
| PMS-F-010 sprint lifecycle rejects completed → active | Pass | 0.2 ms |
| PMS-F-010 sprint lifecycle rejects completed → completed | Pass | 0.5 ms |
| PMS-F-010 sprint lifecycle rejects planned → unknown | Pass | 0.4 ms |
| PMS-F-010 sprint lifecycle rejects missing sprints and multiple active sprints in the same project | Pass | 1.1 ms |
| PMS-F-010 sprint lifecycle rejects invalid sprint metadata {"name":"   "} | Pass | 0.8 ms |
| PMS-F-010 sprint lifecycle rejects invalid sprint metadata {"start_date":"invalid"} | Pass | 0.6 ms |
| PMS-F-010 sprint lifecycle rejects invalid sprint metadata {"start_date":"2026-02-30"} | Pass | 0.4 ms |
| PMS-F-010 sprint lifecycle rejects invalid sprint metadata {"end_date":"2026-09-01"} | Pass | 0.6 ms |
| PMS-F-010 sprint lifecycle rejects invalid sprint metadata {"end_date":""} | Pass | 0.4 ms |
| PMS-F-010 sprint lifecycle accepts a same-day sprint and trims its name | Pass | 0.3 ms |
| PMS-F-010 sprint lifecycle restores a valid selection, otherwise prefers an active sprint, then first, then empty | Pass | 0.4 ms |

</details>

<details>
<summary><code>src/tests/sprintMetrics.test.js</code> — 6 tests, 6 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-009 selected sprint totals uses points, not task counts or other sprint/backlog points | Pass | 3.9 ms |
| PMS-F-009 selected sprint totals returns zero metrics for empty scope null | Pass | 0.4 ms |
| PMS-F-009 selected sprint totals returns zero metrics for empty scope undefined | Pass | 0.3 ms |
| PMS-F-009 selected sprint totals returns zero metrics for empty scope  | Pass | 0.2 ms |
| PMS-F-009 selected sprint totals returns zero metrics for empty scope missing | Pass | 0.2 ms |
| PMS-F-009 selected sprint totals recalculates after completion, estimation, reassignment and deletion | Pass | 0.5 ms |

</details>

<details>
<summary><code>src/tests/sprintReports.test.js</code> — 4 tests, 4 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| validates bounded inclusive UTC ranges, including real calendar dates | Pass | 4.2 ms |
| reconciles snapshot totals including unknown statuses, priorities and owners | Pass | 2.4 ms |
| exports recorded transitions in the range and excludes duplicates, other tasks and future events | Pass | 14.2 ms |
| drills into unique current tasks even when a task has multiple completion transitions | Pass | 1.4 ms |

</details>

<details>
<summary><code>src/tests/storyPoints.test.js</code> — 16 tests, 16 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-008 Fibonacci estimates offers exactly the SRS scale | Pass | 4.4 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate 0 before replacing saved tasks | Pass | 3.6 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate -1 before replacing saved tasks | Pass | 0.8 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate 4 before replacing saved tasks | Pass | 0.7 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate 6 before replacing saved tasks | Pass | 0.5 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate 34 before replacing saved tasks | Pass | 0.5 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate 1.5 before replacing saved tasks | Pass | 0.6 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate NaN before replacing saved tasks | Pass | 0.5 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate Infinity before replacing saved tasks | Pass | 0.5 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate null before replacing saved tasks | Pass | 0.6 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate undefined before replacing saved tasks | Pass | 0.6 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate  before replacing saved tasks | Pass | 1.1 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate 5 before replacing saved tasks | Pass | 1.0 ms |
| PMS-F-008 Fibonacci estimates rejects invalid estimate true before replacing saved tasks | Pass | 0.9 ms |
| PMS-F-008 Fibonacci estimates persists every allowed estimate through a read after save | Pass | 0.7 ms |
| PMS-F-008 Fibonacci estimates keeps the seed data on the scale so a fresh board can be saved | Pass | 2.5 ms |

</details>

<details>
<summary><code>src/tests/supabaseSync.test.js</code> — 15 tests, 15 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-015 Supabase synchronisation reads project, sprint and task records from Supabase and keeps a local copy | Pass | 10.3 ms |
| PMS-F-015 Supabase synchronisation publishes local data in foreign-key order on first connection to an empty project | Pass | 3.1 ms |
| PMS-F-015 Supabase synchronisation maps rows onto columns that really exist in database/schema.sql | Pass | 5.8 ms |
| PMS-F-015 Supabase synchronisation upserts only those columns, dropping client-only fields | Pass | 2.0 ms |
| PMS-F-015 Supabase synchronisation stores a change and its audit record locally before the request, even if it never answers | Pass | 2.7 ms |
| PMS-F-015 Supabase synchronisation repairs the 6-point task left by earlier seed data so the board can be saved | Pass | 2.3 ms |
| PMS-F-015 Supabase synchronisation names the task when a stored estimate cannot be saved | Pass | 1.9 ms |
| PMS-F-015 Supabase synchronisation surfaces a sync error without discarding the local change | Pass | 1.2 ms |
| PMS-F-015 Supabase synchronisation deletes the task row in Supabase so a deleted task cannot come back | Pass | 0.7 ms |
| PMS-F-015 Supabase synchronisation stores audit records in activity_logs and never overwrites or duplicates one | Pass | 1.4 ms |
| PMS-F-015 Supabase synchronisation loads project audit records from Supabase and caches the mapped history | Pass | 1.0 ms |
| PMS-F-015 Supabase synchronisation merges local-only audit events with cloud history without duplicates | Pass | 0.9 ms |
| PMS-F-015 Supabase synchronisation falls back to local audit history and reports a cloud read failure | Pass | 0.9 ms |
| PMS-F-015 Supabase synchronisation TC-SET-01: rejects a malformed URL and keeps the previous configuration | Pass | 1.5 ms |
| PMS-F-015 Supabase synchronisation seeds UUID identifiers that satisfy the schema and its foreign keys | Pass | 1.7 ms |

</details>

<details>
<summary><code>src/tests/taskExplorer.test.js</code> — 10 tests, 10 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Task explorer and CSV combines every predicate without mutating input | Pass | 3.4 ms |
| Task explorer and CSV orders priorities, estimates and titles | Pass | 14.0 ms |
| Task explorer and CSV neutralises spreadsheet formulas =1+1 | Pass | 0.5 ms |
| Task explorer and CSV neutralises spreadsheet formulas +cmd | Pass | 0.2 ms |
| Task explorer and CSV neutralises spreadsheet formulas -cmd | Pass | 0.1 ms |
| Task explorer and CSV neutralises spreadsheet formulas @SUM(1) | Pass | 0.1 ms |
| Task explorer and CSV neutralises spreadsheet formulas   =1 | Pass | 0.2 ms |
| Task explorer and CSV neutralises spreadsheet formulas 	=cmd | Pass | 0.2 ms |
| Task explorer and CSV escapes quotes, delimiters, unicode and newlines | Pass | 0.6 ms |
| Task explorer and CSV exports an empty table with headers | Pass | 0.3 ms |

</details>

<details>
<summary><code>src/tests/taskFilters.test.js</code> — 2 tests, 2 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| task board filters combines assignee, priority, and text query using every selected predicate | Pass | 3.2 ms |
| task board filters reset clears assignee, priority, and search state | Pass | 2.5 ms |

</details>

<details>
<summary><code>src/tests/taskForm.test.js</code> — 5 tests, 5 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Task form validation and persistence requires a nonblank title and a supported priority | Pass | 4.6 ms |
| Task form validation and persistence creates and persists every task form field | Pass | 3.5 ms |
| Task form validation and persistence edits and persists task fields while preserving task identity | Pass | 1.1 ms |
| Task form validation and persistence restores persisted values when reopening an edit form | Pass | 0.4 ms |
| Task form validation and persistence preserves backlog and unassigned values when an existing task is saved | Pass | 0.3 ms |

</details>

<details>
<summary><code>src/tests/taskSignals.test.js</code> — 1 tests, 1 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| pairs non-colour labels and icons for every priority and lifecycle status | Pass | 7.4 ms |

</details>

<details>
<summary><code>src/tests/taskUpdates.test.js</code> — 3 tests, 3 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Kanban task transitions moves a dropped task to the target stage and ignores a same-stage drop | Pass | 3.6 ms |
| Kanban task transitions records the local update duration | Pass | 4.3 ms |
| Kanban task transitions records actor, task, prior and next stage, and timestamp for the transition | Pass | 0.7 ms |

</details>

<details>
<summary><code>src/tests/userText.test.js</code> — 4 tests, 4 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| shared user text sanitization neutralizes script and HTML payloads in task title, description, and tags before saving | Pass | 5.4 ms |
| shared user text sanitization neutralizes project name and description and enforces their length limits | Pass | 5.1 ms |
| shared user text sanitization cleans tag and search-view text, while React renders tags as text | Pass | 7.7 ms |
| shared user text sanitization enforces task title, description, and tag limits and rejects a title sanitized to blank | Pass | 0.8 ms |

</details>

<details>
<summary><code>src/tests/workflow.test.js</code> — 8 tests, 8 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| Workflow Enums and Constants Verification verifies 5 Kanban status columns are defined in sequence | Pass | 3.1 ms |
| Workflow Enums and Constants Verification provides all five named columns in board order | Pass | 0.7 ms |
| Workflow Enums and Constants Verification counts exactly the tasks shown in each matching column | Pass | 0.8 ms |
| Workflow Enums and Constants Verification verifies Team 11 members match official PES allocation | Pass | 1.2 ms |
| Workflow Enums and Constants Verification verifies Fibonacci estimation scale | Pass | 0.3 ms |
| Workflow Enums and Constants Verification advances a task by exactly one stage with one update call | Pass | 2.4 ms |
| Workflow Enums and Constants Verification has no enabled next-stage action for Done tasks | Pass | 0.6 ms |
| Workflow Enums and Constants Verification persists an advanced task through the local data service | Pass | 1.1 ms |

</details>

<details>
<summary><code>src/tests/workload.test.js</code> — 5 tests, 5 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| PMS-F-013 team workload and capacity matches each member's assigned and completed points to their own tasks | Pass | 4.2 ms |
| PMS-F-013 team workload and capacity reports a 0% completion rate, never NaN, for a member with no assigned points | Pass | 0.6 ms |
| PMS-F-013 team workload and capacity reconciles member totals with the sprint total by separating unowned work | Pass | 1.1 ms |
| PMS-F-013 team workload and capacity recalculates after a task is reassigned or completed | Pass | 0.5 ms |
| PMS-F-013 team workload and capacity renders every member with their points and the unowned work | Pass | 10.4 ms |

</details>

<details>
<summary><code>src/tests/workSignals.test.js</code> — 3 tests, 3 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| validates real calendar dates and sanitizes bounded blocker text | Pass | 7.7 ms |
| classifies overdue and blocked work while excluding completed work | Pass | 0.8 ms |
| audits planning changes and protects exported blocker formulas | Pass | 4.4 ms |

</details>

<details>
<summary><code>src/tests/workspaceFeedback.test.js</code> — 5 tests, 5 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| defaults to visual motion with opt-in vibration and handles corrupt preferences | Pass | 3.6 ms |
| never vibrates without consent, activation, capability, or with reduced motion | Pass | 3.2 ms |
| single-key actions never interrupt typing, composition or platform shortcuts | Pass | 0.7 ms |
| validates appearance preferences and preserves legacy settings | Pass | 0.4 ms |
| keeps preference changes usable when browser storage is denied | Pass | 3.9 ms |

</details>

<details>
<summary><code>src/tests/workViews.test.js</code> — 2 tests, 2 passed</summary>

| Test case | Result | Duration |
| :--- | :---: | ---: |
| combines a selected scope with distinct actionable quick views | Pass | 4.3 ms |
| keeps empty scopes empty and does not assign someone else’s tasks to the current user | Pass | 0.5 ms |

</details>

## Appendix B -- Reproducing These Results

```bash
npm ci
npm test
# Raw results in the same formats as this report:
npx vitest run --reporter=default --reporter=junit --outputFile.junit=unit-test-results.junit.xml
```
