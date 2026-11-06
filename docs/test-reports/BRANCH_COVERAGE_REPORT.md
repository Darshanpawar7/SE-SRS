# Branch Coverage Report

## SprintFlow -- Project Management System

**Team 11 | Section 5C | PES University**
**Owner (STP §9, Test Architect):** Darshan P Pawar (PES2UG24CS143) -- tracking issue #94
**Testing phase:** 2--6 November 2026 | **Measured:** 6 November 2026
**Related Documents:** `docs/STP_Document_Team11.md` (Section 14), [Code Coverage Report](CODE_COVERAGE_REPORT.md), [Unit Test Report](UNIT_TEST_REPORT.md)
**PDF version (as submitted, both coverage reports in one file):** [Team11_Code_and_Branch_Coverage_Report.pdf](Team11_Code_and_Branch_Coverage_Report.pdf)

---

## 1. Purpose and Scope

Statement coverage shows whether a line ran. Branch coverage shows whether **each possible
outcome of every decision** ran: both sides of an `if`, both results of a ternary, each
operand of `&&`, `||` and `??`, and every default parameter value.

This matters because a decision can execute on every test while one of its outcomes never
does. A bug on the untaken side is then invisible to the suite. For example, an error path
that only runs when the network fails.

This report measures branch coverage for the whole of `src/` (62 files), using the same
unit and integration suite as the [Code Coverage Report](CODE_COVERAGE_REPORT.md).

---

## 2. Method

| Item | Value |
| :--- | :--- |
| Code under test | `main` at commit `f9e0727` |
| Tool | `@vitest/coverage-v8` 4.1.12. V8 records which outcome of each decision ran, and the counts are mapped back to the source with AST-aware remapping. |
| Test suite | 35 unit test files, 234 tests |
| Command | `npm run test:coverage` |
| Raw data | [`evidence/coverage-summary.json`](evidence/coverage-summary.json); per-line detail in [`coverage-html/`](coverage-html/index.html) (yellow marks a missed outcome) |

### Terms used in this report

| Term | Meaning |
| :--- | :--- |
| Decision point | One place in the code where execution can go more than one way |
| Outcome | One way it can go. An `if` has two (including an implicit empty `else`); `a ?? b` has two; `a && b && c` has three; a default parameter has one (the default is used). |
| Branch coverage | Outcomes taken at least once, divided by all outcomes |
| Fully covered decision | A decision point where every outcome was taken at least once |

The timing benchmark fails under instrumentation (Code Coverage Report, Section 2). Its
decisions still ran, so they are counted.

---

## 3. Summary

| Scope | Decision points | Outcomes | Outcomes taken | Branch coverage |
| :--- | ---: | ---: | ---: | ---: |
| Utility modules (`src/utils`, 26 files) | 294 | 577 | 536 | **92.9%** |
| Services (`src/services`, 6 files) | 168 | 340 | 270 | **79.4%** |
| Logic layer (`src/utils` + `src/services`) | 462 | 917 | 806 | **87.9%** |
| React contexts (`src/context`, 2 files) | 24 | 42 | 25 | 59.5% |
| Whole application (`src/`, 62 files) | 778 | 1552 | 995 | **64.1%** |

Across the application, 438 of 778 decision points (56.3%) have every outcome taken.

**Verdict.** The STP sets no separate branch target. Measured against its 80% coverage
target for utility modules (STP Section 14.1):

- **Utilities:** 92.9%, so the target is met.
- **Services:** 79.4%, just under it. The missed outcomes are almost all failure and
  fallback paths, listed in Section 6.
- **Components:** these pull the whole-application figure down, as in the Code Coverage
  Report.

---

## 4. Branch Coverage by Kind of Decision

| Branch kind | Decision points | Outcomes (arms) | Outcomes taken | Branch coverage | Points with every outcome taken |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Logical `&&`, `\|\|`, `??` | 324 | 717 | 452 | 63.0% | 160 (49.4%) |
| `if` / `else` | 206 | 412 | 306 | 74.3% | 140 (68.0%) |
| Ternary `a ? b : c` | 175 | 350 | 166 | 47.4% | 67 (38.3%) |
| Default parameter value | 73 | 73 | 71 | 97.3% | 71 (97.3%) |
| **All** | **778** | **1552** | **995** | **64.1%** | **438 (56.3%)** |

