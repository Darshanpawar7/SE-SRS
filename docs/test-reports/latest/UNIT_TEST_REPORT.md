# Unit Test Report

SprintFlow · Team 11 · Sprint 1/2 testing phase

Generated from an actual run on **2026-11-10T18:29:14.750Z**. Source commit: `f6b389140eeb7e2f772f6a4daf598acf023b68d0`. Node: v24.22.2, linux. Application/test input SHA-256: `20a46f7b089bedc2be8236f3da5e40070b81c108158694b83a777b12fd4809bb`.

Numeric evidence and provenance are in [evidence](evidence/). Full raw JSON/JUnit evidence is retained in the four-test-reports Actions artifact. Original November 6 reports and submitted PDFs are historical snapshots; this report describes the revision above. Report-only commits can differ from this source revision.

| Measure | Uninstrumented suite | Instrumented suite |
| --- | --- | --- |
| Test cases | 259 | 258 |
| Passed | 259 | 258 |
| Failed | 0 | 0 |
| Pending/skipped | 0 | 0 |
| Test files | 38 | 37 |

Verdict: **PASS**. The full suite includes the unchanged Kanban p95 <50 ms benchmark. Coverage excludes only that timing test because instrumentation changes timing; the production code it imports remains in the coverage denominator. The timing result is not inferred from instrumented execution.

| Test file | Passed | Failed | Pending |
| --- | --- | --- | --- |
| tests/accessibility.test.jsx | 6 | 0 | 0 |
| tests/auditTrail.test.js | 17 | 0 | 0 |
| tests/auth.test.js | 10 | 0 | 0 |
| tests/burndown.test.js | 8 | 0 | 0 |
| tests/cloudSessions.test.js | 6 | 0 | 0 |
| tests/commands.test.js | 3 | 0 | 0 |
| tests/configSecurity.test.js | 3 | 0 | 0 |
| tests/databaseSecurity.test.js | 2 | 0 | 0 |
| tests/deliverySignals.test.js | 6 | 0 | 0 |
| tests/estimation.test.js | 3 | 0 | 0 |
| tests/flowAnalytics.test.js | 4 | 0 | 0 |
| tests/kanbanEmptyState.test.jsx | 3 | 0 | 0 |
| tests/kanbanPerformance.test.jsx | 1 | 0 | 0 |
| tests/kpiDashboard.test.js | 4 | 0 | 0 |
| tests/labels.test.js | 6 | 0 | 0 |
| tests/offlineFallback.test.js | 14 | 0 | 0 |
| tests/persistenceRecovery.test.js | 11 | 0 | 0 |
| tests/projectMap.test.js | 5 | 0 | 0 |
| tests/projectMetadata.test.js | 20 | 0 | 0 |
| tests/recovery.test.js | 1 | 0 | 0 |
| tests/savedWorkViews.test.js | 5 | 0 | 0 |
| tests/sessionVerification.test.js | 15 | 0 | 0 |
| tests/sprintLifecycle.test.js | 16 | 0 | 0 |
| tests/sprintMetrics.test.js | 6 | 0 | 0 |
| tests/sprintReports.test.js | 4 | 0 | 0 |
| tests/storyPoints.test.js | 16 | 0 | 0 |
| tests/supabaseSync.test.js | 15 | 0 | 0 |
| tests/taskExplorer.test.js | 10 | 0 | 0 |
| tests/taskFilters.test.js | 2 | 0 | 0 |
| tests/taskForm.test.js | 5 | 0 | 0 |
| tests/taskSignals.test.js | 1 | 0 | 0 |
| tests/taskUpdates.test.js | 3 | 0 | 0 |
| tests/userText.test.js | 4 | 0 | 0 |
| tests/workSignals.test.js | 3 | 0 | 0 |
| tests/workViews.test.js | 2 | 0 | 0 |
| tests/workflow.test.js | 8 | 0 | 0 |
| tests/workload.test.js | 6 | 0 | 0 |
| tests/workspaceFeedback.test.js | 5 | 0 | 0 |
