# Team Work Allocation and Examination Viva Guide

**Project Title:** SprintFlow — Agile Project Management System  
**Course Code:** Software Engineering (5th Semester B.Tech, Section 5C)  
**Team Number:** Team 11  

This guide covers both submissions made so far: Phase 1 (SRS and core implementation) and
Phase 2 (SAD and STP). Phase 2 was first developed in the separate SE-SRS-2 repository; its
full commit history is now part of this repository.

---

## 1. Team Members and Role Assignments

| Name | USN | Primary Role | Phase 1 Branch (SRS) | Phase 2 Branch (SAD / STP) |
| :--- | :--- | :--- | :--- | :--- |
| Darshan P Pawar | PES2UG24CS143 | Team Lead & Full-Stack Architect | `feature/darshan-core-auth-dashboard` | `feature/darshan-sad-architecture` |
| DHATRI SHIVAPRASAD | PES2UG24CS158 | Frontend & UI/UX Lead | `feature/dhatri-kanban-workflow` | `feature/dhatri-sad-design-ux` |
| CHANDAN KUMAR K | PES2UG24CS128 | Backend & Database Architect | `feature/chandan-database-architecture` | `feature/chandan-test-plan-core` |
| GURUBELLI YEKAMBAR ESHWAR RAO | PES2UG24CS173 | Full-Stack & QA/DevOps Lead | `feature/eshwar-sprint-estimation-cicd` | `feature/eshwar-test-execution-metrics` |

---

## 2. Phase 1 -- Individual Technical Contributions (SRS and Core Implementation)

### Darshan P Pawar (PES2UG24CS143)

- **Role:** Team Lead and Full-Stack Architect
- **Assigned Feature Branch:** `feature/darshan-core-auth-dashboard`
- **Engineering Deliverables:**
  - Designed core application architecture and Vite single-page application scaffold.
  - Implemented Authentication and Role Profile state management (`src/context/AuthContext.jsx`).
  - Developed Executive Visibility KPI Dashboard (`src/components/dashboard/DashboardView.jsx`).
  - Formulated capacity balancing metrics to calculate story points assigned versus completed per student.
  - Compiled and structured formal IEEE 830 Software Requirements Specification (SRS).
- **Viva Defense Summary:**
  - Explains system architecture, modular design patterns, reactive state synchronization, and executive visibility metrics.

---

### DHATRI SHIVAPRASAD (PES2UG24CS158)

- **Role:** Frontend and UI/UX Lead
- **Assigned Feature Branch:** `feature/dhatri-kanban-workflow`
- **Engineering Deliverables:**
  - Implemented 5-column Kanban workflow board (`src/components/kanban/KanbanBoard.jsx`).
  - Integrated HTML5 native drag-and-drop state lifecycle with visual drop feedback.
  - Developed Agile Task Creation and Editing Modal (`src/components/kanban/TaskModal.jsx`).
  - Implemented multi-dimensional task search and multi-predicate filtering (assignee, priority, keywords).
  - Built 1-click stage advancement stepper buttons for streamlined task progression.
- **Viva Defense Summary:**
  - Explains HTML5 drag-and-drop event pipeline (`dragStart`, `dragOver`, `drop`), filter predicates, and user interface responsiveness.

---

### CHANDAN KUMAR K (PES2UG24CS128)

- **Role:** Backend and Database Architect
- **Assigned Feature Branch:** `feature/chandan-database-architecture`
- **Engineering Deliverables:**
  - Designed relational PostgreSQL schema (`database/schema.sql`) for profiles, projects, sprints, tasks, comments, and audit logs.
  - Configured PostgreSQL Row Level Security (RLS) policies and performance indexes.
  - Implemented dual-mode DataService layer (`src/services/supabaseClient.js`) with Supabase cloud synchronization and local persistence fallback.
  - Developed real-time audit logging engine capturing all user actions and state mutations with timestamps.
  - Built Database Settings interface with schema SQL exporter.
- **Viva Defense Summary:**
  - Explains database normalization, foreign key cascade constraints, Row Level Security policies, and dual-mode offline/cloud resilience.

---

### GURUBELLI YEKAMBAR ESHWAR RAO (PES2UG24CS173)

- **Role:** Full-Stack and QA/DevOps Lead
- **Assigned Feature Branch:** `feature/eshwar-sprint-estimation-cicd`
- **Engineering Deliverables:**
  - Implemented Agile Story Point Estimation Engine conforming to Fibonacci scale (`1, 2, 3, 5, 8, 13, 21`).
  - Developed Sprint Lifecycle Management component (`src/components/sprint/SprintManager.jsx`).
  - Engineered real-time SVG burndown velocity visualizer (`src/utils/estimation.js`).
  - Wrote Vitest automated unit test suites (`src/tests/estimation.test.js`, `src/tests/workflow.test.js`).
  - Configured GitHub Actions CI/CD automation pipeline (`.github/workflows/ci.yml`).
