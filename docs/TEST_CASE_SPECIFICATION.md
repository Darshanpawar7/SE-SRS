# Test Case Specification

## SprintFlow -- Project Management System

**Owner:** Chandan Kumar K (PES2UG24CS128) -- Backend and Database Architect
**Branch:** `feature/chandan-test-plan-core`
**Related Document:** `docs/STP_Document_Team11.md`, Sections 1-9 and 13

---

## 1. Purpose

The Software Test Plan states *what* will be tested and *why*. This document states
*how*: each test case is expanded into preconditions, test data, ordered steps, and an
observable expected result, so that any team member can execute the suite and reach the
same verdict.

Test case identifiers match the Requirements Traceability Matrix in STP Section 13
exactly, so a reader can move between the two documents without translation.

---

## 2. Test Case Format

| Field | Meaning |
| :--- | :--- |
| Test Case ID | Identifier used in the RTM |
| Requirement | The requirement under test |
| Precondition | State the system must be in before step 1 |
| Test Data | Concrete values used, so the case is repeatable |
| Steps | Ordered actions performed by the tester |
| Expected Result | Observable outcome that decides pass or fail |
| Type | Manual or Automated |

A case passes only if every expected result holds. A partial match is recorded as a
failure with the deviation noted.

---

## 3. Authentication and Profile

### TC-AUTH-01 -- Authenticate and establish session

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-001 |
| Precondition | Application loaded at the sign-in view; no active session |
| Test Data | Role profile: Team Lead |
| Type | Manual |

Steps:

1. Open the application at the root URL.
2. Select the Team Lead profile and confirm sign-in.
3. Observe the navigation bar.
4. Refresh the browser.

Expected Result: the navigation bar shows the selected profile name and role. After
refresh the session persists and the user is not returned to the sign-in view.

---

## 4. Task Management

### TC-TASK-01 -- Create a task with complete metadata

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-002 |
| Precondition | Authenticated; Kanban board visible |
| Test Data | Title `Implement burndown chart`; Priority `High`; Points `5`; Assignee `Dhatri` |
| Type | Manual |

Steps:

1. Activate the New Task control.
2. Enter the title, select priority, story points and assignee.
3. Save the task.

Expected Result: a card appears at the top of the Backlog column showing the title, a
High priority badge, a 5-point estimate and the assignee. The card survives a page
refresh.

### TC-TASK-02 -- Assign Critical priority

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-016 |
| Precondition | At least one task exists |
| Test Data | Priority `Critical` |
| Type | Manual |

Steps:

1. Open an existing task.
2. Change priority to Critical and save.

Expected Result: the card shows a Critical badge carrying a text label, not colour alone.

### TC-TASK-03 -- Reject a task with an empty title

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-002 (negative case) |
| Precondition | Task creation dialog open |
| Test Data | Title: empty string, then a single space |
| Type | Manual |

Steps:

1. Leave the title empty and attempt to save.
2. Enter a single space as the title and attempt to save.

Expected Result: both attempts are rejected with an inline validation message. No task
is created in either case, confirming the title is trimmed before validation.

---

## 5. Kanban Workflow

### TC-KAN-01 -- Render the five-column board

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-003 |
| Precondition | Authenticated with seeded data |
| Type | Manual |

Steps:

1. Navigate to the Kanban board.
2. Read the column headers from left to right.

Expected Result: exactly five columns appear in the order Backlog, To Do, In Progress,
Code Review, Done, each showing its task count.

### TC-KAN-02 -- Transition a task by drag-and-drop

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-004 |
| Precondition | At least one task in Backlog |
| Type | Manual |

Steps:

1. Drag a Backlog card onto the In Progress column.
2. Release the card.
3. Refresh the browser.

Expected Result: the card renders in In Progress immediately on release, the source
column count decreases by one, the target increases by one, and the new state survives
the refresh.

### TC-KAN-03 -- Advance a task by single action

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-005 |
| Precondition | At least one task in To Do |
| Type | Manual |

Steps:

1. Activate the advance control on a To Do card.

Expected Result: the task moves to the next workflow stage, In Progress. A task already
in Done does not advance further.

