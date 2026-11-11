# System Validation Report

SprintFlow · Team 11 · Sprint 1/2 testing phase

Generated from an actual run on **2026-11-10T18:40:04.869Z**. Source commit: `db1e9c6c66da1c64a22091bacea36efae1c215ed`. Node: v24.22.2, linux. Application/test input SHA-256: `4d717c194d04502c687212d626138a17c70a4ad6d1572b8bf076c43177fb0bdb`.

Numeric evidence and provenance are in [evidence](evidence/). Full raw JSON/JUnit evidence is retained in the four-test-reports Actions artifact. Original November 6 reports and submitted PDFs are historical snapshots; this report describes the revision above. Report-only commits can differ from this source revision.

Build served by Vite preview; actual Chrome, Edge and Firefox controlled by Playwright. Zero-configuration cases use clean contexts. Four initially blocked cases are supplemented only when the matching **real isolated Supabase Auth/PostgreSQL** case passes. No mocked response counts as database/RLS evidence.

Source revisions agree: **yes**. Browser suite: 29 passed, 0 failed, 4 blocked. Isolated database suite: 7 passed, 0 failed. Combined specified case results: 33/33 passed, 0 unresolved.

Verdict: **PASS for automated acceptance on this isolated test environment**. This is not hosted-production sign-off. STP exit also requires owner review, SRS/SAD approval and demo deliverables; those cannot be approved by a test script.

| Case | SRS / plan | Result | Environment / evidence |
| --- | --- | --- | --- |
| TC-SUPA-01 | PMS-F-015 / PMS-F-013 | pass | Real isolated Supabase: Task created through React UI, independently read from PostgreSQL, then loaded again after clearing application caches. |
| SEC-RLS | PMS-SR-001 / STP 5.4 | pass | Real isolated Supabase: Two real Auth accounts; foreign reads return zero rows, insert denied, update/delete affect zero rows; private row unchanged; anonymous read denied. |
| TC-AUTH-01 | PMS-F-001 / PMS-F-001 | pass | chrome: Authenticate and establish session |
| TC-PROJ-01 | PMS-F-002 / — | pass | chrome: Show project metadata (supplementary) |
| TC-TASK-01 | PMS-F-006 / PMS-F-002 | pass | chrome: Create a task with complete metadata |
| TC-TASK-02 | PMS-F-006 / PMS-F-016 | pass | chrome: Assign Critical priority |
| TC-TASK-03 | PMS-F-006 / PMS-F-002 | pass | chrome: Reject a task with an empty title |
| TC-LABEL-01 | PMS-F-007 / — | pass | chrome: Add labels to a task (supplementary) |
| TC-KAN-01 | PMS-F-003 / PMS-F-003 | pass | chrome: Render the five-column board |
| TC-KAN-02 | PMS-F-004 / PMS-F-004 | pass | chrome: Transition a task by drag-and-drop |
| TC-KAN-03 | PMS-F-005 / PMS-F-005 | pass | chrome: Advance a task by single action |
| TC-KAN-04 | PMS-F-004 / PMS-F-004 | pass | chrome: Cancel a drag outside any column |
| TC-FILT-01 | PMS-F-017 / PMS-F-011 | pass | chrome: Filter by priority |
| TC-EST-01 | PMS-F-008 / PMS-F-006 | pass | chrome: Assign Fibonacci story points |
| TC-EST-02 | PMS-F-009 / PMS-F-008 | pass | chrome: Calculate sprint capacity |
| TC-SPR-01 | PMS-F-010 / PMS-F-007 | pass | chrome: Create a sprint |
| TC-BURN-01 | PMS-F-011 / PMS-F-009 | pass | chrome: Update the burndown chart |
| TC-DASH-01 | PMS-F-012 / PMS-F-010 | pass | chrome: Display KPI metrics |
| TC-WORK-01 | PMS-F-013 / PMS-F-017 | pass | chrome: Show workload distribution |
| TC-DOCS-01 | not in SRS / PMS-F-018 | pass | chrome: Render in-app documentation |
| TC-OFF-01 | PMS-F-016 / PMS-F-014 | pass | chrome: Persist offline without configuration |
| TC-SET-01 | PMS-F-015 / PMS-F-015 | pass | Real isolated Supabase: Saved valid HTTPS configuration, indicator updated, real Auth sign-in passed, malformed replacement rejected and working cloud configuration retained. |
| TC-LOG-01 | PMS-F-014 / PMS-F-012 | pass | chrome: Record an audit trail for mutations |
| TC-PERF-01 | PMS-NF-001 / PMS-NF-001 | pass | chrome: Drag-and-drop transition under 50 ms |
| TC-AVAIL-01 | PMS-NF-002 / PMS-NF-002 | pass | chrome: Stay usable with the network disabled |
| TC-SEC-01 | PMS-SR-003 / PMS-NF-004 | pass | Real isolated Supabase: TLSv1.3; real Auth and REST over HTTPS; no password, API key or access_token in recorded URLs. Self-signed test certificate; hosted deployment trust remains a separate check. |
| TC-LOAD-01 | not in SRS / PMS-NF-005 | pass | chrome: Board with 100+ tasks |
| TC-RECOV-01 | PMS-NF-004 / PMS-NF-006 | pass | chrome: No data loss across disconnect and reconnect |
| SEC-XSS | PMS-SR-004 / STP 5.4 | pass | chrome: XSS input sanitization |
| SEC-TOKEN | not in SRS / STP 5.4 | pass | chrome: Session token handling |
| SEC-FUZZ | PMS-SR-004 / STP 5.4 | pass | chrome: Input validation fuzzing |
| SEC-KEYS | PMS-SR-002 / STP 5.4 | pass | static: API key exposure in the client bundle |
| TC-COMPAT-01 | not in SRS / PMS-NF-003 | pass | chrome+edge+firefox: Core workflows on Chrome, Edge and Firefox |

