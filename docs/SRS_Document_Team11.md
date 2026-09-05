# Software Requirements Specification (SRS)
## SprintFlow: Agile Project Management System

**Academic Institution:** PES University, Department of Computer Science and Engineering  
**Course:** Software Engineering (Section 5C)  
**Team Designation:** Team 11  
**Project Classification:** Workflow Automation, Visibility, Agile Estimation, and Kanban  
**Specification Standard:** IEEE Std 830-1998  
**Document Version:** 1.0  
**Status:** Approved for Academic Submission  

---

## 1. Document Control and Revision History

| Version | Release Date | Primary Authors | Revision Summary | Approval Status |
|---|---|---|---|---|
| 1.0 | 05-09-2026 | Team 11 | Complete specification incorporating 18 FRs, 6 NFRs, 2 UML models, and RTM | Approved |

### Sign-Off Approvals
- **Team Lead:** Darshan P Pawar (`PES2UG24CS143`)
- **Course Coordinator:** Department of CSE Faculty, PES University

---

## 2. Team Work Allocation

| Student Name | USN | Role | Assigned Subsystem | Feature Branch |
|---|---|---|---|---|
| Darshan P Pawar | `PES2UG24CS143` | Team Lead & Full-Stack Architect | Application Shell, Authentication, Dashboard & Visibility | `feature/darshan-core-auth-dashboard` |
| DHATRI SHIVAPRASAD | `PES2UG24CS158` | Frontend & UI/UX Lead | 5-Column Kanban Board, HTML5 Drag & Drop, Task Modal | `feature/dhatri-kanban-workflow` |
| CHANDAN KUMAR K | `PES2UG24CS128` | Backend & Database Architect | Supabase PostgreSQL Schema, RLS, DataService Layer | `feature/chandan-database-architecture` |
| GURUBELLI YEKAMBAR ESHWAR RAO | `PES2UG24CS173` | Full-Stack & QA/DevOps Lead | Fibonacci Estimation, Sprints, Burndown Analytics, CI/CD | `feature/eshwar-sprint-estimation-cicd` |

---

## 3. Introduction

### 3.1 Purpose
This document establishes the official Software Requirements Specification (SRS) for SprintFlow, a collaborative project management and execution tracking platform. It delineates functional requirements, non-functional quality attributes, user interface parameters, database schemas, and verification test matrices for academic evaluation.

### 3.2 Scope
SprintFlow delivers a modern, single-page application addressing agile project tracking. Key operational capabilities include:
- Visual 5-stage Kanban board with sub-50ms state updates.
- Fibonacci-based agile story point estimation (`1, 2, 3, 5, 8, 13, 21`).
- Sprint lifecycle orchestration and dynamic SVG burndown velocity charting.
- Executive visibility KPI dashboards calculating student workload distributions.
- Dual-mode data persistence utilizing Supabase PostgreSQL cloud instances paired with zero-config local storage fallbacks.
- Automated CI/CD pipeline gating pull requests via build, lint, and unit test suites.

### 3.3 Definitions and Acronyms
- **SRS:** Software Requirements Specification
- **RTM:** Requirements Traceability Matrix
- **FR / NFR:** Functional Requirement / Non-Functional Requirement
- **RLS:** Row Level Security
- **SP:** Story Points
- **CI/CD:** Continuous Integration / Continuous Deployment

---

## 4. Overall Description

### 4.1 Product Perspective
SprintFlow operates as a lightweight, client-driven single-page application built using React 18 and Vite 5. The application abstracts backend interactions through a dual-mode data service capable of operating against live Supabase PostgreSQL instances or synchronous local browser storage.

