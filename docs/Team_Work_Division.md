# Team 11 Work Division & Presentation Viva Guide

**Project:** SprintFlow — Project Management System  
**Section:** 5C (Jackfruit Problem Team details)  

---

## 1. Detailed Individual Contributions & Viva Talking Points

### 🟦 1. Darshan P Pawar (PES2UG24CS143) — Lead & Full-Stack Architect
- **Git Branch:** `feature/darshan-core-auth-dashboard`
- **Modules Built:**
  - System architecture & application shell (`App.jsx`, `main.jsx`, `index.css`)
  - Authentication & Role Context (`AuthContext.jsx`, user profile switcher)
  - Executive Visibility KPI Dashboard (`DashboardView.jsx`)
  - Team workload distribution & capacity balancing metrics
  - SRS Document Compilation & formal IEEE 830 formatting
- **Viva Questions to Answer:**
  - *Q: Why did the team choose a modular React architecture with Supabase?*  
    *A:* React provides immediate reactive rendering for drag-and-drop workflows (<50ms), and Supabase provides a managed PostgreSQL relational database with instant APIs and Row Level Security, without the overhead of maintaining local database servers.
  - *Q: How does the dashboard provide project visibility?*  
    *A:* It computes real-time delivered velocity, total story points, remaining backlog, and team workload per student, giving managers instant visibility into sprint health.

---

### 🟩 2. DHATRI SHIVAPRASAD (PES2UG24CS158) — Frontend & UI/UX Lead
- **Git Branch:** `feature/dhatri-kanban-workflow`
- **Modules Built:**
  - Interactive 5-Column Kanban Board (`KanbanBoard.jsx`)
  - HTML5 Drag-and-Drop state management with visual drop feedback
  - Task Detail & Creation Modal (`TaskModal.jsx`)
  - Multi-dimensional search and filtering (by assignee, priority, keyword)
  - 1-Click quick advancement stepper buttons
- **Viva Questions to Answer:**
  - *Q: How does the drag-and-drop Kanban workflow function technically?*  
    *A:* It uses HTML5 drag events (`onDragStart`, `onDragOver`, `onDrop`). When a card is dropped on a column lane, the target status is captured, the central ProjectContext updates the task state, logs an audit entry, and persists the update.
  - *Q: How is filtering implemented?*  
    *A:* Filtering uses multi-condition predicate functions over the active sprint tasks array, supporting combined filtering by assignee ID, priority level, and case-insensitive substring search.

---

### 🟨 3. CHANDAN KUMAR K (PES2UG24CS128) — Backend & Database Architect
- **Git Branch:** `feature/chandan-supabase-backend-api`
- **Modules Built:**
  - Supabase PostgreSQL Database Schema (`database/schema.sql`)
  - Row Level Security (RLS) policies and database table indexes
  - Dual-mode Data Service Layer (`supabaseClient.js`)
  - Real-time Audit Log & Activity Trail tracking
  - Database settings modal with 1-click connection and SQL schema copier
- **Viva Questions to Answer:**
  - *Q: How does the dual-mode storage work?*  
    *A:* `DataService` checks if Supabase credentials exist. If configured, it performs real-time queries and upserts to Supabase PostgreSQL. If offline or running in evaluation mode, it falls back to persistent `localStorage` with identical schema and API contracts.
  - *Q: What security features are built into the database?*  
    *A:* We implemented PostgreSQL Row Level Security (RLS) policies on all tables (`profiles`, `projects`, `tasks`, `sprints`, `activity_logs`) to prevent unauthorized cross-tenant access.

---

### 🟥 4. GURUBELLI YEKAMBAR ESHWAR RAO (PES2UG24CS173) — Full-Stack & QA/DevOps Lead
- **Git Branch:** `feature/eshwar-sprint-estimation-cicd`
- **Modules Built:**
  - Agile Story Point Estimation Engine (Fibonacci scale: 1, 2, 3, 5, 8, 13, 21)
  - Sprint Lifecycle Management (`SprintManager.jsx`)
  - Real-time SVG Burndown Velocity Charting (`estimation.js`, `DashboardView.jsx`)
  - Automated Unit Test Suite (`estimation.test.js`, `workflow.test.js`)
  - GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)
- **Viva Questions to Answer:**
  - *Q: Why use the Fibonacci scale for estimation instead of linear numbers?*  
    *A:* The Fibonacci sequence reflects increasing uncertainty with larger tasks. It forces teams to break down oversized tasks (anything > 13 points) into manageable increments.
  - *Q: How does the CI/CD pipeline ensure software quality?*  
    *A:* On every push and pull request, GitHub Actions launches an Ubuntu VM, installs dependencies, builds the production bundle, runs Vitest unit tests, checks linting, and runs security vulnerability audits.

---

## 2. Git Workflow Demonstration (As requested in Git Guide)

1. The repository has 4 feature branches matching each member:
   - `feature/darshan-core-auth-dashboard`
   - `feature/dhatri-kanban-workflow`
   - `feature/chandan-supabase-backend-api`
   - `feature/eshwar-sprint-estimation-cicd`
2. Each branch contains individual commits representing that student's specific contributions.
3. On GitHub, students can open Pull Requests (PRs) from their feature branch into `main` to demonstrate code review, approval, and CI status checks!
