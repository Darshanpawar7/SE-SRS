# Sprint 1 Deviation Report

**SprintFlow · Team 11 · Section 5C · PES University**

- **Documents compared:** SRS v1.0 (5 Sep 2026), SAD v1.0 (15 Sep 2026) and Software Test Plan v1.0 (15 Sep 2026), as submitted.
- **Code compared:** `main` after every Sprint 1 pull request was merged (27 Oct 2026).
- **Required by:** Mini-Project Deliverables Part-2, item 2(i): deviations from the submitted documents are documented and explained at the final demo.

## At a glance

- All 16 Sprint 1 backlog items (52 story points) are merged and their issues are closed. GitHub Actions passed on every Sprint 1 merge, and the 149 automated tests pass.
- The main documentation deviation: the SAD and the Test Plan number the functional requirements differently from the SRS. We follow the SRS numbering everywhere (section 1).
- The main product deviations are in security: real access control (Supabase row-level security policies and a server-checked sign-in) is not in place yet. These items were planned for Sprint 2 when the backlog was created (sections 2 and 3).
- The main process deviations: some pull requests were merged by their authors before review, and Eshwar's four items reached `main` inside another pull request (section 5).

## 1. Requirement numbering (SAD and Test Plan)

The SRS defines PMS-F-001 to PMS-F-018. The SAD (section 3.8) and the Test Plan (sections 3 and 13) list the same features under different numbers: only PMS-F-001, 003, 004 and 005 mean the same thing in all three documents. Three SRS requirements (project metadata, labels, CI/CD) have no entry in the SAD and Test Plan lists, and those lists contain three entries that the SRS does not number separately (settings screen, task priority, in-app documentation viewer). The non-functional lists differ in the same way: the SRS has PMS-NF-001 to 005 plus the SO and PMS-SR security items, while the SAD and Test Plan have NF-001 to 006.

How we handle it: the SRS is the requirements baseline. The backlog, GitHub issues, pull requests, code and tests all use SRS numbers. Test case IDs from the Test Plan are reused where the feature matches (TC-AUTH-01, TC-LOG-01, TC-SUPA-01, TC-OFF-01, TC-SET-01, TC-RECOV-01). The SAD and Test Plan lists will be aligned with the SRS in the Sprint 2 documentation update.

| Feature | SRS ID (baseline) | SAD and Test Plan ID |
|---|---|---|
| Sign-in and profile switching | PMS-F-001 | PMS-F-001 |
| Project metadata | PMS-F-002 | not listed |
| Five Kanban columns | PMS-F-003 | PMS-F-003 |
| Drag and drop | PMS-F-004 | PMS-F-004 |
| One-click stage advance | PMS-F-005 | PMS-F-005 |
| Create and update tasks | PMS-F-006 | PMS-F-002 (task creation), PMS-F-016 (priority) |
| Labels and tags | PMS-F-007 | not listed |
| Fibonacci story points | PMS-F-008 | PMS-F-006 |
| Planned points and completion | PMS-F-009 | PMS-F-008 (capacity) |
| Sprint lifecycle | PMS-F-010 | PMS-F-007 (sprint creation) |
| Burndown chart | PMS-F-011 | PMS-F-009 |
| KPI dashboard | PMS-F-012 | PMS-F-010 |
| Team workload | PMS-F-013 | PMS-F-017 |
| Audit trail | PMS-F-014 | PMS-F-012 |
| Supabase synchronisation | PMS-F-015 | PMS-F-013, plus PMS-F-015 (settings screen) |
| Offline mode | PMS-F-016 | PMS-F-014 |
| Filtering | PMS-F-017 | PMS-F-011 |
| CI/CD pipeline | PMS-F-018 | not listed (a constraint in SAD 3.1) |
| In-app documentation viewer | not in the SRS | PMS-F-018 (present in the app) |

## 2. Deviations from the SRS

### S1. Sign-in and roles

*PMS-F-001; SRS 4.3* · **Sprint 2**

- **SRS:** "Support user authentication and profile switching among 4 team roles." Section 4.3 lists Team Lead, Developer, Scrum Master and Academic Evaluator.
- **Sprint 1:** The app opens on a sign-in screen for the four team accounts. With Supabase configured, Supabase Auth checks the password; in the default local demo mode the password is the member's USN. Switching profile means signing out and in again. Permissions use two levels, Team Lead and Team Member; Scrum Master and Academic Evaluator are not separate accounts.
- **Why:** The SAD requires a zero-configuration demo with no database setup, so local mode needs a sign-in that works without a server.
- **Next:** In local mode the check runs in the browser, so it is not yet a security boundary. Server-side enforcement is backlog items SO-01, SO-03 and PMS-SR-001 (Sprint 2).

