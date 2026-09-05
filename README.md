# SprintFlow: Agile Project Management System

**Course:** Software Engineering (Section 5C)  
**Institution:** PES University, Department of Computer Science and Engineering  
**Team Designation:** Team 11  
**Project Focus:** Workflow Automation, Executive Visibility, Agile Estimation, and Kanban  

[![CI/CD Pipeline](https://github.com/Darshanpawar7/SE-SRS/actions/workflows/ci.yml/badge.svg)](https://github.com/Darshanpawar7/SE-SRS/actions)

SprintFlow is a high-performance web-based Agile Project Management System developed by Team 11. The application provides end-to-end support for iterative software engineering workflows, including interactive 5-column Kanban board management with HTML5 drag-and-drop mechanics, Fibonacci story point estimation, sprint scheduling, real-time SVG burndown velocity tracking, executive visibility dashboards, and dual-mode database synchronization via Supabase PostgreSQL and persistent offline fallback storage.

---

## 1. Team Members and Work Allocation

| Student Name | USN | Engineering Role | Git Feature Branch |
|---|---|---|---|
| **Darshan P Pawar** | `PES2UG24CS143` | Team Lead & Full-Stack Architect | `feature/darshan-core-auth-dashboard` |
| **DHATRI SHIVAPRASAD** | `PES2UG24CS158` | Frontend & UI/UX Lead | `feature/dhatri-kanban-workflow` |
| **CHANDAN KUMAR K** | `PES2UG24CS128` | Backend & Database Architect | `feature/chandan-database-architecture` |
| **GURUBELLI YEKAMBAR ESHWAR RAO** | `PES2UG24CS173` | Full-Stack & QA/DevOps Lead | `feature/eshwar-sprint-estimation-cicd` |

---

## 2. System Architecture

The application adopts a decoupled, reactive architecture:
- **Presentation Layer:** React 18 single-page application bundled with Vite 5.
- **State and Context Management:** React Context API (`AuthContext`, `ProjectContext`) managing reactive mutations and audit logging.
- **Data Persistence Layer:** Dual-mode storage architecture (`src/services/supabaseClient.js`) providing live PostgreSQL synchronization through `@supabase/supabase-js` v2 and resilient offline browser persistence (`localStorage`) for zero-configuration evaluation.
- **Verification and Automation:** Vitest automated test runner paired with GitHub Actions CI/CD workflows gating pushes and pull requests.

```
+-----------------------------------------------------------------------+
|                      React 18 Single Page App (Vite 5)                |
|  - Kanban Workflow   - Visibility Dashboard   - Sprint Management     |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                     Dual-Mode Data Service Layer                      |
|                (src/services/supabaseClient.js)                       |
+-----------------------------------------------------------------------+
            |                                           |
            v                                           v
+-----------------------+                   +---------------------------+
| Supabase PostgreSQL   |                   | Persistent Offline Engine |
| Cloud Database (RLS)  |                   | (Browser LocalStorage)    |
+-----------------------+                   +---------------------------+
```

---

## 3. Core System Features

1. **Interactive 5-Column Kanban Board:** Full workflow progression through `Backlog`, `To Do`, `In Progress`, `Code Review`, and `Done` with sub-50ms HTML5 drag-and-drop state updates and 1-click step advancement.
2. **Agile Fibonacci Estimation:** Story point assignment utilizing standard Fibonacci values (`1, 2, 3, 5, 8, 13, 21`) with dynamic capacity calculations.
3. **Sprint Lifecycle and Burndown Tracking:** Iteration scheduling, goal definition, and dynamic SVG burndown visualizers comparing ideal trajectory against actual velocity.
4. **Executive Visibility KPI Dashboard:** Real-time metrics for total story points, completed velocity, remaining load, and student workload distribution.
5. **Security and Access Control:** PostgreSQL Row Level Security (RLS) policies, client-side input sanitization against XSS, and TLS 1.3 encryption.
6. **Automated CI/CD Pipeline:** GitHub Actions workflow executing build checks, Vitest test suites, linting, and dependency security audits on every branch push and pull request.

---

## 4. Quick Start and Installation

### Prerequisites
- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher

### Local Setup
```bash
# Clone the repository
git clone https://github.com/Darshanpawar7/SE-SRS.git
cd SE-SRS

# Install dependencies
npm install

# Launch development server
npm run dev
```
Navigate to `http://localhost:5173` in a web browser. The system initializes immediately with pre-configured seed data.

### Automated Testing
```bash
# Execute Vitest test suite
npm test

# Verify production build compilation
npm run build
```

---

## 5. Database Configuration

The application is architected to operate out-of-the-box in **Offline / Local Mode** with zero database setup required.

To connect a live Supabase PostgreSQL instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Execute the DDL script located at `database/schema.sql` in the Supabase SQL Editor.
3. In the SprintFlow interface, open the **Database Settings** modal and input the Project URL and Anon Public Key.

---

## 6. Academic Documentation and Deliverables

- **Project Report (PDF):** `Team11_Project_Report.pdf` (11-page formal submission document)
- **Project Report (Word):** `docs/Team11_Project_Report.docx`
- **SRS Markdown Specification:** `docs/SRS_Document_Team11.md`
- **Requirements Traceability Matrix:** Contained in Section 8 of the SRS document
- **Team Work Breakdown and Viva Guide:** `docs/Team_Work_Division.md`
- **Database DDL Schema:** `database/schema.sql`
- **CI/CD Workflow Definition:** `.github/workflows/ci.yml`
