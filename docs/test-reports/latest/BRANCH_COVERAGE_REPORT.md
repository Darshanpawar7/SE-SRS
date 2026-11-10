# Branch Coverage Report

SprintFlow · Team 11 · Sprint 1/2 testing phase

Generated from an actual run on **2026-11-10T18:29:14.750Z**. Source commit: `f6b389140eeb7e2f772f6a4daf598acf023b68d0`. Node: v24.22.2, linux. Application/test input SHA-256: `20a46f7b089bedc2be8236f3da5e40070b81c108158694b83a777b12fd4809bb`.

Numeric evidence and provenance are in [evidence](evidence/). Full raw JSON/JUnit evidence is retained in the four-test-reports Actions artifact. Original November 6 reports and submitted PDFs are historical snapshots; this report describes the revision above. Report-only commits can differ from this source revision.

Method: V8 branch outcomes reported by Vitest, aggregated by covered/total outcomes, not by averaging percentages. A line can be covered while an alternate condition is never exercised. No separate mandatory branch percentage is specified in the STP; no invented branch target is claimed.

| Scope | Covered outcomes | Total outcomes | Branch coverage |
| --- | --- | --- | --- |
| src/utils/ | 536 | 577 | 92.89% |
| src/services/ | 339 | 419 | 80.9% |
| src/context/ | 32 | 86 | 37.2% |
| src/components/ | 168 | 594 | 28.28% |
| src/ | 1085 | 1692 | 64.12% |

Files with unexecuted outcomes, lowest coverage first:

| Source file | Covered | Total | Branch coverage |
| --- | --- | --- | --- |
| src/components/dashboard/DashboardView.jsx | 0 | 9 | 0% |
| src/components/dashboard/DeliverySignals.jsx | 0 | 15 | 0% |
| src/components/dashboard/FlowAnalytics.jsx | 0 | 32 | 0% |
| src/components/dashboard/ReportsWorkbench.jsx | 0 | 40 | 0% |
| src/components/docs/DocsView.jsx | 0 | 12 | 0% |
| src/components/sprint/SprintManager.jsx | 0 | 27 | 0% |
| src/components/workspace/ErrorBoundary.jsx | 0 | 2 | 0% |
| src/components/workspace/ProjectMap.jsx | 0 | 67 | 0% |
| src/components/workspace/TaskExplorer.jsx | 0 | 35 | 0% |
| src/components/workspace/TaskPreviewDrawer.jsx | 0 | 35 | 0% |
| src/context/AuthContext.jsx | 0 | 20 | 0% |
| src/services/flowHistoryStore.js | 0 | 23 | 0% |
| src/components/workspace/WorkspaceFeedback.jsx | 4 | 37 | 10.81% |
| src/components/workspace/CommandMenu.jsx | 6 | 32 | 18.75% |
| src/components/workspace/WorkSignals.jsx | 2 | 10 | 20% |
| src/services/feedbackStore.js | 2 | 10 | 20% |
| src/components/settings/SettingsModal.jsx | 12 | 42 | 28.57% |
| src/context/ProjectContext.jsx | 32 | 66 | 48.48% |
| src/components/kanban/TaskModal.jsx | 18 | 37 | 48.64% |
| src/App.jsx | 10 | 16 | 62.5% |
| src/components/kanban/KanbanBoard.jsx | 29 | 45 | 64.44% |
| src/components/workspace/SignalIcon.jsx | 2 | 3 | 66.66% |
| src/components/dashboard/AuditTrail.jsx | 15 | 20 | 75% |
| src/components/workspace/TaskSignals.jsx | 9 | 12 | 75% |
| src/utils/estimation.js | 17 | 22 | 77.27% |
| src/components/auth/SignInView.jsx | 11 | 14 | 78.57% |
| src/utils/taskForm.js | 24 | 30 | 80% |
| src/components/layout/Navbar.jsx | 19 | 23 | 82.6% |
| src/components/settings/ProjectSettingsModal.jsx | 19 | 23 | 82.6% |
| src/utils/commands.js | 5 | 6 | 83.33% |
| src/services/supabaseClient.js | 233 | 271 | 85.97% |
| src/utils/projectMetadata.js | 27 | 31 | 87.09% |
| src/utils/sprintReports.js | 44 | 50 | 88% |
| src/utils/savedWorkViews.js | 23 | 26 | 88.46% |
| src/services/authService.js | 71 | 80 | 88.75% |
| src/utils/taskExplorer.js | 62 | 68 | 91.17% |
| src/services/localPersistence.js | 11 | 12 | 91.66% |
| src/utils/auditTrail.js | 58 | 63 | 92.06% |
| src/utils/userText.js | 13 | 14 | 92.85% |
| src/utils/taskFilters.js | 14 | 15 | 93.33% |
| src/utils/workspaceFeedback.js | 31 | 33 | 93.93% |
| src/services/sessionCache.js | 22 | 23 | 95.65% |
| src/utils/deliverySignals.js | 32 | 33 | 96.96% |