### 4.2 Major Product Functions
1. **Kanban Workflow Subsystem:** Multi-column lifecycle management (`Backlog`, `To Do`, `In Progress`, `Code Review`, `Done`) with native HTML5 drag-and-drop state updates.
2. **Estimation and Capacity Subsystem:** Agile complexity estimation based on Fibonacci values with automatic sprint capacity recalculation.
3. **Sprint Lifecycle Subsystem:** Scheduling, activation, and completion of iterations against predefined goals.
4. **Burndown Velocity Visualizer:** Daily point tracking comparing actual burndown curves with ideal linear consumption.
5. **Executive Visibility Dashboard:** Aggregated KPI metrics for total points, velocity delivered, and student capacity balancing.
6. **Persistence Engine:** Cloud PostgreSQL database synchronization with Row Level Security and transparent offline fallback.

### 4.3 User Roles and Characteristics
- **Team Lead:** Project creation, milestone tracking, database configuration, and overall velocity monitoring.
- **Developer:** Task authoring, story point estimation, status transitions, and code implementation.
- **Scrum Master:** Sprint planning, backlog grooming, and velocity review.
- **Academic Evaluator:** Code review, automated test execution audit, and RTM verification.

---

## 5. System Features (18 Functional Requirements)

| Req ID | Requirement Description | Category | Priority | Acceptance Criteria | Assigned Lead |
|---|---|---|---|---|---|
| **PMS-F-001** | Support user authentication and profile switching among 4 team roles. | Security | High | Active profile persists across views without page reloads. | Darshan P Pawar |
| **PMS-F-002** | Maintain project metadata including unique key, name, and target dates. | Project Mgmt | High | Metadata updates propagate globally to all dashboard widgets. | Darshan P Pawar |
| **PMS-F-003** | Render a 5-column Kanban board matching software lifecycle stages. | Workflow | Critical | All five stages render with accurate task item counts. | Dhatri Shivaprasad |
| **PMS-F-004** | Provide HTML5 drag-and-drop card movement across workflow columns. | Workflow | Critical | Dropping a card updates its status in under 50ms and logs an audit record. | Dhatri Shivaprasad |
| **PMS-F-005** | Provide 1-click stage advancement stepper controls. | Workflow | Medium | Stepper advances the task to the immediate next stage sequentially. | Dhatri Shivaprasad |
| **PMS-F-006** | Allow creating and updating tasks with title, description, and priority. | Task Mgmt | High | Modal captures, validates, and persists task attributes. | Dhatri Shivaprasad |
| **PMS-F-007** | Support categorization labels and tags on task work items. | Task Mgmt | Medium | Tags render as distinct pills on task cards. | Dhatri Shivaprasad |
| **PMS-F-008** | Enforce Fibonacci story point estimation scale (`1, 2, 3, 5, 8, 13, 21`). | Estimation | Critical | Points must strictly conform to allowed Fibonacci values. | Eshwar Rao |
| **PMS-F-009** | Dynamically compute total planned points and sprint completion percentages. | Estimation | High | Formula: (Done Points / Total Points) * 100. | Eshwar Rao |
| **PMS-F-010** | Manage sprint lifecycle states: planned, active, and completed. | Sprint Mgmt | High | Active sprint filters task boards and scope metrics. | Eshwar Rao |
| **PMS-F-011** | Compute and plot visual SVG burndown velocity curves. | Visibility | High | Renders daily remaining points against ideal linear burn trajectory. | Eshwar Rao |
| **PMS-F-012** | Render Executive Dashboard widgets (Total Points, Velocity, Progress). | Visibility | High | Summary statistics reactively update upon task mutations. | Darshan P Pawar |
| **PMS-F-013** | Compute student workload distribution and capacity balancing metrics. | Visibility | Medium | Displays points assigned and completion rates per USN. | Darshan P Pawar |
| **PMS-F-014** | Maintain an immutable audit trail capturing all entity state mutations. | Audit/Log | High | Activity feed captures actor, action, target, and timestamp. | Chandan Kumar K |
| **PMS-F-015** | Synchronize relational data with Supabase Cloud PostgreSQL database. | Database | Critical | Upserts records via REST client when credentials are provided. | Chandan Kumar K |
| **PMS-F-016** | Transparently operate in offline mode when cloud keys are not configured. | Database | High | Maintains complete CRUD functionality in browser local storage. | Chandan Kumar K |
| **PMS-F-017** | Provide multi-attribute task filtering by assignee, priority, and query. | Usability | Medium | Combines multiple filter predicates without performance degradation. | Dhatri Shivaprasad |
| **PMS-F-018** | Execute automated CI/CD pipeline on push and pull request triggers. | DevOps | High | GitHub Actions workflow validates build, test, and lint steps. | Eshwar Rao |

