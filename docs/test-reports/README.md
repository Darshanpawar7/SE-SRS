# Test Reports -- Testing Phase (2--6 November 2026)

## SprintFlow -- Project Management System

**Team 11 | Section 5C | PES University**

These are the test reports for deliverable Part 3, item 2 ("Testing"). Testing was carried
out according to the Software Test Plan (`docs/STP_Document_Team11.md`) and the Test Case
Specification (`docs/TEST_CASE_SPECIFICATION.md`) against `main` at commit `f9e0727`, on
6 November 2026.

---

## Reports

| # | Report | Owner (STP §9 role) | Issue | Result |
| ---: | :--- | :--- | :---: | :--- |
| i | [Unit Test Report](UNIT_TEST_REPORT.md) | Gurubelli Yekambar Eshwar Rao -- QA Lead | #91 | **234 of 234** tests pass in 35 files |
| ii | [System Validation Report](SYSTEM_VALIDATION_REPORT.md) | Dhatri Shivaprasad -- Test Engineer (Frontend) | #92 | 33 cases: **28 pass, 1 fail** (low severity), **4 blocked** (need a Supabase test project); Chrome, Edge and Firefox |
| iii | [Code Coverage Report](CODE_COVERAGE_REPORT.md) | Chandan Kumar K -- Test Engineer (Backend) | #93 | Utility modules **99.3%** of lines (STP target: 80%); whole app 70.5% of lines |
| iv | [Branch Coverage Report](BRANCH_COVERAGE_REPORT.md) | Darshan P Pawar -- Test Architect | #94 | Utility modules **92.9%**, logic layer 87.9%, whole app 64.1% of branch outcomes |

## Open follow-ups

| Issue | Owner | What |
| :---: | :--- | :--- |
| #95 | Dhatri Shivaprasad | DEF-04: the Kanban board shows no message when filters match nothing (TC-FILT-01, low severity) |
| #96 | Chandan Kumar K | Run the four cloud-dependent cases (TC-SUPA-01, TC-SET-01 steps 1--2, TC-SEC-01, SEC-RLS) on a Supabase test project, and record the results in the System Validation Report, Section 6.1 |

## Contents of this folder

| Path | What it is |
| :--- | :--- |
| `UNIT_TEST_REPORT.md` and the three other reports | The four reports |
| `evidence/unit-test-results.junit.xml`, `evidence/unit-test-results.json` | Raw unit test results (JUnit XML and Vitest JSON) |
| `evidence/system-validation-results.json` | Raw system validation results: every check's expected and actual result |
| `evidence/coverage-summary.json` | Coverage totals per file |
| `evidence/TC-COMPAT-01-*-board.png` | The board in Chrome, Edge and Firefox (TC-COMPAT-01) |
| `evidence/TC-FILT-01-chrome-failure.png` | Screenshot of DEF-04 |
| `coverage-html/index.html` | Line-by-line HTML coverage report. Open it in a browser. |

## Re-running everything

```bash
npm ci
npm test                       # unit and integration tests
npm run test:coverage          # code and branch coverage (coverage/index.html)

npx playwright install firefox # once
npm run build                  # build WITHOUT Supabase credentials (no .env)
npm run preview                # terminal 1
npm run test:system            # terminal 2: system validation (test-results/system/)
```