- **Viva Defense Summary:**
  - Explains Fibonacci non-linear estimation theory, burndown velocity algorithms, automated test assertions, and multi-stage CI/CD execution.

---

## 3. Phase 2 -- Document Ownership (SAD and STP)

### Software Architecture & Design (SAD) Document

| Section | Owner | Description |
| :--- | :--- | :--- |
| Sections 1-2 (Introduction, Document Overview) | Darshan P Pawar | Purpose, scope, audience, definitions, related documents |
| Section 3 (Architecture) | Darshan P Pawar | Goals, constraints, stakeholders, component diagram, architecture pattern, technology stack, security architecture (STRIDE) |
| Section 4 (Design) | DHATRI SHIVAPRASAD | Design overview, UML sequence diagrams, API design, error handling, UX design |
| Section 5 (Appendices) | DHATRI SHIVAPRASAD | Glossary, references, tools |

### Software Test Plan (STP) Document

| Section | Owner | Description |
| :--- | :--- | :--- |
| Sections 1-5 (Introduction through Test Strategy) | CHANDAN KUMAR K | Purpose, test items, features to test, approach, security validation |
| Sections 6-9 (Environment, Schedule, Deliverables, Roles) | CHANDAN KUMAR K | Test environment setup, schedule milestones, deliverables list, role assignments |
| Sections 10-12 (Risks, Assumptions, Suspension Criteria) | GURUBELLI YEKAMBAR ESHWAR RAO | Risk mitigation, dependency management, halt/resume criteria |
| Sections 13-15 (Traceability, Metrics, Approvals) | GURUBELLI YEKAMBAR ESHWAR RAO | RTM mapping, test metrics collection, sign-off procedures |

---

## 4. Phase 2 -- Viva Preparation Guide

### Darshan P Pawar (PES2UG24CS143) -- Architecture & Leadership

- Explain the layered component architecture and why it was chosen over alternatives
- Describe the dual-mode data persistence strategy (Supabase + LocalStorage)
- Walk through the UML component diagram and explain inter-component dependencies
- Discuss STRIDE threat modeling and security architecture decisions
- Demonstrate the live application and GitHub repository structure

### DHATRI SHIVAPRASAD (PES2UG24CS158) -- Design & UX

- Explain the UML sequence diagrams for authentication and task workflow
- Describe the API design for Supabase REST endpoints
- Discuss error handling strategies and monitoring approach
- Walk through the UX design principles applied to the Kanban board interface
- Demonstrate drag-and-drop interactions and responsive layout behavior

### CHANDAN KUMAR K (PES2UG24CS128) -- Test Planning & Strategy

- Explain the multi-level testing approach (unit, integration, system, acceptance)
- Describe the test environment setup and tool selection rationale
- Walk through the features-to-test mapping to SRS requirement IDs
- Discuss entry and exit criteria for each testing phase
- Demonstrate the Vitest test suite execution and CI/CD pipeline

### GURUBELLI YEKAMBAR ESHWAR RAO (PES2UG24CS173) -- Test Execution & Metrics

- Explain the Requirements Traceability Matrix and how it ensures coverage
- Describe test metrics collection methodology (pass rate, defect density, coverage)
- Walk through risk identification and mitigation strategies
- Discuss suspension and resumption criteria for testing activities
- Demonstrate the GitHub Actions CI/CD workflow and test reporting

---

## 5. Git Feature Branch and Collaboration Protocol

In accordance with institutional guidelines, Team 11 follows a strict feature branch workflow:

1. Each member works on their dedicated feature branch.
2. Commits are attributed to the respective team member.
3. Pull Requests are created from feature branches to `main`.
4. PRs are verified by automated CI checks, then reviewed and merged by designated team members.

| Branch | Phase | Purpose |
| :--- | :--- | :--- |
| `main` | All | Protected production branch containing release-ready code and documentation |
| `feature/darshan-core-auth-dashboard` | 1 | Lead full-stack contributions |
| `feature/dhatri-kanban-workflow` | 1 | Kanban user interface and workflow contributions |
| `feature/chandan-database-architecture` | 1 | Supabase database schema and data services |
| `feature/eshwar-sprint-estimation-cicd` | 1 | Agile estimation, sprint tracking, and CI/CD pipelines |
| `feature/darshan-sad-architecture` | 2 | SAD Sections 1-3 and Architecture Decision Records |
| `feature/dhatri-sad-design-ux` | 2 | SAD Sections 4-5 and UX design specification |
| `feature/chandan-test-plan-core` | 2 | STP Sections 1-9 and test case specification |
| `feature/eshwar-test-execution-metrics` | 2 | STP Sections 10-15, lint gate and test metrics |

Each branch contains distinct commits authored by the respective team member and is merged into `main` via pull requests.
