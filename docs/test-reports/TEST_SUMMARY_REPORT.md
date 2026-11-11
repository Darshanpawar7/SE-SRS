# Test Summary Report — Sprint 1/2

Team 11 · Executed 10 November 2026 · **Approved by the Test Architect, Darshan P Pawar, in PR #107 on 11 November 2026**

## Tested revision and scope

Source revision: `db1e9c6c66da1c64a22091bacea36efae1c215ed`. Application/test input SHA-256: `4d717c194d04502c687212d626138a17c70a4ad6d1572b8bf076c43177fb0bdb`. Node v24.22.2, Linux; production Vite build. [Complete measured run](https://github.com/Darshanpawar7/SE-SRS/actions/runs/42877420163). Report-only commits can differ from this source revision without changing the tested application/test input hash.

This covers the existing Sprint 1/2 baseline and the accessibility fixes in [PR #107](https://github.com/Darshanpawar7/SE-SRS/pull/107). Unmerged feature/fix PRs #103–#106 are separate reviews and are not certified by this snapshot. The November 6 submitted reports/PDFs remain historical records.

## Results

| Check | Measured result |
| --- | --- |
| Unit/integration suite | 259 passed, 0 failed, 0 pending in 38 files |
| Instrumented repeat | 258 passed in 37 files; only the timing-only benchmark excluded; application code remains included |
| Report-generation regressions | 11 passed; reject missing/stale evidence, empty coverage, missing browser cases and accessibility regressions |
| Specified acceptance cases | 33/33 pass after supplementing four blocked local-mode cases with matching real database cases |
| Native compatibility | Nine core workflow executions across Chrome, Edge and Firefox pass |
| Real disposable database/security tests | 7/7 pass |
| Simulated session-failure checks | Four checks pass in real Chrome; these intercepted responses are not counted as real database/RLS evidence |
| Utility line / branch coverage | 99.25% / 92.89%; STP utility line target ≥80% met |
| Whole-app line / branch coverage | 69.44% / 64.12%; low UI/context unit coverage remains visible in the reports |
| Standard board drag-to-render p95 | 2.8 ms; unchanged budget <50 ms |
| Loaded board | 106 cards, 100 accessible seeded controls, 5.2 ms drag-to-render p95; unchanged budget <50 ms |
| Lighthouse accessibility | Sign-in 100/100; board 100/100; SRS target >90 |
| Build / lint / dependency audit | Pass; zero npm vulnerabilities reported |

The browser-only suite records 29 pass / 0 fail / 4 blocked because it deliberately has no cloud credentials. The isolated stack separately executes TC-SUPA-01, TC-SET-01, TC-SEC-01 and SEC-RLS. The system report combines only matching case IDs and records 33/33, rather than relabeling unexecuted local-mode checks.

Browser versions: Chrome 157.0.8103.50, Edge 157.0.4341.46, Firefox 142.0.1. Lighthouse 13.6.0, desktop 1440×900.

## Functional requirement traceability

SRS numbering is the baseline; the original Test Plan uses different IDs for some features. The detailed system report preserves both numberings.

| SRS requirement | Evidence |
| --- | --- |
| PMS-F-001 authentication/profile | TC-AUTH-01; auth/session unit tests; real Auth sign-in and expired/malformed token rejection |
| PMS-F-002 project metadata | TC-PROJ-01; project metadata unit tests |
| PMS-F-003 five-column board | TC-KAN-01 |
| PMS-F-004 drag/drop | TC-KAN-02, TC-KAN-04, TC-PERF-01 |
| PMS-F-005 single-action advance | TC-KAN-03 |
| PMS-F-006 task creation/update | TC-TASK-01/02/03; task update/unit tests |
| PMS-F-007 labels/tags | TC-LABEL-01 |
| PMS-F-008 Fibonacci estimates | TC-EST-01; estimation/story-point unit tests |
| PMS-F-009 planned points/completion | TC-EST-02; estimation unit tests |
| PMS-F-010 sprint lifecycle | TC-SPR-01; sprint lifecycle unit tests |
| PMS-F-011 burndown | TC-BURN-01; burndown unit tests |
| PMS-F-012 dashboard | TC-DASH-01; dashboard/metric unit tests |
| PMS-F-013 workload | TC-WORK-01; workload unit tests |
| PMS-F-014 audit history | TC-LOG-01; SEC-AUDIT; audit unit tests |
| PMS-F-015 database sync/settings | Real TC-SUPA-01, TC-SET-01, CLOUD-RECOVERY |
| PMS-F-016 offline mode | TC-OFF-01, TC-AVAIL-01, TC-RECOV-01 |
| PMS-F-017 filtering | TC-FILT-01; combined-filter unit tests |
| PMS-F-018 push/PR CI | Passing build, test, lint and audit workflow runs on both events for this branch |

## Non-functional/security evidence and limits

- PMS-NF-001: both measured browser interaction budgets pass, including the 106-card board.
- PMS-NF-002: offline operation and recovery pass within the test window. This does not prove continuous lifetime uptime.
- PMS-NF-003: actual Lighthouse accessibility is 100 on the two audited screens. This is the SRS usability requirement; browser compatibility is a separate Test Plan check. Automated Lighthouse checks are not a full manual accessibility review or a claim about every screen/theme.
- PMS-NF-004: refresh, tab reopening, cloud persistence after cache removal and genuine offline-to-cloud replay pass.
- PMS-NF-005: build/lint pass on the tested revision. No claim is made about every historical build.
- PMS-SR-001: existing policy/grant checks cover the schema statically; real two-account tests deny cross-project project/task access, anonymous reads, audit spoofing and audit modification/deletion.
- PMS-SR-002: SEC-KEYS scans the production bundle; client configuration rejects service-role/secret keys. Disposable service/signing keys remain in the Node test process, never browser configuration or published reports.
- PMS-SR-003: real browser Auth/REST requests use a TLS 1.3 loopback proxy with no credentials in URLs. The test context accepts its one-day self-signed certificate; upstream HTTP stays on the disposable runner. Hosted certificate trust/configuration is not certified.
- PMS-SR-004: SEC-XSS, SEC-FUZZ and text-validation tests pass.
- PMS-SR-005: the npm audit CI check passes with zero reported vulnerabilities.

## Defects and disposition

[Issue #108](https://github.com/Darshanpawar7/SE-SRS/issues/108), 2 SP, bug/NFR/sprint-2, assigned to Eshwar: Lighthouse found the missing sign-in main landmark, a heading-level skip and task-card visible/accessibility name mismatch. PR #107 fixes all three, preserves keyboard activation, and adds regression gates. Both Lighthouse audits now have no failed automatic audits. The issue closes when the PR is reviewed and merged; it is not preemptively closed.

## Required reports and raw evidence

- [Unit Test Report](latest/UNIT_TEST_REPORT.md)
- [System Validation Report](latest/SYSTEM_VALIDATION_REPORT.md)
- [Code Coverage Report](latest/CODE_COVERAGE_REPORT.md)
- [Branch Coverage Report](latest/BRANCH_COVERAGE_REPORT.md)

Committed numeric evidence/provenance is in `latest/evidence/`. Full JSON/JUnit results, complete coverage HTML, screenshots and Lighthouse JSON/HTML are in the artifacts of the linked run. The committed manifest is intentionally limited to public provenance; the artifact manifest contains exact test commands. GitHub artifacts have a retention period; download them with the submission.

## Owner completion/sign-off

- [ ] Darshan reviews/merges PR #107 and resolves the separate pending PR reviews #103–#106.
- [ ] Run the same workflow on final merged main; attach that revision's reports if the application/test input hash changes.
- [ ] Review the SRS/SAD/STP, traceability and documented deviations against the final product; approve the Test Summary Report.
- [ ] Check the existing recordings in `docs/demo/` for the required Sprint 1/Sprint 2 content and lengths; update only if they no longer match the final merged product.
- [ ] If a hosted database/deployment is used, verify that environment's configuration, trust and access controls separately.

Reviewer: ____________________  Decision: ____________________  Date: ____________________