What the figures show:

- **Default parameters** are almost fully covered: tests rarely omit an argument by
  accident.
- **`if` / `else`** is the best-tested real decision, at 74%.
- **Ternaries (47%)** are mostly conditional rendering in JSX
  (`isOpen ? <Dialog/> : null`, `error && <p role="alert">`). Their coverage tracks how much
  of each component the unit tests render.
- **Logical expressions (63%)** are the same, plus `??` / `||` fallbacks for missing
  fields, which tests seldom exercise.

---

## 5. Branch Coverage by Folder

| Folder | Files | Decision points | Outcomes | Outcomes taken | Branch coverage |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `src/App.jsx` | 1 | 8 | 16 | 10 | 62.5% |
| `src/components/auth` | 1 | 6 | 12 | 10 | 83.3% |
| `src/components/dashboard` | 8 | 65 | 130 | 29 | 22.3% |
| `src/components/docs` | 1 | 6 | 12 | 0 | 0.0% |
| `src/components/kanban` | 3 | 34 | 71 | 38 | 53.5% |
| `src/components/layout` | 2 | 13 | 27 | 23 | 85.2% |
| `src/components/settings` | 2 | 32 | 65 | 31 | 47.7% |
| `src/components/sprint` | 1 | 13 | 27 | 0 | 0.0% |
| `src/components/workspace` | 9 | 115 | 233 | 23 | 9.9% |
| `src/context` | 2 | 24 | 42 | 25 | 59.5% |
| `src/services` | 6 | 168 | 340 | 270 | 79.4% |
| `src/utils` | 26 | 294 | 577 | 536 | 92.9% |

---

## 6. Logic Layer: Every Missed Outcome

The last column lists the source lines with at least one outcome that no test takes. Open
the file in [`coverage-html/`](coverage-html/index.html) to see each one highlighted.

| File | Decision points | Outcomes taken | Branch coverage | Lines with a missed outcome |
| :--- | ---: | ---: | ---: | :--- |
| `context/AuthContext.jsx` | 0 | 0/0 | n/a | — |
| `context/ProjectContext.jsx` | 24 | 25/42 | 59.5% | 79, 81, 83, 93, 120, 146, 165, 178, 188, 193, 196, 206, 223, 235 |
| `services/authService.js` | 14 | 25/28 | 89.3% | 33, 40, 75 |
| `services/feedbackStore.js` | 5 | 2/10 | 20.0% | 11, 12 |
| `services/flowHistoryStore.js` | 12 | 0/23 | 0.0% | 3, 5, 6, 7, 14, 15, 18 |
| `services/localPersistence.js` | 4 | 11/12 | 91.7% | 9 |
| `services/mockData.js` | 0 | 0/0 | n/a | — |
| `services/supabaseClient.js` | 133 | 232/267 | 86.9% | 36, 60, 61, 89, 92, 138, 160, 199, 205, 207, 210, 215, 218, 224, 227, 447, 457, 461, 512, 551, 584, 587, 607, 609, 644 |
| `utils/accessibility.js` | 3 | 6/6 | 100.0% | — |
| `utils/auditTrail.js` | 33 | 58/63 | 92.1% | 57, 188, 193 |
| `utils/burndown.js` | 18 | 33/33 | 100.0% | — |
| `utils/commands.js` | 3 | 5/6 | 83.3% | 5 |
| `utils/constants.js` | 0 | 0/0 | n/a | — |
| `utils/deliverySignals.js` | 17 | 32/33 | 97.0% | 25 |
| `utils/estimation.js` | 14 | 17/22 | 77.3% | 11, 14, 34, 37, 60 |
| `utils/flowAnalytics.js` | 18 | 35/35 | 100.0% | — |
| `utils/kanban.js` | 1 | 1/1 | 100.0% | — |
| `utils/kpis.js` | 0 | 0/0 | n/a | — |
| `utils/labels.js` | 2 | 4/4 | 100.0% | — |
| `utils/projectMap.js` | 11 | 24/24 | 100.0% | — |
| `utils/projectMetadata.js` | 16 | 27/31 | 87.1% | 7, 15, 23, 43 |
| `utils/savedWorkViews.js` | 11 | 23/26 | 88.5% | 6, 10, 17 |
| `utils/sprintLifecycle.js` | 12 | 28/28 | 100.0% | — |
| `utils/sprintReports.js` | 27 | 44/50 | 88.0% | 7, 22, 24, 46, 51 |
| `utils/storyPoints.js` | 2 | 4/4 | 100.0% | — |
| `utils/taskExplorer.js` | 32 | 62/68 | 91.2% | 9, 12, 13, 14, 15, 26 |
| `utils/taskFilters.js` | 9 | 14/15 | 93.3% | 10 |
| `utils/taskForm.js` | 15 | 24/30 | 80.0% | 14, 34, 36, 37, 38, 52 |
| `utils/taskUpdates.js` | 5 | 8/8 | 100.0% | — |
| `utils/userText.js` | 9 | 13/14 | 92.9% | 13 |
| `utils/workflow.js` | 3 | 6/6 | 100.0% | — |
| `utils/workSignals.js` | 8 | 17/17 | 100.0% | — |
| `utils/workspaceFeedback.js` | 15 | 31/33 | 93.9% | 7, 13 |
| `utils/workViews.js` | 10 | 20/20 | 100.0% | — |

