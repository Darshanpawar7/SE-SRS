# Kanban Workflow and User Interface Architecture

**Module Owner:** DHATRI SHIVAPRASAD (PES2UG24CS158) — Frontend and UI/UX Lead  
**Component Reference:** `src/components/kanban/`  

---

## 1. Overview
The Kanban subsystem provides a visual, reactive workflow pipeline enabling team members to manage work items across distinct stages of the software development lifecycle.

---

## 2. Workflow Stage Definitions
The system enforces five sequential status columns:
1. `Backlog`: Unscheduled user stories, technical debts, and requirement proposals.
2. `To Do`: Prioritized tasks committed to the active sprint backlog.
3. `In Progress`: Tasks actively under development by an assigned engineer.
4. `Code Review`: Completed tasks awaiting peer review or pull request verification.
5. `Done`: Tasks validated against acceptance criteria.

---

## 3. Technical Implementation
- **HTML5 Drag-and-Drop Pipeline:** Native browser drag events (`onDragStart`, `onDragOver`, `onDrop`) manage card reassignments with immediate in-memory state updates.
- **Card Advancement Steppers:** 1-click controls allow linear progression without requiring manual drag interaction.
- **Task Modal Interface (`TaskModal.jsx`):** Comprehensive form interface validating task titles, descriptions, priorities (`Low`, `Medium`, `High`, `Critical`), story points, assignees, and labels.
- **Search and Filter Subsystem:** Multi-attribute filtering operating via combined predicates across assignee identity, priority classification, and substring matching.