### TC-KAN-04 -- Cancel a drag outside any column

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-004 (negative case) |
| Precondition | At least one task on the board |
| Type | Manual |

Steps:

1. Begin dragging a card.
2. Release it outside every column drop target.

Expected Result: the card returns to its original column and its status is unchanged.

### TC-FILT-01 -- Filter by priority

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-011 |
| Precondition | Tasks of mixed priority exist |
| Test Data | Filter: Priority `High` |
| Type | Manual |

Steps:

1. Apply the High priority filter.
2. Add a free-text search term that matches no task.

Expected Result: after step 1 only High priority tasks are visible. After step 2 an
explicit empty state names the active filters and offers to clear them; columns are not
left silently blank.

---

## 6. Estimation and Sprint Management

### TC-EST-01 -- Assign Fibonacci story points

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-006 |
| Precondition | A task exists |
| Test Data | Each of 1, 2, 3, 5, 8, 13, 21 |
| Type | Automated (`src/tests/estimation.test.js`) and Manual |

Steps:

1. Open a task and inspect the available story point choices.
2. Select each permitted value in turn and save.

Expected Result: only the seven Fibonacci values are offered, so a non-Fibonacci estimate
cannot be entered through the interface. Each selected value persists and is reflected in
sprint capacity.

### TC-EST-02 -- Calculate sprint capacity

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-008 |
| Precondition | A sprint exists with no assigned tasks |
| Test Data | Three tasks estimated at 3, 5 and 8 points |
| Type | Automated and Manual |

Steps:

1. Assign the three tasks to the sprint.
2. Read the reported sprint capacity.
3. Remove the 5-point task and read the capacity again.

Expected Result: capacity reports 16 points after step 1 and 11 points after step 3,
confirming capacity is recomputed rather than accumulated.

### TC-SPR-01 -- Create a sprint

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-007 |
| Precondition | Sprint Manager view open |
| Test Data | Name `Sprint 3`; goal `Deliver estimation engine`; a two-week date range |
| Type | Manual |

Steps:

1. Create a sprint with the test data.
2. Save and return to the sprint list.

Expected Result: the sprint appears with its name, goal and date range, and becomes
available as an assignment target for tasks.

### TC-BURN-01 -- Update the burndown chart

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-009 |
| Precondition | An active sprint with estimated tasks |
| Type | Manual |

Steps:

1. Open the dashboard and note the actual burn line.
2. Move a task to Done.
3. Return to the dashboard.

Expected Result: the actual line falls by exactly the completed task story points, while
the ideal line is unchanged.

---

## 7. Dashboard and Reporting

### TC-DASH-01 -- Display KPI metrics

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-010 |
| Precondition | An active sprint with a mix of complete and incomplete tasks |
| Type | Manual |

Steps:

1. Open the dashboard.
2. Compare the reported progress percentage against the board contents.

Expected Result: progress percentage, velocity and workload distribution are shown, and
the progress figure equals completed points divided by total sprint points.

### TC-WORK-01 -- Show workload distribution

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-017 |
| Precondition | Tasks assigned across at least three members |
| Type | Manual |

Steps:

1. Open the dashboard workload section.

Expected Result: each member appears with their assigned point total, and the totals sum
to the total assigned points in the sprint.

### TC-DOCS-01 -- Render in-app documentation

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-018 |
| Precondition | Authenticated |
| Type | Manual |

Steps:

1. Navigate to the documentation view.

Expected Result: documentation content renders with readable headings and no missing
sections.

---

## 8. Persistence, Configuration and Audit

### TC-SUPA-01 -- Persist to Supabase PostgreSQL

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-013 |
| Precondition | A Supabase project with `database/schema.sql` applied |
| Test Data | Valid project URL and anonymous key |
| Type | Manual |

Steps:

1. Enter the Supabase credentials in Database Settings and connect.
2. Create a task.
3. Inspect the `tasks` table in the Supabase dashboard.
4. Refresh the application.

Expected Result: the row is present in PostgreSQL with matching field values, and the
task is still present after refresh.

### TC-OFF-01 -- Persist offline without configuration

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-014 |
| Precondition | No Supabase credentials configured |
| Type | Manual |

