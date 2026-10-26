# User Experience and Interaction Design Specification

## SprintFlow -- Project Management System

**Owner:** Dhatri Shivaprasad (PES2UG24CS158) -- Frontend and UI/UX Lead
**Branch:** `feature/dhatri-sad-design-ux`
**Related Document:** `docs/SAD_Document_Team11.md`, Section 4 (Design)

---

## 1. Purpose

This document specifies the interaction design of SprintFlow: the screen inventory, the
Kanban interaction model, the state and feedback rules, and the accessibility
commitments. It expands Section 4.5 of the Software Architecture and Design
Specification, which states the design principles but not the concrete interaction
contracts that implement them.

---

## 2. Design Principles

| Principle | Definition | How it is implemented |
| :--- | :--- | :--- |
| Immediate Feedback | Every user action produces a visible result within 50 ms | Optimistic state updates in `ProjectContext`; persistence happens after the UI has already moved |
| Progressive Disclosure | The default view stays uncluttered; detail appears on request | Task detail, estimation and assignment live in `TaskModal`, not on the card |
| Direct Manipulation | Workflow state is changed by moving the work item itself | HTML5 drag-and-drop on the Kanban board, not a status dropdown |
| Single Source of Truth | One state tree drives every view | Kanban, dashboard and sprint manager all read from `ProjectContext` |
| Recoverability | No destructive action is silent or unexplained | Confirmation on delete; every mutation is written to the audit log |

---

## 3. Screen Inventory

| Screen | Component | Primary User Goal | Entry Point |
| :--- | :--- | :--- | :--- |
| Kanban Board | `KanbanBoard.jsx` | Move work through the workflow | Default view after sign-in |
| Task Detail | `TaskModal.jsx` | Create or edit a task and set its estimate | Card click, or the New Task control |
| Executive Dashboard | `DashboardView.jsx` | Assess sprint health and team load | Sidebar navigation |
| Sprint Manager | `SprintManager.jsx` | Plan and run an iteration | Sidebar navigation |
| Database Settings | `SettingsModal.jsx` | Connect a Supabase project | Sidebar settings control |
| Documentation | `DocsView.jsx` | Read project guides in context | Sidebar navigation |

---

## 4. Kanban Interaction Model

### 4.1 Workflow Columns

The board presents five columns in fixed left-to-right order, matching the team
definition of done:

| Order | Column | Meaning | Exit Condition |
| :--- | :--- | :--- | :--- |
| 1 | Backlog | Identified but not committed to a sprint | Assigned to a sprint and estimated |
| 2 | To Do | Committed to the current sprint, not started | An owner picks it up |
| 3 | In Progress | Actively being worked | Implementation complete |
| 4 | Code Review | Awaiting peer review | Review approved |
| 5 | Done | Merged and accepted | Terminal state |

### 4.2 Drag-and-Drop Contract

| Stage | Event | Visual Feedback | State Effect |
| :--- | :--- | :--- | :--- |
| Grab | `dragstart` | Card lifts, opacity reduced to signal it is in transit | Dragged task id held in component state |
| Hover | `dragover` | Target column border highlights | None; the move is not yet committed |
| Release on a column | `drop` | Card settles into the new column immediately | Status updated optimistically, then persisted |
| Release outside a column | `dragend` | Card returns to its origin | No change |

A move is committed optimistically so the board never appears to stall. If persistence
fails, the task reverts and the failure is surfaced rather than swallowed.

### 4.3 Filtering and Search

Filters compose rather than replace one another: assignee, priority and free-text search
are applied together, so a user can narrow to one person's high-priority items in a
single pass. An empty result set shows an explicit empty state explaining which filters
are active, never a blank column that could be mistaken for lost data.

---

## 5. Task Detail Interaction

`TaskModal` serves both creation and editing through the same form, which keeps one
validation path rather than two.

| Field | Control | Validation | Rationale |
| :--- | :--- | :--- | :--- |
| Title | Single-line text | Required, non-empty after trimming | A task without a title cannot be triaged |
| Description | Multi-line text | Optional | Context is useful but should not block capture |
| Story Points | Fixed-choice selector | Must be 1, 2, 3, 5, 8, 13 or 21 | Enforces the Fibonacci scale from the estimation engine |
| Priority | Fixed-choice selector | Required | Drives board ordering and dashboard grouping |
| Assignee | Selector over team members | Optional | Unassigned work is legitimate in the backlog |
| Status | Fixed-choice selector | Required | Allows keyboard-only users to change state without dragging |

Presenting story points as a fixed set of choices, rather than a free numeric input,
makes an invalid estimate unrepresentable in the interface rather than merely rejected
after the fact.

---

## 6. Feedback and System State

| State | Presentation | Reason |
| :--- | :--- | :--- |
| Empty board | Explanatory empty state with a direct action to create the first task | A blank screen gives the user no next step |
| Filtered to nothing | Message naming the active filters, with a clear-filters action | Distinguishes "no matches" from "no data" |
| Offline persistence | Persistent indicator showing local-storage mode | The user should always know where their data lives |
| Connected to Supabase | Indicator showing the connected project | Confirms the cloud path is genuinely active |
| Save failure | Inline error next to the affected control; the change is rolled back | Silent failure would leave the view disagreeing with stored state |

---

## 7. Visual Design System

| Token | Value | Applied To |
| :--- | :--- | :--- |
| Surface | Dark glassmorphic panel | Board columns, modals, sidebar |
| Accent | Single accent hue | Primary actions and active navigation only |
| Priority encoding | Colour plus a text label | Priority badges on cards |
| Status encoding | Column position plus a text label | Workflow state |
| Type scale | Four steps, from card title down to metadata | All text |
| Spacing | 4 px base unit | All layout gaps |

Priority and status are never encoded by colour alone; each carries a text label, so the
board remains usable for colour-blind users and in monochrome print.

---

## 8. Accessibility Commitments

| Commitment | Implementation |
| :--- | :--- |
| Keyboard operability | Every drag-and-drop action has an equivalent through the status selector in `TaskModal` |
| Visible focus | Focus outlines are retained rather than suppressed |
| Contrast | Body text and controls target a 4.5:1 minimum against their surface |
| Semantic structure | Headings, buttons and form labels use native elements rather than styled generic containers |
| Motion restraint | Transitions are short and limited to opacity and transform |

Drag-and-drop is the fastest path but never the only path. Any board state reachable by
dragging is also reachable from the keyboard.

---

## 9. Responsive Behaviour

| Viewport | Board Layout | Navigation |
| :--- | :--- | :--- |
| Desktop, 1280 px and above | Five columns visible simultaneously | Sidebar expanded |
| Laptop, 1024 px to 1279 px | Five columns, horizontally scrollable | Sidebar collapsible |
| Tablet, 768 px to 1023 px | Columns scroll horizontally with a fixed card width | Sidebar collapsed to icons |

The board scrolls within its own container; the page body itself never scrolls
horizontally.

---

## 10. Traceability to the SAD

| Section Here | SAD Section | Design Concern |
| :--- | :--- | :--- |
| 2. Design Principles | 4.1 Design Overview | Stated principles made concrete |
| 4. Kanban Interaction Model | 4.2 Sequence Diagrams | Task creation and state transition flows |
| 5. Task Detail Interaction | 4.3 API Design | Field contracts matching the Tasks API |
| 6. Feedback and System State | 4.4 Error Handling | User-facing error presentation |
| 7-9. Visual, Accessibility, Responsive | 4.5 UX Design | Accessibility and layout commitments |
