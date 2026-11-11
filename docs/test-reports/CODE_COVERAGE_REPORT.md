# Code Coverage Report

## SprintFlow -- Project Management System

**Team 11 | Section 5C | PES University**
**Owner (STP §9, Test Engineer -- Backend):** Chandan Kumar K (PES2UG24CS128) -- tracking issue #93
**Testing phase:** 2--6 November 2026 | **Measured:** 6 November 2026
**Related Documents:** `docs/STP_Document_Team11.md` (Section 14.1), [Unit Test Report](UNIT_TEST_REPORT.md), [Branch Coverage Report](BRANCH_COVERAGE_REPORT.md)
**PDF version (as submitted, both coverage reports in one file):** [Team11_Code_and_Branch_Coverage_Report.pdf](Team11_Code_and_Branch_Coverage_Report.pdf)
**Version:** 1.1, 11 November 2026. Adds the pre-submission regression on the final `main` and corrections from a final review; the PDF's revision history lists them.

---

## 1. Purpose and Scope

This report measures how much of SprintFlow's source code the automated unit and
integration suite executes. It reports **statement**, **line** and **function** coverage.
**Branch** (decision) coverage is analysed in the
[Branch Coverage Report](BRANCH_COVERAGE_REPORT.md) and appears here only as a summary
column.

The measurement covers every JavaScript and JSX file in `src/` except the entry point
`main.jsx` (62 files), not only the
ones a test imports. A file no test touches therefore counts as 0% instead of disappearing
from the figures.

---

## 2. Method

| Item | Value |
| :--- | :--- |
| Code under test | `main` at commit `f9e0727`; the coverage tooling (`@vitest/coverage-v8`, the `test:coverage` script and the coverage settings in `vite.config.js`) was added in PR #97 without changing `src/` or the tests |
| Coverage tool | `@vitest/coverage-v8` 4.1.12: V8's built-in coverage counters, mapped back to the source |
| Test suite | All 35 unit test files, 234 tests (see the [Unit Test Report](UNIT_TEST_REPORT.md)) |
| Included | `src/**/*.{js,jsx}` |
| Excluded | `src/tests/**` (the tests themselves) and `src/main.jsx` (the 23-line browser entry point that mounts the app) |
| Command | `npm run test:coverage` (configuration in `vite.config.js`) |
| Outputs | HTML report: [`coverage-html/index.html`](coverage-html/index.html); totals: [`evidence/coverage-summary.json`](evidence/coverage-summary.json) |

### What the measures mean

- **Statement:** the share of executable statements that ran at least once.
- **Line:** the same, counted by source line.
- **Function:** the share of functions called at least once.

Several Sprint 2 files put many statements on one long line; `ProjectMap.jsx`, for
example, has 60 statements on 24 lines. For files like these, statement coverage is the
fairer measure.

### Note on the run

- Coverage instrumentation slows every statement. Under it, the Kanban timing benchmark
  (`kanbanPerformance.test.jsx`, 50 ms budget) measured 66 ms and failed.
- The run is configured to report coverage anyway (`reportOnFailure`). The benchmark's
  code still executed, so it still counts toward coverage.
- Pass/fail for that test comes from the normal run, where it passes at 13.7 ms (Unit Test
  Report, Section 6).

---

## 3. Summary Against the Test Plan Target

The STP sets one coverage target (Section 14.1): *"Code Coverage (Unit Tests): percentage
of utility module code exercised by Vitest -- 80% or higher."*

| Scope | Files | Statements | Lines | Functions | Branches | Target | Result |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- | :--- |
| Utility modules (`src/utils`) | 26 | **98.5%** | **99.3%** | **99.1%** | 92.9% | 80% or higher | **Met** |
| Logic layer (`src/utils` + `src/services`) | 32 | 93.5% | 95.2% | 94.9% | 87.9% | -- | -- |
| Whole application (`src/`) | 62 | 66.3% (1412/2130) | 70.5% (1098/1558) | 56.6% (421/744) | 64.1% (995/1552) | -- | -- |

### Verdict: the STP coverage target is met by a wide margin

- The business logic is close to fully covered: estimation, workflow, burndown, audit
  trail, filtering and sprint rules.
- The lower whole-application figure comes from React view components.
- The unit suite renders only some of those components. Most of the rest are verified end
  to end by the system tests; two are not yet (Section 6.2).

---

## 4. Coverage by Folder

