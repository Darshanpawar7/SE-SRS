# Supabase PostgreSQL Database Architecture and Data Service

**Module Owner:** CHANDAN KUMAR K (PES2UG24CS128) — Backend and Database Architect  
**Component Reference:** `database/schema.sql`, `src/services/supabaseClient.js`  

---

## 1. Overview
The persistence layer provides relational data management for project entities, user profiles, sprints, tasks, and audit records. It implements a dual-mode strategy ensuring high availability both in cloud-connected environments and offline assessment sessions.

---

## 2. Relational Schema Architecture (`database/schema.sql`)
- **`profiles`:** User identities, USN identifiers, role designations, and avatar references.
- **`projects`:** Project identification keys, metadata, ownership references, and milestone schedules.
- **`project_members`:** Mapping table managing team member associations and permission levels.
- **`sprints`:** Iteration tracking with planned points, completed points, and state enumerations (`planned`, `active`, `completed`).
- **`tasks`:** Work items with status foreign keys, priority flags, Fibonacci points, and assignee associations.
- **`comments`:** Threaded task discussions and feedback logs.
- **`activity_logs`:** Append-only audit trail logging entity mutations, actor IDs, actions, and timestamps.

---

## 3. Security Specifications
- **Row Level Security (RLS):** Enabled across all PostgreSQL tables to enforce multi-tenant isolation.
- **Transport Encryption:** TLS 1.3 enforced for all external database transactions.

---

## 4. Dual-Mode Storage Engine
`DataService` abstracts persistence operations:
1. **Cloud Mode:** Direct query execution via `@supabase/supabase-js`.
2. **Offline Fallback Mode:** Synchronous persistence to browser `localStorage` when credentials are absent, guaranteeing 100% feature availability during offline evaluations.

---

## 5. Cloud Sync and Schema Compatibility (PMS-F-015)

### 5.1 How data moves
- **Load:** with valid credentials, the project, sprints and tasks are read from Supabase and a copy is kept in `localStorage`. If the cloud tables are empty (first connection), the browser's data is published in foreign-key order: project, then sprints, then tasks.
- **Save:** every change is written to `localStorage` first, together with its audit record, and only then sent to Supabase, so closing the tab during a slow request loses neither. Deleting a task also deletes its row, so it cannot reappear on the next load.
- **Older data:** a browser that still holds the 6-point seed task from earlier builds has it corrected to 5 points on load. A save that is refused (for example an invalid estimate) names the task, and the board returns to the saved state.
- **Audit trail:** each audit record is added to `activity_logs` with `INSERT ... ON CONFLICT (id) DO NOTHING`, so a stored record is never overwritten and sending it again is harmless.
- **Errors:** supabase-js reports failures in its `error` result. Every request checks it; a failure is shown in the navbar ("Supabase Sync Error") and in Database Settings, and the local copy is kept.
- **Credentials:** Database Settings only accepts an `https://` project URL and a non-empty anon key. Invalid input is rejected with a message and the previous working configuration stays in use (TC-SET-01).

### 5.2 Column mapping
Rows sent to Supabase carry only columns that exist in `database/schema.sql`; client-only fields are dropped.

| Table | Columns written by the client | Notes |
|---|---|---|
| `projects` | `id, name, key, description, owner_id, status, start_date, target_date` | `owner_name` is client-only and is not sent. |
| `sprints` | `id, project_id, name, goal, status, start_date, end_date, total_points, completed_points` | `created_at` and `updated_at` use the database defaults. |
| `tasks` | `id, project_id, sprint_id, title, description, status, priority, story_points, assignee_id, assignee_name, reporter_name, labels, created_at, updated_at` | `story_points` must be 1, 2, 3, 5, 8, 13 or 21, matching the table's check constraint. |
| `activity_logs` | `id, project_id, user_name, action, entity_type, entity_title, details, created_at` | `details` holds the record type, entity id, before/after values and field changes as JSON. |

### 5.3 Identifiers
All `id` columns are `UUID`. New tasks and sprints get `crypto.randomUUID()` identifiers, and the seed data uses fixed UUIDs; the seeded project and Sprint 1 use the same IDs as the seed rows in `database/schema.sql`. Data created by an older build of the app (IDs such as `task-101`) cannot be stored in these columns: the sync error is shown and the data stays in the browser. Use **Reset Seed Data** in Database Settings to start from UUID-based seed data.