### S2. Drag-and-drop speed

*PMS-F-004; PMS-NF-001* · **Sprint 2**

- **SRS:** A dropped card updates its status in under 50 ms.
- **Sprint 1:** Each status update is timed in code (`performance.now`), and unit tests check that the update takes under 50 ms. The browser re-render time has not been measured yet.
- **Next:** Measure in the browser under PMS-NF-001 (Sprint 2).

### S3. Burndown history is kept per browser

*PMS-F-011* · **By design**

- **SRS:** Plot daily remaining points against the ideal line.
- **Sprint 1:** Actual remaining points are recorded once per day for each sprint instead of being interpolated. The history is stored in the browser's local storage, so it is not shared between devices, even when tasks come from Supabase. Days on which nobody opened the app stay blank, so the chart never invents progress.
- **Next:** Proposal for Sprint 2: store the daily snapshots in Supabase.

### S4. Audit trail immutability in the database

*PMS-F-014; SO-02* · **Sprint 2**

- **SRS:** An immutable audit trail capturing all entity changes.
- **Sprint 1:** The app only appends records (CREATE, UPDATE or DELETE, with actor, action, target and timestamp), freezes them and never truncates the history. In the database, the current policy on `activity_logs` still allows updates and deletes.
- **Next:** SO-02 and PMS-SR-001 (Sprint 2) restrict the table to inserts.

### S5. Supabase synchronisation

*PMS-F-015* · **Sprint 2**

- **SRS:** "Upserts records via REST client when credentials are provided."
- **Sprint 1:** Done through supabase-js, which uses Supabase's REST API. Saves upsert the whole list, so the last write wins and two people editing at the same moment can overwrite each other; other members' changes appear after a reload rather than live. Behaviour is verified with an in-memory Supabase stand-in in the tests, not yet against a live Supabase project.
- **Next:** Test against a live project; consider saving one row at a time (Sprint 2).

### S6. Security requirements

*SO-01 to SO-03; PMS-SR-001 to 005* · **Sprint 2**

- **PMS-SR-001:** Row-level security is enabled on every table, but every policy is `USING (true)`, so anyone with the public key can read and write all rows.
- **PMS-SR-002:** Met: no credentials in the source; the Supabase URL and key come from `.env` or Database Settings.
- **PMS-SR-003:** Database Settings accepts only `https://` URLs (TC-SET-01). TLS 1.3 is provided by Supabase and has not been checked against a live project.
- **PMS-SR-004:** React escapes all text and the app never renders raw HTML; formal injection tests have not been run.
- **PMS-SR-005:** `npm audit` runs on every push and pull request, but it does not fail the build (`|| true`).
- **Why:** These items were planned for Sprint 2 when the backlog was created (backlog status not-started or partial).

### S7. ESLint warnings

*PMS-NF-005* · **Sprint 2**

- **SRS:** Zero ESLint warnings.
- **Sprint 1:** Lint passes with 0 errors and 2 warnings (React: calling setState inside an effect).
- **Next:** Fix both warnings under PMS-NF-005 (Sprint 2).

### S8. Traceability statuses

*SRS section 7* · **Explained**

- **SRS:** The traceability matrix marks all 18 functional requirements as PASSED, measured against the Phase 1 prototype.
- **Sprint 1:** When the backlog was built, each requirement was re-checked against its acceptance criteria; 8 of the 16 Sprint 1 items were only partly met. Sprint 1 completed all 16, each with new tests and a verification note (`docs/ISSUE_*_VERIFICATION.md`).

### S9. Feature branches

*SRS section 2* · **Process**

- **SRS:** One feature branch per member (for example `feature/darshan-core-auth-dashboard`).
- **Sprint 1:** One branch per backlog item (`feature/<member>-<issue>-<topic>`), each built on the previous one so that all of them merged without conflicts in a fixed order.

## 3. Deviations from the SAD

### A1. Requirement numbering

*SAD 3.8* · **Doc fix**

- **Summary:** The traceability table uses the numbering shown in section 1, not the SRS numbering.

### A2. Data stores

*SAD 3.6* · **Doc fix**

- **SAD:** Cloud tables include `audit_log` and `profiles`; local keys are `sprintflow_tasks`, `sprintflow_sprints`, `sprintflow_audit` and `sprintflow_config`.
- **Sprint 1:** The app follows `database/schema.sql`: the audit table is `activity_logs`, and the four members are defined in `src/utils/constants.js` rather than read from `profiles`. Local keys: `sprintflow_project`, `sprintflow_sprints`, `sprintflow_tasks`, `sprintflow_activity`, `sprintflow_session`, `sprintflow_pending_sync`, `sprintflow_burndown_history`, `sprintflow_selected_sprint`, `supabase_url` and `supabase_key`.