| Folder | Files | Statements | Branches | Functions | Lines |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `src/App.jsx` | 1 | 46.7% | 62.5% | 6.7% | 48.1% |
| `src/components/auth` | 1 | 48.3% | 83.3% | 42.9% | 48.1% |
| `src/components/dashboard` | 8 | 20.1% | 22.3% | 17.9% | 27.9% |
| `src/components/docs` | 1 | 0.0% | 0.0% | 0.0% | 0.0% |
| `src/components/kanban` | 3 | 45.8% | 53.5% | 35.8% | 45.3% |
| `src/components/layout` | 2 | 60.0% | 85.2% | 33.3% | 60.0% |
| `src/components/settings` | 2 | 33.3% | 47.7% | 23.5% | 32.2% |
| `src/components/sprint` | 1 | 0.0% | 0.0% | 0.0% | 0.0% |
| `src/components/workspace` | 9 | 12.3% | 9.9% | 10.2% | 20.4% |
| `src/context` | 2 | 78.3% | 59.5% | 66.7% | 82.9% |
| `src/services` | 6 | 88.4% | 79.4% | 87.9% | 91.5% |
| `src/utils` | 26 | 98.5% | 92.9% | 99.1% | 99.3% |
| **All of `src/`** | **62** | **66.3%** | **64.1%** | **56.6%** | **70.5%** |

---

## 5. Coverage by File

### 5.1 Logic layer: utilities, services and contexts

| File | Statements | Branches | Functions | Lines |
| :--- | ---: | ---: | ---: | ---: |
| `context/AuthContext.jsx` | 61.5% (8/13) | n/a (0/0) | 66.7% (4/6) | 58.3% (7/12) |
| `context/ProjectContext.jsx` | 79.5% (140/176) | 59.5% (25/42) | 66.7% (24/36) | 84.9% (129/152) |
| `services/authService.js` | 93.0% (40/43) | 89.3% (25/28) | 100.0% (7/7) | 91.7% (33/36) |
| `services/feedbackStore.js` | 70.6% (24/34) | 20.0% (2/10) | 55.6% (5/9) | 63.6% (7/11) |
| `services/flowHistoryStore.js` | 17.9% (5/28) | 0.0% (0/23) | 0.0% (0/7) | 30.8% (4/13) |
| `services/localPersistence.js` | 93.8% (15/16) | 91.7% (11/12) | 100.0% (4/4) | 91.7% (11/12) |
| `services/mockData.js` | 100.0% (9/9) | n/a (0/0) | 100.0% (1/1) | 100.0% (8/8) |
| `services/supabaseClient.js` | 93.4% (410/439) | 86.9% (232/267) | 95.2% (99/104) | 94.4% (337/357) |
| `utils/accessibility.js` | 100.0% (7/7) | 100.0% (6/6) | 100.0% (1/1) | 100.0% (5/5) |
| `utils/auditTrail.js` | 98.0% (50/51) | 92.1% (58/63) | 100.0% (18/18) | 100.0% (42/42) |
| `utils/burndown.js` | 100.0% (55/55) | 100.0% (33/33) | 100.0% (13/13) | 100.0% (41/41) |
| `utils/commands.js` | 100.0% (8/8) | 83.3% (5/6) | 100.0% (4/4) | 100.0% (6/6) |
| `utils/constants.js` | 100.0% (4/4) | n/a (0/0) | n/a (0/0) | 100.0% (4/4) |
| `utils/deliverySignals.js` | 100.0% (33/33) | 97.0% (32/33) | 100.0% (17/17) | 100.0% (24/24) |
| `utils/estimation.js` | 100.0% (30/30) | 77.3% (17/22) | 100.0% (18/18) | 100.0% (23/23) |
| `utils/flowAnalytics.js` | 98.1% (53/54) | 100.0% (35/35) | 95.0% (19/20) | 100.0% (29/29) |
| `utils/kanban.js` | 100.0% (4/4) | 100.0% (1/1) | 100.0% (3/3) | 100.0% (3/3) |
| `utils/kpis.js` | 100.0% (2/2) | n/a (0/0) | 100.0% (1/1) | 100.0% (2/2) |
| `utils/labels.js` | 100.0% (13/13) | 100.0% (4/4) | 100.0% (7/7) | 100.0% (10/10) |
| `utils/projectMap.js` | 100.0% (43/43) | 100.0% (24/24) | 100.0% (17/17) | 100.0% (26/26) |
| `utils/projectMetadata.js` | 100.0% (27/27) | 87.1% (27/31) | 100.0% (4/4) | 100.0% (24/24) |
| `utils/savedWorkViews.js` | 100.0% (30/30) | 88.5% (23/26) | 100.0% (12/12) | 100.0% (18/18) |
| `utils/sprintLifecycle.js` | 100.0% (27/27) | 100.0% (28/28) | 100.0% (8/8) | 100.0% (20/20) |
| `utils/sprintReports.js` | 95.9% (70/73) | 88.0% (44/50) | 100.0% (37/37) | 100.0% (36/36) |
| `utils/storyPoints.js` | 100.0% (3/3) | 100.0% (4/4) | 100.0% (1/1) | 100.0% (3/3) |
| `utils/taskExplorer.js` | 92.9% (13/14) | 91.2% (62/68) | 87.5% (7/8) | 90.9% (10/11) |
| `utils/taskFilters.js` | 100.0% (13/13) | 93.3% (14/15) | 100.0% (4/4) | 100.0% (10/10) |
| `utils/taskForm.js` | 94.4% (17/18) | 80.0% (24/30) | 100.0% (8/8) | 94.1% (16/17) |
| `utils/taskUpdates.js` | 100.0% (13/13) | 100.0% (8/8) | 100.0% (7/7) | 100.0% (10/10) |
| `utils/userText.js` | 100.0% (8/8) | 92.9% (13/14) | 100.0% (1/1) | 100.0% (6/6) |
| `utils/workflow.js` | 100.0% (10/10) | 100.0% (6/6) | 100.0% (3/3) | 100.0% (7/7) |
| `utils/workSignals.js` | 100.0% (9/9) | 100.0% (17/17) | 100.0% (2/2) | 100.0% (5/5) |
| `utils/workspaceFeedback.js` | 88.9% (16/18) | 93.9% (31/33) | 100.0% (3/3) | 88.9% (8/9) |
| `utils/workViews.js` | 100.0% (14/14) | 100.0% (20/20) | 100.0% (2/2) | 100.0% (9/9) |

