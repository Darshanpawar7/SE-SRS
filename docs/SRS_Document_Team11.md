# Software Requirements Specification (SRS)
## SprintFlow — Project Management System
**Project Focus:** Workflow, Visibility, Estimation, Kanban  
**Course:** Software Engineering (Section 5C - Jackfruit Problem Team details)  
**Team 11:**  
- **PES2UG24CS143** — Darshan P Pawar (Lead & Full-Stack Architect)  
- **PES2UG24CS158** — DHATRI SHIVAPRASAD (Frontend & UI/UX Lead)  
- **PES2UG24CS128** — CHANDAN KUMAR K (Backend & Supabase Architect)  
- **PES2UG24CS173** — GURUBELLI YEKAMBAR ESHWAR RAO (Full-Stack & QA/DevOps Lead)  
**Status:** Approved / Model Answer  
**Version:** 1.0  

---

## 1. Introduction
### 1.1 Purpose
This document specifies the software requirements for SprintFlow, a comprehensive agile project management system designed for collaborative team workflow tracking, story point estimation, executive visibility, and automated CI/CD validation.

### 1.2 Scope
SprintFlow includes interactive Kanban workflows, Agile Fibonacci estimation (1, 2, 3, 5, 8, 13, 21), sprint burndown tracking, team capacity balancing, and dual-mode data persistence (Supabase PostgreSQL Cloud + offline fallback).

---

## 2. Team Work Allocation & Git Feature Branches

| USN | Student Name | Role | Assigned Component | Feature Branch |
|---|---|---|---|---|
| **PES2UG24CS143** | Darshan P Pawar | Lead & Architect | System Shell, Auth, Executive Dashboard & KPIs | `feature/darshan-core-auth-dashboard` |
| **PES2UG24CS158** | DHATRI SHIVAPRASAD | Frontend Lead | Kanban Board, Drag-and-Drop Workflow, Task UI | `feature/dhatri-kanban-workflow` |
| **PES2UG24CS128** | CHANDAN KUMAR K | Backend Lead | Supabase Database Schema, RLS, Data Service Layer | `feature/chandan-supabase-backend-api` |
| **PES2UG24CS173** | GURUBELLI YEKAMBAR ESHWAR RAO | DevOps & QA Lead | Agile Estimation, Sprints, Burndown, CI/CD Pipeline | `feature/eshwar-sprint-estimation-cicd` |

---

## 3. System Features (16 Functional Requirements)

| Req ID | Requirement | Priority | Acceptance Criteria | Assigned Lead |
|---|---|---|---|---|
| **FR-01** | User authentication with profile switching (Lead, Developer, Evaluator) | High | Active profile persists in session | Darshan P Pawar |
| **FR-02** | Project metadata tracking with unique project key | High | Project name, key, and dates persist | Darshan P Pawar |
| **FR-03** | 5-Column Kanban board (Backlog, Todo, In Progress, Review, Done) | Critical | Cards render in accurate stage lanes | Dhatri Shivaprasad |
| **FR-04** | HTML5 drag-and-drop card movement across stages | Critical | Status updates instantly on card drop | Dhatri Shivaprasad |
| **FR-05** | 1-Click step advance button for quick progression | Medium | Moves task card to immediate next column | Dhatri Shivaprasad |
| **FR-06** | Task creation/editing with title, description, priority, assignee | High | Modal captures and validates all fields | Dhatri Shivaprasad |
| **FR-07** | Fibonacci story point estimation (1, 2, 3, 5, 8, 13, 21) | Critical | Points strictly conform to Fibonacci scale | Eshwar Rao |
| **FR-08** | Dynamic sprint capacity and completion % calculation | High | Completion % = (Done / Total) * 100 | Eshwar Rao |
| **FR-09** | Sprint lifecycle management (planned, active, completed) | High | Iteration status transitions correctly | Eshwar Rao |
| **FR-10** | Real-time Burndown chart (ideal vs actual burn rate) | High | SVG visualizer displays burndown trajectory | Eshwar Rao |
| **FR-11** | Executive Visibility Dashboard with real-time KPI metrics | High | Cards display points, velocity, completion | Darshan P Pawar |
| **FR-12** | Team workload and capacity balancing per student | Medium | Points assigned vs completed computed per USN | Darshan P Pawar |
| **FR-13** | Persistent audit trail and activity logging | High | Activity feed captures actor, action, timestamp | Chandan Kumar K |
| **FR-14** | Supabase Cloud PostgreSQL database integration | Critical | Syncs with PostgreSQL tables via REST client | Chandan Kumar K |
| **FR-15** | Zero-config offline / demo mode fallback | High | 100% operational in offline localStorage | Chandan Kumar K |
| **FR-16** | Automated GitHub Actions CI/CD test and build pipeline | High | CI pipeline passes build and Vitest suite | Eshwar Rao |