### 6.1 What the missed outcomes are

| File | Coverage | Missed outcomes, by behaviour |
| :--- | ---: | :--- |
| `services/supabaseClient.js` | 86.9% (232/267) | **Sync-queue failure exits** (lines 447, 457, 461, 584): when deleting a sprint or inserting an audit row fails in the cloud, the queue stops and keeps the change for retry; untested. **Older audit rows** (lines 199--227): rows saved by earlier builds without metadata, whose type is inferred from the action text. **Read fallbacks** (lines 510--512, 607, 644): a cloud read failing, returning no data, or overtaken by a newer local change. **Defaults for missing values** (lines 36, 60, 138, 160). |
| `utils/estimation.js` | 77.3% (17/22) | The `\|\| 0` fallback on lines 11, 14, 34, 37 and 60, used when a task's story points are missing or not a number. Every test task has a valid estimate, so the fallback never runs. |
| `context/ProjectContext.jsx` | 59.5% (25/42) | **Guards:** a late load result ignored after a newer one (79); no audit record (93); task or sprint not found (120, 146, 188); project not loaded (235). **Sprint selection:** the first sprint created becomes active (165); starting a sprint selects it (178); deleting the active sprint clears the selection (206); selecting an unknown sprint is ignored (223). |
| `services/flowHistoryStore.js` | 0.0% (0/23) | No test imports the module (Code Coverage Report, Section 6.3). |
| `services/feedbackStore.js` | 20.0% (2/10) | The "Completed" versus "Saved" versus "Created" wording, and the haptics options, in `announceSaved` (lines 11--12). |
| `utils/taskForm.js` | 80.0% (24/30) | Defaults for a task missing its title, status, priority or estimate (lines 34--38); a new task when no sprint is selected (52); labels that are not a list (14). |
| `utils/taskExplorer.js` | 91.2% (62/68) | Search across tasks without a description, assignee or labels (9); due-date sorting when both tasks have no date (12); CSV export of a task without a sprint or labels (26). |
| `utils/auditTrail.js` | 92.1% (58/63) | An empty list change shown as "—" (57); a record without a timestamp (188); one side of the "N hours ago" wording (193). |

Most missed outcomes in the logic layer fall into two groups:

- **Defensive fallbacks for malformed or missing data.** The seed data and fixtures are
  always well-formed, so these never run.
- **Cloud-failure paths.** These need a mocked failure for each request.

Neither group is exercised by normal use. Both are where defects tend to hide, because
they run only when something has already gone wrong.

---

## 7. User Interface Files