### 5.2 User interface: components and the app shell

| File | Statements | Branches | Functions | Lines |
| :--- | ---: | ---: | ---: | ---: |
| `App.jsx` | 46.7% (14/30) | 62.5% (10/16) | 6.7% (1/15) | 48.1% (13/27) |
| `components/auth/SignInView.jsx` | 48.3% (14/29) | 83.3% (10/12) | 42.9% (3/7) | 48.1% (13/27) |
| `components/dashboard/AuditTrail.jsx` | 88.9% (8/9) | 75.0% (15/20) | 80.0% (4/5) | 85.7% (6/7) |
| `components/dashboard/BurndownChart.jsx` | 100.0% (16/16) | 100.0% (8/8) | 100.0% (9/9) | 100.0% (11/11) |
| `components/dashboard/DashboardView.jsx` | 0.0% (0/13) | 0.0% (0/9) | 0.0% (0/7) | 0.0% (0/11) |
| `components/dashboard/DeliverySignals.jsx` | 0.0% (0/8) | 0.0% (0/15) | 0.0% (0/6) | 0.0% (0/6) |
| `components/dashboard/FlowAnalytics.jsx` | 6.3% (3/48) | 0.0% (0/32) | 0.0% (0/28) | 10.5% (2/19) |
| `components/dashboard/KpiCards.jsx` | 100.0% (2/2) | 100.0% (4/4) | 100.0% (2/2) | 100.0% (2/2) |
| `components/dashboard/ReportsWorkbench.jsx` | 0.0% (0/60) | 0.0% (0/40) | 0.0% (0/36) | 0.0% (0/27) |
| `components/dashboard/WorkloadList.jsx` | 100.0% (3/3) | 100.0% (2/2) | 100.0% (2/2) | 100.0% (3/3) |
| `components/docs/DocsView.jsx` | 0.0% (0/11) | 0.0% (0/12) | 0.0% (0/7) | 0.0% (0/11) |
| `components/kanban/KanbanBoard.jsx` | 46.9% (23/49) | 56.3% (18/32) | 32.0% (8/25) | 47.6% (20/42) |
| `components/kanban/LabelPills.jsx` | 100.0% (5/5) | 100.0% (2/2) | 100.0% (2/2) | 100.0% (4/4) |
| `components/kanban/TaskModal.jsx` | 41.6% (32/77) | 48.6% (18/37) | 34.6% (9/26) | 40.8% (29/71) |
| `components/layout/Navbar.jsx` | 56.3% (9/16) | 82.6% (19/23) | 16.7% (1/6) | 56.3% (9/16) |
| `components/layout/Sidebar.jsx` | 75.0% (3/4) | 100.0% (4/4) | 66.7% (2/3) | 75.0% (3/4) |
| `components/settings/ProjectSettingsModal.jsx` | 47.8% (11/23) | 82.6% (19/23) | 42.9% (3/7) | 45.0% (9/20) |
| `components/settings/SettingsModal.jsx` | 25.6% (11/43) | 28.6% (12/42) | 10.0% (1/10) | 25.6% (10/39) |
| `components/sprint/SprintManager.jsx` | 0.0% (0/61) | 0.0% (0/27) | 0.0% (0/20) | 0.0% (0/58) |
| `components/workspace/CommandMenu.jsx` | 24.5% (12/49) | 18.8% (6/32) | 20.0% (3/15) | 34.3% (12/35) |
| `components/workspace/ErrorBoundary.jsx` | 14.3% (1/7) | 0.0% (0/2) | 33.3% (2/6) | 16.7% (1/6) |
| `components/workspace/ProjectMap.jsx` | 0.0% (0/60) | 0.0% (0/67) | 0.0% (0/29) | 0.0% (0/24) |
| `components/workspace/SignalIcon.jsx` | 100.0% (2/2) | 66.7% (2/3) | 100.0% (1/1) | 100.0% (2/2) |
| `components/workspace/TaskExplorer.jsx` | 0.0% (0/93) | 0.0% (0/35) | 0.0% (0/41) | 0.0% (0/47) |
| `components/workspace/TaskPreviewDrawer.jsx` | 7.7% (1/13) | 0.0% (0/35) | 0.0% (0/9) | 20.0% (1/5) |
| `components/workspace/TaskSignals.jsx` | 100.0% (6/6) | 75.0% (9/12) | 100.0% (4/4) | 100.0% (4/4) |
| `components/workspace/WorkSignals.jsx` | 100.0% (2/2) | 20.0% (2/10) | 100.0% (1/1) | 100.0% (2/2) |
| `components/workspace/WorkspaceFeedback.jsx` | 21.2% (11/52) | 10.8% (4/37) | 9.1% (2/22) | 33.3% (9/27) |