Additional security and compatibility evidence:

| Check | Result | Detail |
| --- | --- | --- |
| PMS-NF-003: Sign in | pass | Lighthouse accessibility 100/100 (SRS target >90); remaining automatic findings: none. Automatic checks only; not a full manual accessibility review. |
| PMS-NF-003: Board | pass | Lighthouse accessibility 100/100 (SRS target >90); remaining automatic findings: none. Automatic checks only; not a full manual accessibility review. |
| SEC-EXPIRED | pass | A real session token was re-signed with the disposable stack secret and an expired timestamp; Auth and REST both returned authentication-denial expiry errors. Malformed token also returned 401. |
| SEC-AUDIT | pass | All assertions passed |
| CLOUD-RECOVERY | pass | Browser was genuinely offline; task remained visible locally, database had no row until reconnect, then exactly one persisted row survived reload. |
| TC-SESS-01: Signed in to the (fake) cloud project | pass | Real Chrome with simulated network/Auth responses: Darshan Team Lead |
| TC-SESS-01: Network blip while editing: user and draft kept | pass | Real Chrome with simulated network/Auth responses: still signed in, dialog open with the typed title |
| TC-SESS-01: Connection back: session re-checked, still signed in | pass | Real Chrome with simulated network/Auth responses: 3 successful checks so far |
| TC-SESS-01: Session rejected by Supabase (401): signed out with a message | pass | Real Chrome with simulated network/Auth responses: Your cloud session has ended. Sign in again. Saved data is retained. |
| TC-KAN-01 (chrome) | pass | Five-column board (compatibility run) |
| TC-KAN-02 (chrome) | pass | Drag-and-drop transition (compatibility run) |
| TC-TASK-01 (chrome) | pass | Create a task (compatibility run) |
| TC-KAN-01 (edge) | pass | Five-column board (compatibility run) |
| TC-KAN-02 (edge) | pass | Drag-and-drop transition (compatibility run) |
| TC-TASK-01 (edge) | pass | Create a task (compatibility run) |
| TC-KAN-01 (firefox) | pass | Five-column board (compatibility run) |
| TC-KAN-02 (firefox) | pass | Drag-and-drop transition (compatibility run) |
| TC-TASK-01 (firefox) | pass | Create a task (compatibility run) |

Transport scope: the browser-facing disposable endpoint negotiates TLS 1.3; the test alone accepts its self-signed loopback certificate and proxies to the local stack over HTTP. Hosted certificate trust, hosted configuration and deployment-specific policies must be checked after deployment. No service key is sent to the browser.
