# Team Work Allocation and Examination Viva Guide

**Project Title:** SprintFlow — Agile Project Management System  
**Course Code:** Software Engineering (Section 5C)  
**Team Number:** Team 11  

---

## 1. Individual Technical Contributions

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

## 2. Git Feature Branch and Collaboration Protocol

In accordance with institutional guidelines, Team 11 utilized a strict feature branch workflow:
1. `main`: Protected production branch containing release-ready code and documentation.
2. `feature/darshan-core-auth-dashboard`: Lead full-stack contributions.
3. `feature/dhatri-kanban-workflow`: Kanban user interface and workflow contributions.
4. `feature/chandan-database-architecture`: Supabase database schema and data services.
5. `feature/eshwar-sprint-estimation-cicd`: Agile estimation, sprint tracking, and CI/CD pipelines.

Each branch contains distinct commits authored by the respective team member and is merged into `main` via pull requests verified by automated CI checks.
