# SprintFlow — Project Management System

[![CI/CD Pipeline](https://github.com/Darshanpawar7/SE-SRS/actions/workflows/ci.yml/badge.svg)](https://github.com/Darshanpawar7/SE-SRS/actions)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-729B1B?logo=vitest&logoColor=white)

An enterprise-grade, high-performance Agile Project Management System developed by **Team 11** for Software Engineering (PES University). Features real-time Kanban boards with drag-and-drop, Fibonacci story point estimation, sprint lifecycle control, executive visibility dashboards, burndown velocity analytics, and cloud database synchronization via Supabase PostgreSQL.

---

## 👥 Team 11 (Section 5C - Jackfruit Problem Team Details)

| USN | Student Name | Role | Git Feature Branch |
|---|---|---|---|
| **PES2UG24CS143** | **Darshan P Pawar** | Lead & Full-Stack Architect | `feature/darshan-core-auth-dashboard` |
| **PES2UG24CS158** | **DHATRI SHIVAPRASAD** | Frontend & UI/UX Lead | `feature/dhatri-kanban-workflow` |
| **PES2UG24CS128** | **CHANDAN KUMAR K** | Backend & Database Architect | `feature/chandan-supabase-backend-api` |
| **PES2UG24CS173** | **GURUBELLI YEKAMBAR ESHWAR RAO** | Full-Stack & QA/DevOps Lead | `feature/eshwar-sprint-estimation-cicd` |

---

## 🚀 Key Features

1. **Interactive Kanban Board:** 5-column lifecycle (`Backlog`, `To Do`, `In Progress`, `Code Review`, `Done`) with smooth HTML5 drag-and-drop and 1-click stage advancement.
2. **Agile Fibonacci Estimation:** Story point assignment (`1, 2, 3, 5, 8, 13, 21`) with live capacity recalculation.
3. **Sprint Management & Burndown:** Multi-sprint planning, goal definitions, and real-time SVG burndown curves comparing ideal versus actual burn rates.
4. **Executive Visibility & KPI Dashboard:** Progress percentages, velocity metrics, workload balance per student, and live audit feed.
5. **Supabase Cloud Sync & Zero-Setup Mode:** Connects to Supabase PostgreSQL or runs 100% offline out-of-the-box via persistent browser storage.
6. **Automated CI/CD Pipeline:** GitHub Actions workflow executing build validation, Vitest unit test suite, and lint checks.

---

## 🛠️ Quick Start Guide

### Prerequisites
- Node.js 18+ installed

### 1. Clone & Install
```bash
git clone https://github.com/Darshanpawar7/SE-SRS.git
cd SE-SRS
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app runs immediately with rich seed data!

### 3. Run Automated Tests (Vitest)
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🗄️ Supabase PostgreSQL Setup (Optional)

SprintFlow works out-of-the-box in **Zero-Config Offline Mode**. To connect live Supabase cloud:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and run `database/schema.sql`.
3. In the SprintFlow UI, click **Database Settings** (or configure `.env`) and paste your Project URL & Anon Key.

---

## 📁 Repository Structure

```
SE-SRS/
├── .github/workflows/
│   └── ci.yml               # GitHub Actions CI/CD Pipeline
├── database/
│   └── schema.sql           # Supabase PostgreSQL schema with RLS & Seed Data
├── docs/
│   ├── SRS_Document_Team11.docx # Formatted Word SRS document for submission
│   ├── SRS_Document_Team11.md   # Markdown SRS document
│   └── Team_Work_Division.md    # Work breakdown & Viva presentation guide
├── src/
│   ├── components/          # Kanban, Dashboard, Sprints, Settings, Layout
│   ├── context/             # AuthContext, ProjectContext
│   ├── services/            # SupabaseClient & DataService
│   ├── utils/               # Estimation logic & constants
│   ├── tests/               # Vitest unit test suite
│   ├── App.jsx
│   ├── index.css            # Modern dark glassmorphic styling
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 📄 Academic Deliverables

- **SRS Document (Word Format):** [docs/SRS_Document_Team11.docx](docs/SRS_Document_Team11.docx)
- **SRS Document (Markdown):** [docs/SRS_Document_Team11.md](docs/SRS_Document_Team11.md)
- **Requirements Traceability Matrix (RTM):** Included in Section 8 of the SRS.
- **Team Work Division & Viva Guide:** [docs/Team_Work_Division.md](docs/Team_Work_Division.md)