---

## 6. Analysis

### 6.1 Files with full line and branch coverage

These 19 files have 100% line and 100% branch coverage:

- `utils`: `accessibility`, `burndown`, `constants`, `flowAnalytics`, `kanban`, `kpis`,
  `labels`, `projectMap`, `sprintLifecycle`, `storyPoints`, `taskUpdates`, `workflow`,
  `workSignals`, `workViews`
- `services`: `mockData`
- `components`: `BurndownChart`, `KpiCards`, `WorkloadList`, `LabelPills`

### 6.2 Files the unit suite does not execute

Seven view components have 0% unit coverage. All of them render inside the running
application, and five are exercised by system test cases.

| Component | Lines | How it is verified | Logic it delegates to (unit coverage, lines) |
| :--- | ---: | :--- | :--- |
| `dashboard/DashboardView.jsx` | 11 | TC-DASH-01, TC-WORK-01, TC-BURN-01, TC-LOG-01, TC-PROJ-01 | `kpis` 100%, `estimation` 100%, `burndown` 100% |
| `dashboard/DeliverySignals.jsx` | 6 | Rendered on the Overview in the cases above (no dedicated check) | `deliverySignals` 100% |
| `docs/DocsView.jsx` | 11 | TC-DOCS-01 (all three tabs) | Static content |
| `sprint/SprintManager.jsx` | 58 | TC-SPR-01, TC-EST-01, TC-EST-02 | `sprintLifecycle` 100%, `estimation` 100% |
| `workspace/TaskExplorer.jsx` | 47 | Opened in TC-AVAIL-01 (render only) | `taskExplorer` 90.9%, `savedWorkViews` 100% |
| `dashboard/ReportsWorkbench.jsx` | 27 | **Not verified at system level** (Sprint 2 enhancement, PR #86) | `sprintReports` 100% |
| `workspace/ProjectMap.jsx` | 24 | **Not verified at system level** (Sprint 2 enhancement, PR #89) | `projectMap` 100% |

The last two are Sprint 2 enhancements that the Test Case Specification predates. Their
calculations are unit-tested through the utilities they call, but the screens themselves
have no automated check.

### 6.3 Gaps in the logic layer

| File | Statements | Gap |
| :--- | ---: | :--- |
| `services/flowHistoryStore.js` | 17.9% | Added in PR #86. No test imports it. It keeps the daily flow history in localStorage behind an in-memory cache, so reading, recording, corrupt-storage handling and the cache are all untested. |
| `services/feedbackStore.js` | 70.6% | Added in PR #88. Settings storage is tested. The `announceSaved` function, which builds the "Saved" / "Completed" notice, triggers haptics and sets the auto-dismiss timer, is not, and neither is the subscription. |
| `context/ProjectContext.jsx` | 79.5% | Untested: the project-load callbacks, guard clauses for a missing task, sprint or audit record, creating a sprint while another is active, a status change other than starting a sprint, deleting the active sprint, and every successful project update. |
| `context/AuthContext.jsx` | 61.5% | Session restore is tested. The context's `signIn` and `signOut` wrappers are not; the unit tests call `authService` directly. Sign-in is exercised by every system test case. |
| `services/supabaseClient.js` | 93.4% | High overall. The misses are cloud-failure exits, older audit rows, read fallbacks and the successful cloud sprint delete (see the Branch Coverage Report, Section 6). |

---

## 7. Recommendations

| Priority | Action | Expected effect |
| :--- | :--- | :--- |
| 1 | Add unit tests for `services/flowHistoryStore.js`: empty and corrupt storage, one observation per day, and the in-memory cache | The only file in `src/utils` or `src/services` below 50% of statements |
| 2 | Add component tests (React Testing Library in jsdom) for `SprintManager`, `TaskExplorer` and `DashboardView` | Brings three untested views, 167 statements, into the unit suite |
| 3 | Add system cases for the Reports & analytics tab and the Project map to the Test Case Specification | Closes the two screens with no automated check |
| 4 | Run `npm run test:coverage` in CI with per-folder thresholds (for example 90% lines for `src/utils`, 85% for `src/services`), and keep the timing benchmark in a separate step | Stops coverage of the logic layer from silently dropping |

---

## 8. Re-measurement on the Final `main` Branch

After this measurement, five pull requests were merged on 6 November 2026 (Unit Test
Report, Section 10). They added one service file (`services/sessionCache.js`), 25 tests,
session-check code in `context/AuthContext.jsx`, some interface code, and the coverage
tooling itself (PR #97). Coverage was measured again on the final `main` (commit
`2b8fdbc`) with the same command; Sections 3 to 7 describe the measured commit `f9e0727`.

| Scope | Measure | Measured commit `f9e0727` | Final `main` `2b8fdbc` |
| :--- | :--- | ---: | ---: |
| Utility modules (`src/utils`) | Lines | 99.3% (397/400) | 99.3% (397/400) |
| | Branches | 92.9% (536/577) | 92.9% (536/577) |
| Services (`src/services`, 6 then 7 files) | Lines | 91.5% (400/437) | 92.3% (455/493) |
| | Branches | 79.4% (270/340) | 80.9% (339/419) |
| Logic layer (utils + services) | Lines | 95.2% (797/837) | 95.4% (852/893) |
| | Branches | 87.9% (806/917) | 87.9% (875/996) |
| Whole application (62 then 63 files) | Statements | 66.3% (1412/2130) | 65.0% (1510/2322) |
| | Lines | 70.5% (1098/1558) | 69.4% (1175/1692) |
| | Functions | 56.6% (421/744) | 56.8% (436/767) |
| | Branches | 64.1% (995/1552) | 64.2% (1087/1692) |

- The utility modules did not change and still meet the 80% target.
- The services now reach 80.9% branch coverage, above 80%; the new session code arrived
  with 21 tests that also exercise failure paths.
- Whole-application line coverage dropped slightly (70.5% to 69.4%). Of the 57 new
  uncovered lines, 48 are session checks that PR #85 added to `context/AuthContext.jsx`,
  which the unit suite does not run; the decision logic they call is unit-tested in
  `sessionVerification.test.js`, and TC-SESS-01 exercises the whole flow in the browser
  (System Validation Report, Section 12.2).

**Final `main`, 11 November 2026.** GitHub Actions run 42973669659 measured the final
`main` (`970c656`) with the same configuration, leaving out only the timing benchmark:
utility modules 99.0% of lines (409/413) and 93.3% of branches (572/613), services 80.8%
of branches (365/452), whole application 69.8% of lines (1208/1731) and 65.2% of branches
(1147/1758). The STP target is still met.

---

## 9. Reproducing This Report

```bash
npm ci
npm run test:coverage      # text summary in the terminal; HTML in coverage/index.html
```

The HTML report in [`coverage-html/`](coverage-html/index.html) is the output of this run.
Open `index.html` in a browser to see each file line by line, with executed lines in green
and missed lines in red.
