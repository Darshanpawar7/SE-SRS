# Test Execution Report, Metrics and CI/CD Pipeline

## SprintFlow -- Project Management System

**Owner:** Gurubelli Yekambar Eshwar Rao (PES2UG24CS173) -- Full-Stack and QA/DevOps Lead
**Branch:** `feature/eshwar-test-execution-metrics`
**Related Document:** `docs/STP_Document_Team11.md`, Sections 10-15

---

## 1. Purpose

This document reports what the test effort actually found and how the continuous
integration pipeline enforces quality on every push. It complements the Software Test
Plan, which defines intent, and the Test Case Specification, which defines procedure.

---

## 2. Automated Test Execution Summary

Command: `npm test` (Vitest 2.1)

| Test Suite | Cases | Result | Duration |
| :--- | :--- | :--- | :--- |
| `src/tests/estimation.test.js` | 6 | Passed | ~7 ms |
| `src/tests/workflow.test.js` | 3 | Passed | ~7 ms |
| **Total** | **9** | **9 passed, 0 failed** | **under 1 s** |

| Verification Gate | Command | Result |
| :--- | :--- | :--- |
| Unit and workflow tests | `npm test` | 9 of 9 passed |
| Static analysis | `npm run lint` | 0 errors, 2 advisory warnings |
| Production build | `npm run build` | Succeeded, 88 modules, ~1.2 s |

---

## 3. Defects Found and Resolved

Testing was worth doing: it found two genuine defects in the burndown feature, both of
which would have been visible during evaluation.

### DEF-01 -- Burndown chart drawn from hard-coded coordinates

| Field | Detail |
| :--- | :--- |
| Severity | High |
| Found by | Static analysis, confirmed against TC-BURN-01 |
| Affected | `src/components/dashboard/DashboardView.jsx` |

**Symptom.** `generateBurndownData()` was called and its result assigned to a variable
that was never read. The SVG polyline and its data points used literal coordinates
(`points="40,25 110,38 180,60 250,90 280,105"`), so the chart rendered the same shape
regardless of sprint state. Moving a task to Done did not move the line.

**Why it mattered.** This directly contradicted TC-BURN-01, SAD Figure 4.2, which shows
the chart being rendered from computed metrics, and ADR-006, which states that the chart
reflects state changes immediately.

**Resolution.** The polyline, the ideal guideline and the data points are now derived
from the computed series through explicit `chartX` and `chartY` scaling functions. The
chart geometry is the only thing hard-coded; every plotted value comes from sprint data.

### DEF-02 -- Completed work did not lower the actual burndown line

| Field | Detail |
| :--- | :--- |
| Severity | High |
| Found by | New regression test added while verifying DEF-01 |
| Affected | `src/utils/estimation.js`, `generateBurndownData()` |

**Symptom.** The actual remaining value was computed as
`Math.max(totalPoints - completedPoints, simulatedCurve)`. Because the simulated curve
acted as a floor, the line could never fall below it. With a 21-point sprint, completing
*all* 21 points still reported 14.7 points remaining at day 4.

**Why it mattered.** The burndown is the primary visibility artefact in the project
brief. A chart that cannot show completion is worse than no chart, because it looks
authoritative while being wrong.

**Resolution.** The function was rewritten to interpolate the actual series between the
two values that are genuinely known -- the full backlog at day 0, and the remaining work
today -- and to return `null` for days beyond today rather than inventing data. Two
regression tests now assert that completing more work lowers the line, and that the ideal
trajectory stays independent of actual progress.

**Known limitation, stated deliberately.** The system stores a current snapshot, not
per-day history, so intermediate days are interpolated rather than measured. The function
accepts an optional `elapsedDays` argument for callers that know the real sprint day.
Recording a daily points-remaining history is the correct long-term fix and is logged as
an open issue.

### DEF-03 -- Quality gate that verified nothing

| Field | Detail |
| :--- | :--- |
| Severity | Medium |
| Found by | Pipeline review |
| Affected | `package.json`, `.github/workflows/ci.yml` |

**Symptom.** The `lint` script was
`node -e "console.log('Linting passed: 0 syntax or style errors.')"`. The CI job named
"Code Quality & Lint Check" therefore always reported success without inspecting a single
file.

