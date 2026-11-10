# Code Coverage Report

SprintFlow · Team 11 · Sprint 1/2 testing phase

Generated from an actual run on **2026-11-10T18:29:14.750Z**. Source commit: `f6b389140eeb7e2f772f6a4daf598acf023b68d0`. Node: v24.22.2, linux. Application/test input SHA-256: `20a46f7b089bedc2be8236f3da5e40070b81c108158694b83a777b12fd4809bb`.

Numeric evidence and provenance are in [evidence](evidence/). Full raw JSON/JUnit evidence is retained in the four-test-reports Actions artifact. Original November 6 reports and submitted PDFs are historical snapshots; this report describes the revision above. Report-only commits can differ from this source revision.

Method: Vitest V8, every `src/**/*.{js,jsx}` file including unimported modules; excludes test files and the Vite entry point (`src/main.jsx`) only. See `vite.config.js` and the unit manifest for exact commands.

| Scope | Covered lines | Total lines | Line coverage | Statements | Functions |
| --- | --- | --- | --- | --- | --- |
| src/utils/ | 397 | 400 | 99.25% | 98.45% | 99.08% |
| src/services/ | 455 | 493 | 92.29% | 88.87% | 88.81% |
| src/context/ | 146 | 230 | 63.47% | 55.05% | 56% |
| src/components/ | 163 | 541 | 30.12% | 24.48% | 18.28% |
| src/ | 1175 | 1692 | 69.44% | 65.03% | 56.84% |

STP §14 utility code coverage target: **≥80%**. Measured utility line coverage: **99.25% — PASS**. This threshold is enforced by the report command/CI. Browser execution is reported separately and is not added to V8 unit coverage. Low UI/context coverage is visible here rather than omitted from the denominator.

| Source file | Lines | Statements | Functions |
| --- | --- | --- | --- |
| src/App.jsx | 50% | 48.38% | 12.5% |
| src/components/auth/SignInView.jsx | 48.14% | 48.27% | 42.85% |
| src/components/dashboard/AuditTrail.jsx | 85.71% | 88.88% | 80% |
| src/components/dashboard/BurndownChart.jsx | 100% | 100% | 100% |
| src/components/dashboard/DashboardView.jsx | 0% | 0% | 0% |
| src/components/dashboard/DeliverySignals.jsx | 0% | 0% | 0% |
| src/components/dashboard/FlowAnalytics.jsx | 10.52% | 6.25% | 0% |
| src/components/dashboard/KpiCards.jsx | 100% | 100% | 100% |
| src/components/dashboard/ReportsWorkbench.jsx | 0% | 0% | 0% |
| src/components/dashboard/WorkloadList.jsx | 100% | 100% | 100% |
| src/components/docs/DocsView.jsx | 0% | 0% | 0% |
| src/components/kanban/KanbanBoard.jsx | 57.69% | 58.06% | 37.03% |
| src/components/kanban/LabelPills.jsx | 100% | 100% | 100% |
| src/components/kanban/TaskModal.jsx | 40.84% | 41.55% | 34.61% |
| src/components/layout/Navbar.jsx | 56.25% | 56.25% | 16.66% |
| src/components/layout/Sidebar.jsx | 75% | 75% | 66.66% |
| src/components/settings/ProjectSettingsModal.jsx | 45% | 47.82% | 42.85% |
| src/components/settings/SettingsModal.jsx | 25.64% | 25.58% | 10% |
| src/components/sprint/SprintManager.jsx | 0% | 0% | 0% |
| src/components/workspace/CommandMenu.jsx | 34.28% | 24.48% | 20% |
| src/components/workspace/ErrorBoundary.jsx | 16.66% | 14.28% | 33.33% |
| src/components/workspace/ProjectMap.jsx | 0% | 0% | 0% |
| src/components/workspace/SignalIcon.jsx | 100% | 100% | 100% |
| src/components/workspace/TaskExplorer.jsx | 0% | 0% | 0% |
| src/components/workspace/TaskPreviewDrawer.jsx | 20% | 7.69% | 0% |
| src/components/workspace/TaskSignals.jsx | 100% | 100% | 100% |
| src/components/workspace/WorkSignals.jsx | 100% | 100% | 100% |
| src/components/workspace/WorkspaceFeedback.jsx | 33.33% | 21.15% | 9.09% |
| src/context/AuthContext.jsx | 19.69% | 15.9% | 33.33% |
| src/context/ProjectContext.jsx | 81.09% | 72.36% | 63.15% |
| src/services/authService.js | 95.89% | 94.44% | 100% |
| src/services/feedbackStore.js | 63.63% | 70.58% | 55.55% |
| src/services/flowHistoryStore.js | 30.76% | 17.85% | 0% |
| src/services/localPersistence.js | 91.66% | 93.75% | 100% |
| src/services/mockData.js | 100% | 100% | 100% |
| src/services/sessionCache.js | 100% | 96.29% | 100% |
| src/services/supabaseClient.js | 94.15% | 92.77% | 95.19% |
| src/utils/accessibility.js | 100% | 100% | 100% |
| src/utils/auditTrail.js | 100% | 98.03% | 100% |
| src/utils/burndown.js | 100% | 100% | 100% |
| src/utils/commands.js | 100% | 100% | 100% |
| src/utils/constants.js | 100% | 100% | 100% |
| src/utils/deliverySignals.js | 100% | 100% | 100% |
| src/utils/estimation.js | 100% | 100% | 100% |
| src/utils/flowAnalytics.js | 100% | 98.14% | 95% |
| src/utils/kanban.js | 100% | 100% | 100% |
| src/utils/kpis.js | 100% | 100% | 100% |
| src/utils/labels.js | 100% | 100% | 100% |
| src/utils/projectMap.js | 100% | 100% | 100% |
| src/utils/projectMetadata.js | 100% | 100% | 100% |
| src/utils/savedWorkViews.js | 100% | 100% | 100% |
| src/utils/sprintLifecycle.js | 100% | 100% | 100% |
| src/utils/sprintReports.js | 100% | 95.89% | 100% |
| src/utils/storyPoints.js | 100% | 100% | 100% |
| src/utils/taskExplorer.js | 90.9% | 92.85% | 87.5% |
| src/utils/taskFilters.js | 100% | 100% | 100% |
| src/utils/taskForm.js | 94.11% | 94.44% | 100% |
| src/utils/taskUpdates.js | 100% | 100% | 100% |
| src/utils/userText.js | 100% | 100% | 100% |
| src/utils/workSignals.js | 100% | 100% | 100% |
| src/utils/workViews.js | 100% | 100% | 100% |
| src/utils/workflow.js | 100% | 100% | 100% |
| src/utils/workspaceFeedback.js | 88.88% | 88.88% | 100% |