| File | Decision points | Outcomes taken | Branch coverage |
| :--- | ---: | ---: | ---: |
| `App.jsx` | 8 | 10/16 | 62.5% |
| `components/auth/SignInView.jsx` | 6 | 10/12 | 83.3% |
| `components/dashboard/AuditTrail.jsx` | 10 | 15/20 | 75.0% |
| `components/dashboard/BurndownChart.jsx` | 4 | 8/8 | 100.0% |
| `components/dashboard/DashboardView.jsx` | 5 | 0/9 | 0.0% |
| `components/dashboard/DeliverySignals.jsx` | 7 | 0/15 | 0.0% |
| `components/dashboard/FlowAnalytics.jsx` | 16 | 0/32 | 0.0% |
| `components/dashboard/KpiCards.jsx` | 2 | 4/4 | 100.0% |
| `components/dashboard/ReportsWorkbench.jsx` | 20 | 0/40 | 0.0% |
| `components/dashboard/WorkloadList.jsx` | 1 | 2/2 | 100.0% |
| `components/docs/DocsView.jsx` | 6 | 0/12 | 0.0% |
| `components/kanban/KanbanBoard.jsx` | 15 | 18/32 | 56.3% |
| `components/kanban/LabelPills.jsx` | 1 | 2/2 | 100.0% |
| `components/kanban/TaskModal.jsx` | 18 | 18/37 | 48.6% |
| `components/layout/Navbar.jsx` | 11 | 19/23 | 82.6% |
| `components/layout/Sidebar.jsx` | 2 | 4/4 | 100.0% |
| `components/settings/ProjectSettingsModal.jsx` | 12 | 19/23 | 82.6% |
| `components/settings/SettingsModal.jsx` | 20 | 12/42 | 28.6% |
| `components/sprint/SprintManager.jsx` | 13 | 0/27 | 0.0% |
| `components/workspace/CommandMenu.jsx` | 16 | 6/32 | 18.8% |
| `components/workspace/ErrorBoundary.jsx` | 1 | 0/2 | 0.0% |
| `components/workspace/ProjectMap.jsx` | 33 | 0/67 | 0.0% |
| `components/workspace/SignalIcon.jsx` | 2 | 2/3 | 66.7% |
| `components/workspace/TaskExplorer.jsx` | 17 | 0/35 | 0.0% |
| `components/workspace/TaskPreviewDrawer.jsx` | 17 | 0/35 | 0.0% |
| `components/workspace/TaskSignals.jsx` | 6 | 9/12 | 75.0% |
| `components/workspace/WorkSignals.jsx` | 5 | 2/10 | 20.0% |
| `components/workspace/WorkspaceFeedback.jsx` | 18 | 4/37 | 10.8% |

Unit-level branch coverage of the components is low, for the reasons in the Code Coverage
Report (Section 6.2). Most of these branches choose what to render, and they are exercised
by the system test cases in the [System Validation Report](SYSTEM_VALIDATION_REPORT.md).
Branch counters are not collected from the browser runs, so those executions do not appear
in this report's figures.

---

## 8. Recommendations

| Priority | Test to add | Outcomes it closes |
| :--- | :--- | :--- |
| 1 | `estimation`: a sprint containing a task with no story points and one with a non-numeric value | 5 outcomes; `estimation.js` to 100% |
| 2 | `supabaseSync`: mock a failing sprint delete and a failing audit insert while the queue drains; assert the change stays queued for retry | Sync-queue failure exits (lines 447--461, 584) |
| 3 | `supabaseSync`: load audit rows with no `metadata`, and with `details` that are not JSON | Older-row parsing (lines 199--227) |
| 4 | `ProjectContext`: delete the active sprint, select a sprint that no longer exists, and resolve two loads out of order | The guard and sprint-selection outcomes in Section 6.1 |
| 5 | New `flowHistoryStore.test.js`: empty and corrupt storage, one observation per day, cache reuse | 23 outcomes |
| 6 | Component tests (React Testing Library) for open, closed and error states of `TaskModal`, `SettingsModal` and `SprintManager` | Most of the 47% ternary figure |
| 7 | CI gate: run coverage in CI with branch thresholds of 90% for `src/utils` and 80% for `src/services` | Keeps the logic layer from regressing |

Recommendations 1 to 4 are small, self-contained tests. Together they would raise
`src/services` above the 80% mark and the logic layer to roughly 90% branch coverage.

---

## 9. Reproducing This Report

```bash
npm ci
npm run test:coverage
# Branch totals: the "% Branch" column of the terminal summary, or coverage/coverage-summary.json.
# Missed outcomes: open coverage/index.html; untaken branches are highlighted in yellow.
```