---

## 6. Non-Functional Requirements

### 6.1 Security Objectives and Requirements
- **SO-01 (Confidentiality):** Ensure project data is isolated by user role and membership.
- **SO-02 (Integrity):** Maintain immutable audit trails preventing unverified record alterations.
- **SO-03 (Accountability):** Attribute all task and sprint state mutations to verified student actors.
- **PMS-SR-001:** Enforce Row Level Security (RLS) on all Supabase PostgreSQL tables.
- **PMS-SR-002:** Zero hardcoded credentials in source control; manage via `.env` or client settings.
- **PMS-SR-003:** Mandate HTTPS / TLS 1.3 encryption for cloud data transmission.
- **PMS-SR-004:** Sanitize all textual user inputs against cross-site scripting (XSS).
- **PMS-SR-005:** Automated dependency security audit executed via `npm audit` during CI runs.

### 6.2 Quality Attributes
- **PMS-NF-001 (Performance):** Drag-and-drop state updates and UI re-renders complete in under 50ms locally.
- **PMS-NF-002 (Availability):** 100% operational uptime through resilient offline fallback mode.
- **PMS-NF-003 (Usability):** High-contrast typography and accessible color palettes (Lighthouse Score > 90).
- **PMS-NF-004 (Reliability):** Zero data loss across browser reloads or tab closures.
- **PMS-NF-005 (Maintainability):** Modular layer decoupling with zero ESLint warnings and 100% build pass rate.

---

## 7. Requirements Traceability Matrix (RTM)

| Req ID | Subsystem Module | Test Case ID | Feature Branch | Verification Status |
|---|---|---|---|---|
| PMS-F-001 | Auth & Roles | `TC-AUTH-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| PMS-F-002 | Project Tracking | `TC-PROJ-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| PMS-F-003 | 5-Column Kanban | `TC-KAN-01` | `feature/dhatri-kanban-workflow` | PASSED |
| PMS-F-004 | Drag-and-Drop | `TC-KAN-02` | `feature/dhatri-kanban-workflow` | PASSED |
| PMS-F-005 | Stepper Advance | `TC-KAN-03` | `feature/dhatri-kanban-workflow` | PASSED |
| PMS-F-006 | Task Modal CRUD | `TC-TASK-01` | `feature/dhatri-kanban-workflow` | PASSED |
| PMS-F-007 | Tags & Labels | `TC-TASK-02` | `feature/dhatri-kanban-workflow` | PASSED |
| PMS-F-008 | Fibonacci Estimation | `TC-EST-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| PMS-F-009 | Velocity Calculations | `TC-EST-02` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| PMS-F-010 | Sprint Lifecycle | `TC-SPR-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| PMS-F-011 | Burndown Curve | `TC-BURN-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| PMS-F-012 | KPI Dashboard | `TC-DASH-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| PMS-F-013 | Workload Balance | `TC-WORK-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| PMS-F-014 | Audit Logging | `TC-LOG-01` | `feature/chandan-database-architecture` | PASSED |
| PMS-F-015 | Supabase Sync | `TC-SUPA-01` | `feature/chandan-database-architecture` | PASSED |
| PMS-F-016 | Offline Fallback | `TC-OFF-01` | `feature/chandan-database-architecture` | PASSED |
| PMS-F-017 | Filter & Search | `TC-FILT-01` | `feature/dhatri-kanban-workflow` | PASSED |
| PMS-F-018 | CI/CD Automation | `TC-CICD-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