**Resolution.** ESLint 9 was added with the React and React Hooks plugins, configured in
`eslint.config.js`, and the script now runs `eslint src eslint.config.js`. The first real
run reported 8 errors, all of which were fixed: unused imports and variables, and an empty
`catch` block in `AuthContext` that silently discarded a JSON parse failure. That block
now logs the failure and clears the corrupt entry.

---

## 4. Test Metrics

| Metric | Definition | Current Value |
| :--- | :--- | :--- |
| Test case pass rate | Passed / executed | 100 percent (9 of 9 automated) |
| Requirement coverage | Requirements with at least one test case | 24 of 24 (18 functional, 6 non-functional) |
| Automated coverage | Requirements covered without manual steps | 5 of 24 |
| Defect density | Defects per requirement under test | 3 defects across 24 requirements |
| Defect detection source | Where defects were found | 2 static analysis, 1 regression test |
| Open defects | Unresolved at submission | 0 |
| Build success rate | Successful pipeline runs | 100 percent on `main` |

The gap between total and automated coverage is deliberate and stated rather than hidden:
drag-and-drop gestures, cross-browser rendering and live Supabase connectivity are
verified manually, as recorded in the Test Case Specification.

---

## 5. CI/CD Pipeline

Defined in `.github/workflows/ci.yml`, triggered on every push and pull request across
all branches.

| Stage | Job Name | Command | Purpose | Blocks Merge |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Build & Dependency Check | `npm ci`, `npm run build` | Confirms the project compiles from a clean dependency tree | Yes |
| 2 | Automated Unit & Workflow Tests | `npm test` | Runs the Vitest suite | Yes |
| 3 | Code Quality & Lint Check | `npm run lint` | Runs ESLint over all source | Yes |
| 4 | Security Vulnerability Audit | `npm audit --audit-level=high` | Reports vulnerable dependencies | No, advisory |

The jobs run in sequence, each depending on the one before, so a failure stops the
pipeline at the first meaningful signal rather than producing four separate failures from
one root cause.

The security audit is advisory (`|| true`) because advisories against transitive
development dependencies must not block an academic submission. This is a conscious
trade-off; in a production pipeline this stage would block.

---

## 6. Risk-Based Test Prioritisation

| Risk | Likelihood | Impact | Test Response |
| :--- | :--- | :--- | :--- |
| Network unavailable during evaluation | Medium | High | TC-OFF-01 and TC-AVAIL-01 verify offline mode as a first-class path |
| Burndown misreports sprint progress | Confirmed (DEF-01, DEF-02) | High | Two regression tests now guard the calculation |
| Drag-and-drop fails on a specific browser | Low | High | TC-COMPAT-01 across Chrome, Firefox and Edge |
| Data loss on refresh | Low | Critical | TC-OFF-01 and TC-SUPA-01 both assert persistence across reload |
| Invalid estimate entered | Low | Medium | The interface offers only Fibonacci values, so the state is unrepresentable |

---

## 7. Suspension and Resumption

Testing is suspended if the build fails, or if a defect blocks more than 30 percent of
remaining cases. It resumes once the blocking defect is fixed and the full suite has been
re-run from the start, since a partial re-run cannot show that a fix introduced no
regression elsewhere.

---

## 8. Open Issues

| ID | Issue | Impact | Proposed Resolution |
| :--- | :--- | :--- | :--- |
| OPEN-01 | Burndown interpolates intermediate days rather than measuring them | Chart shape between day 0 and today is approximate | Persist a daily points-remaining snapshot per sprint |
| OPEN-02 | Drag-and-drop has no automated coverage | Regressions in the core interaction rely on manual testing | Add Playwright end-to-end tests |
| OPEN-03 | Row Level Security policies are not exercised by automated tests | Policy errors would surface only in cloud mode | Add integration tests against a Supabase test project |
| OPEN-04 | Two advisory `react-hooks` warnings remain | None functionally; both patterns are intentional | Re-evaluate if the components are refactored |

---

## 9. Exit Criteria Assessment

| Criterion | Target | Actual | Met |
| :--- | :--- | :--- | :--- |
| All planned test cases executed | 100 percent | 100 percent | Yes |
| Automated suite passing | 100 percent | 9 of 9 | Yes |
| Critical or high defects open | 0 | 0 | Yes |
| Production build reproducible | Yes | Yes | Yes |
| Every requirement traced to a test case | 100 percent | 24 of 24 | Yes |
| CI pipeline green on `main` | Yes | Yes | Yes |

The test effort meets its exit criteria, with the four open issues above recorded as
known limitations rather than silent omissions.