### A3. Components

*SAD 3.3 and 3.4* · **Doc fix**

- **Sprint 1:** New modules sit inside the existing layers. Presentation: SignInView, ProjectSettingsModal, KpiCards, WorkloadList, AuditTrail, BurndownChart, LabelPills. Services: authService. Utilities: labels, kpis, auditTrail, projectMetadata, burndown, storyPoints, sprintLifecycle, taskForm, taskUpdates, workflow, kanban. The layered architecture itself is unchanged.
- **Next:** Update the component diagram and table.

### A4. Security architecture

*SAD 3.9* · **Sprint 2**

- **SAD:** Supabase Auth with JWT sessions; RLS policies restrict data to project members and enforce roles on the server.
- **Sprint 1:** Supabase Auth is used only when Supabase is configured. Local demo mode uses USN passwords and a session stored in the browser. RLS policies are open, and role checks happen in the app (see S1 and S6).

### A5. Sequence diagram: sign-in and task creation

*SAD 4.2.1* · **Doc fix**

- **SAD:** A login form; a new task appears in the Backlog column.
- **Sprint 1:** Sign-in means choosing a team profile and entering the password. A new task starts in To Do unless another status is chosen (the `schema.sql` default is `todo`), and it joins the active sprint.

### A6. Sequence diagram: sprint creation

*SAD 4.2.2 and 4.3.2* · **Doc fix**

- **SAD:** Tasks are selected while the sprint is created; sprint status values are planning, active and completed.
- **Sprint 1:** A sprint is created with a name, an optional goal and its dates; tasks join a sprint from the task form, which defaults to the active sprint. Status values are planned, active and completed, as in the SRS and `schema.sql`.

### A7. API usage

*SAD 4.3* · **Doc fix · Sprint 2**

- **Sprint 1:** The app calls Supabase through supabase-js rather than raw REST requests. Saves send the task list as one upsert instead of a PATCH per task; deletes use DELETE by id. The assignee is stored as `assignee_id` and `assignee_name` (`schema.sql`), not a single `assignee` field. The length limits listed for titles, descriptions and sprint fields are not enforced in the forms yet, and the 401 and 403 responses cannot occur while RLS is open.

### A8. Error handling

*SAD 4.4* · **Sprint 2**

- **SAD:** Network failures trigger a fallback to local storage with a visible notice; a React Error Boundary catches unrecoverable errors.
- **Sprint 1:** Network failures keep every change locally and queue it; the navbar and Database Settings show the sync error, and Database Settings offers "Retry sync now". There is no Error Boundary yet.
- **Next:** Add an Error Boundary (Sprint 2).

### A9. Risk mitigations

*SAD 3.7* · **By design · Sprint 2**

- **RISK-02:** No pruning of the audit log at 1,000 entries, on purpose: pruning would break the immutable audit trail (PMS-F-014). The 5 MB storage limit remains a risk.
- **RISK-03:** Tested in Chrome only so far; Firefox and Edge follow in Sprint 2.
- **RISK-04:** Last write wins, but without timestamp ordering. Unsent changes carry a version number, so an older save cannot clear a newer failed one.
- **RISK-06:** Dependabot is not enabled, and `npm audit` does not block CI (see S6).

## 4. Deviations from the Test Plan

### T1. Requirement numbering

*STP 3 and 13* · **Doc fix**

- **Summary:** See section 1. Test case IDs are reused where the feature matches.

### T2. Schedule

*STP 7* · **Explained**

- **STP:** All testing marked complete between 9 and 15 Sep, against the Phase 1 prototype.
- **Sprint 1:** Testing ran alongside development (19 to 27 Oct): the full suite runs in CI on every push and pull request, and every item has a verification note.

### T3. Test levels and tools

*STP 5.1 and 8* · **Explained**

- **Unit and integration:** Vitest: 149 tests in 16 files (the STP listed 2 files). Integration tests render the real React providers and use an in-memory Supabase stand-in.
- **System:** Besides manual checks, a scripted browser walkthrough (Playwright on Chrome, 19 checks) was run locally on the final build before the demo. It is not yet in the repository or CI.
- **Acceptance:** This evaluation.

### T4. Cloud tests

*TC-SUPA-01; TC-SEC-01* · **Sprint 2**