---

## 4. Non-Functional & Security Requirements

### 4.1 Security Objectives & Requirements
- **SO-01 (Confidentiality & Access Control):** Data access restricted by project member roles.
- **SO-02 (Data Integrity):** Prevent unauthorized modifications to sprint estimations and audit logs.
- **SO-03 (Auditability):** Maintain immutable audit trail of all card state transitions.
- **SR-01:** PostgreSQL Row Level Security (RLS) policies on all tables (`database/schema.sql`).
- **SR-02:** Zero hardcoded secrets; API keys managed via `.env` or client configuration modal.
- **SR-03:** HTTPS / TLS 1.3 enforced for cloud database transport.
- **SR-04:** React JSX automatic output sanitization against XSS.
- **SR-05:** Automated security vulnerability audit (`npm audit`) in CI/CD pipeline.

### 4.2 Quality Attributes
- **NFR-01 (Performance):** Drag-and-drop state updates < 50ms locally.
- **NFR-02 (Availability):** 100% uptime with instant offline fallback.
- **NFR-03 (Usability):** Dark glassmorphic design system with high contrast text.
- **NFR-04 (Reliability):** Zero data loss across browser refreshes.
- **NFR-05 (Maintainability):** Modular architecture with 100% build pass rate.

---

## 5. Requirements Traceability Matrix (RTM)

| Req ID | Feature Module | Test Case Ref | Target Branch | Verification Status |
|---|---|---|---|---|
| FR-01 | Auth & Roles | `TC-AUTH-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| FR-02 | Project Tracking | `TC-PROJ-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| FR-03 | Kanban Board | `TC-KANBAN-01` | `feature/dhatri-kanban-workflow` | PASSED |
| FR-04 | Drag-and-Drop | `TC-KANBAN-02` | `feature/dhatri-kanban-workflow` | PASSED |
| FR-05 | Quick Advance | `TC-KANBAN-03` | `feature/dhatri-kanban-workflow` | PASSED |
| FR-06 | Task Modal CRUD | `TC-TASK-01` | `feature/dhatri-kanban-workflow` | PASSED |
| FR-07 | Fibonacci Estimation | `TC-EST-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| FR-08 | Metric Calculation | `TC-EST-02` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| FR-09 | Sprint Management | `TC-SPRINT-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| FR-10 | Burndown Chart | `TC-BURN-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
| FR-11 | Executive Dashboard | `TC-DASH-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| FR-12 | Team Workload | `TC-WORK-01` | `feature/darshan-core-auth-dashboard` | PASSED |
| FR-13 | Audit Log Trail | `TC-LOG-01` | `feature/chandan-supabase-backend-api` | PASSED |
| FR-14 | Supabase Cloud Sync | `TC-SUPA-01` | `feature/chandan-supabase-backend-api` | PASSED |
| FR-15 | Offline Fallback | `TC-OFFLINE-01` | `feature/chandan-supabase-backend-api` | PASSED |
| FR-16 | CI/CD Pipeline | `TC-CICD-01` | `feature/eshwar-sprint-estimation-cicd` | PASSED |