Steps:

1. Create two tasks.
2. Close the browser tab and reopen the application.

Expected Result: both tasks are present, restored from LocalStorage, and the interface
indicates that offline persistence is active.

### TC-SET-01 -- Switch data mode from settings

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-015 |
| Precondition | Application running in offline mode |
| Type | Manual |

Steps:

1. Open Database Settings and enter valid credentials.
2. Save and observe the connection indicator.
3. Enter a malformed URL and attempt to save.

Expected Result: valid credentials switch the data service to cloud mode and the
indicator updates. A malformed URL is rejected with a clear message and the previous
working configuration is retained.

### TC-LOG-01 -- Record an audit trail for mutations

| Field | Detail |
| :--- | :--- |
| Requirement | PMS-F-012 |
| Precondition | Audit log empty or its current length recorded |
| Type | Manual |

Steps:

1. Create a task.
2. Edit its title.
3. Delete the task.
4. Open the audit log.

Expected Result: exactly three new entries appear, of types CREATE, UPDATE and DELETE, in
chronological order, each carrying a timestamp, the acting user and the affected entity.

---

## 9. Non-Functional Verification

| Test Case ID | Requirement | Method | Pass Criteria |
| :--- | :--- | :--- | :--- |
| TC-PERF-01 | PMS-NF-001 | Measure a drag-and-drop transition with the browser Performance API | State transition completes in under 50 ms |
| TC-AVAIL-01 | PMS-NF-002 | Disable the network with the application open | Application stays usable and reports offline mode; no unhandled error |
| TC-COMPAT-01 | PMS-NF-003 | Execute TC-KAN-01, TC-KAN-02 and TC-TASK-01 on Chrome, Firefox and Edge | Identical behaviour and layout on all three |
| TC-SEC-01 | PMS-NF-004 | Inspect requests in browser developer tools while connected to Supabase | Every request uses HTTPS; no credential appears in a URL |
| TC-LOAD-01 | PMS-NF-005 | Seed 100 tasks and interact with the board | Board renders and drag-and-drop stays responsive |
| TC-RECOV-01 | PMS-NF-006 | Disconnect, create tasks, reconnect | No task is lost across the transition |

---

## 10. Automated Coverage

| Test File | Cases | Requirements Covered |
| :--- | :--- | :--- |
| `src/tests/estimation.test.js` | 4 | PMS-F-006, PMS-F-008 |
| `src/tests/workflow.test.js` | 3 | PMS-F-003, PMS-F-004, PMS-F-005 |

Run with `npm test`. The suite executes on every push and pull request through the
GitHub Actions pipeline; a failing case blocks the merge.

The remaining cases are executed manually because they depend on drag-and-drop gestures,
cross-browser rendering, or a live Supabase project, none of which the current automated
suite drives.

---

## 11. Traceability Summary

| Area | Test Cases | Requirements Covered |
| :--- | :--- | :--- |
| Authentication | TC-AUTH-01 | PMS-F-001 |
| Task management | TC-TASK-01 to TC-TASK-03 | PMS-F-002, PMS-F-016 |
| Kanban workflow | TC-KAN-01 to TC-KAN-04, TC-FILT-01 | PMS-F-003 to PMS-F-005, PMS-F-011 |
| Estimation and sprints | TC-EST-01, TC-EST-02, TC-SPR-01, TC-BURN-01 | PMS-F-006 to PMS-F-009 |
| Dashboard | TC-DASH-01, TC-WORK-01, TC-DOCS-01 | PMS-F-010, PMS-F-017, PMS-F-018 |
| Persistence and audit | TC-SUPA-01, TC-OFF-01, TC-SET-01, TC-LOG-01 | PMS-F-012 to PMS-F-015 |
| Non-functional | TC-PERF-01 to TC-RECOV-01 | PMS-NF-001 to PMS-NF-006 |

All 18 functional and 6 non-functional requirements in the STP have at least one
corresponding test case. Three negative cases (TC-TASK-03, TC-KAN-04, and step 3 of
TC-SET-01) were added beyond the RTM to confirm that invalid input and cancelled actions
leave system state unchanged.
