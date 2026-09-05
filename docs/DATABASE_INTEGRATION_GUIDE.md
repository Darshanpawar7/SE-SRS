# Supabase PostgreSQL Database Architecture & Data Layer
**Module Lead:** CHANDAN KUMAR K (PES2UG24CS128) — Backend & Database Architect

## Overview
This module provides the complete relational data persistence layer for SprintFlow. It implements a production-grade PostgreSQL database on Supabase, secured with Row Level Security (RLS) policies, and paired with an automatic zero-config offline fallback layer for seamless academic evaluations.

---

## 1. Database Schema Specifications (`database/schema.sql`)
- **`profiles` Table:** Stores user identity, USN, roles (Lead, Developer, Scrum Master, Evaluator), and avatar colors.
- **`projects` Table:** Tracks project key (`PMS`), metadata, ownership, and target milestones.
- **`project_members` Table:** Relational junction table mapping users to projects with role-based permissions.
- **`sprints` Table:** Manages iteration schedules, sprint goals, total planned points, and completed velocity.
- **`tasks` Table:** Stores agile work items, workflow stages (Backlog, Todo, In Progress, Review, Done), Fibonacci story points, priorities, and assignees.
- **`comments` Table:** Threaded task discussions and feedback.
- **`activity_logs` Table:** Immutable audit trail logging all state transitions with actor and timestamp.

---

## 2. Row Level Security (RLS) Policies
PostgreSQL RLS policies are enabled across all tables to enforce data privacy and prevent unauthorized tenant access:
- Public read access for team evaluation.
- Authenticated write access for task modifications.

---

## 3. Dual-Mode DataService Architecture (`src/services/supabaseClient.js`)
- **Cloud Mode:** Interacts directly with Supabase tables via `@supabase/supabase-js`.
- **Offline / Local Mode:** Seamless fallback to browser `localStorage` ensuring 100% operational availability without network dependencies.