- **Sprint 1:** Not yet run against a live Supabase project; synchronisation is verified with the stand-in, and the error path with an unreachable Supabase address in the browser.
- **Next:** Run both against a provisioned project (Sprint 2).

### T5. Security validation

*STP 5.4* · **Sprint 2**

- **Sprint 1:** Not executed yet. The RLS test (expects 403 Forbidden) would fail today because the policies are open.

### T6. Cross-browser testing

*TC-COMPAT-01* · **Sprint 2**

- **Sprint 1:** Chrome only so far.

### T7. Performance and load

*TC-PERF-01; TC-LOAD-01* · **Sprint 2**

- **Sprint 1:** The 50 ms limit is checked for the status update in unit tests; browser latency and the 100-task load test are not done yet.

### T8. Test metrics

*STP 14.1* · **Sprint 2**

- **Sprint 1:** Code coverage (target 80%) is not measured, because no coverage tool is configured. CI pass rate: every Sprint 1 merge passed.

### T9. Test data

*STP 6.3* · **Doc fix**

- **STP:** 12 sample tasks; two sprints, one active and one completed.
- **Sprint 1:** The seed has 7 tasks covering all five columns and two sprints: Sprint 1 active (19 to 23 Oct) and Sprint 2 planned (26 to 30 Oct), matching the real sprint weeks.

### T10. Test Summary Report

*STP 8 and 14.3* · **Sprint 2**

- **Sprint 1:** Due at the end of the testing cycle, after Sprint 2.

## 5. Sprint 1 process (course item 2)

### P1. One repository

*Item 1(a)* · **Process**

- **What happened:** Phase 2 (the SAD, the Test Plan and the first Sprint 1 branches) was in a second repository, SE-SRS-2. On 26 Oct it was merged into SE-SRS with its full history, the backlog issues were moved across (now #7 to #37), and SE-SRS-2 was archived as read-only. The SAD and Test Plan links to SE-SRS-2 now lead to that archive.

### P2. Branches, merge order and CI

*Items 2(a) and 2(b)* · **Process**

- **What happened:** The stacked branches (S9) were merged in a fixed order with merge commits. GitHub Actions ran build, tests, lint and a dependency audit on every push and pull request, and every Sprint 1 merge passed.

### P3. Who raised the pull requests

*Item 2(c)* · **Process**

- **What happened:** Every Sprint 1 pull request was raised by its assigned member, except Eshwar's four items (#12 to #15). They reached `main` inside #48, Dhatri's labels pull request, because her branch was built on top of his, and GitHub cannot open a pull request for work that is already merged.
- **Evidence:** His four commits ("Fix #12" to "Fix #15") are on `main` under his name and closed his issues. His original pull requests are SE-SRS-2 #41 to #44. He also raised and merged #52, a follow-up fix to his burndown chart.

### P4. Reviews and merges

*Item 2(d)* · **Process**

- **Course:** The repository owner reviews and merges.
- **What happened:** The members were made collaborators and merged their own pull requests. #43 to #49 were merged before review, so the owner reviewed them afterwards with a comment on each. The owner reviewed #50 and #51 before Chandan merged them, Dhatri approved #40 and #41 before the owner merged them, and the owner approved #52 before Eshwar merged it. #38 and #39 were merged together with #49, and Eshwar reviewed them afterwards; he also reviewed #42 (the demo video) after the owner merged it.

### P5. AI assistance and integration

*Item 2(e)* · **Process**

- **What happened:** AI tools were used for parts of the implementation and for integrating the parallel branches, as item 2(e) allows. Several items were committed from the team lead's account during that integration; each pull request was still raised by its assigned member, except as described in P3.

### P6. Demo video

*Items 2(g) and 2(h)* · **Process**

- **What happened:** `docs/demo/SprintFlow_Sprint1_Demo.webm` (57 seconds), recorded from the merged build in local demo mode.

## 6. Planned for Sprint 2

- **Security:** SO-01 to SO-03 and PMS-SR-001 to 005: real RLS policies, a server-checked sign-in, an insert-only audit table, a blocking dependency audit and XSS tests.
- **Testing:** Live Supabase tests, Firefox and Edge runs, browser latency and the 100-task load test, a coverage report, the browser walkthrough in CI, and the Test Summary Report.
- **Code:** Fix the two ESLint warnings, add an Error Boundary, enable Dependabot.
- **Documents:** Align the SAD and Test Plan numbering with the SRS; update the SAD component diagram, data stores and sequence diagrams.
- **Proposals (not yet in the backlog):** Store burndown history in Supabase; save one row at a time so concurrent edits cannot overwrite each other.
