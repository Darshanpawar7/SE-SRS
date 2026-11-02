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
- **Row Level Security (RLS):** Enabled on every application table. Supabase Auth email claims map to provisioned profiles, and project membership and role policies scope access. Anonymous cloud access is revoked; without an authenticated cloud session, the app continues in local mode.
- **Audit integrity:** Authenticated application users can read and insert activity records for their projects, but cannot update, delete, or truncate them. Project deletion is restricted while audit records exist.
- **Transport Encryption:** Database Settings accepts only HTTPS project URLs. TLS protocol negotiation is managed by the deployed Supabase endpoint and browser; TLS 1.3 must be confirmed at deployment and cannot be forced or inspected by frontend JavaScript.

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
All `id` columns are `UUID`. New tasks and sprints get `crypto.randomUUID()` identifiers, and the seed data uses fixed UUIDs; the seeded project and Sprint 1 use the same IDs as the seed rows in `database/schema.sql`. Data created by an older build of the app (IDs such as `task-101`) cannot be stored in these columns: the sync error is shown and the data stays in the browser. To start from UUID-based seed data, disconnect Supabase, let the team lead use **Reset Seed Data** in Database Settings, then connect again. (The reset is only available in local demo mode, so it never replaces the team's shared cloud data.)

### 5.4 Offline fallback and pending changes (PMS-F-016)
- Without credentials, every create, read, update and delete uses `localStorage` only and survives reloads and closed tabs.
- Sprint deletion also works offline: the sprint is removed locally, its tasks are kept with no sprint assignment, and the selection moves to another available sprint.
- With credentials, every change is recorded under `sprintflow_pending_sync` before it is sent: the table that changed (with a version number), the IDs of deleted tasks, and audit records not yet inserted. An entry is cleared only when Supabase confirms it, and a table's entry only when the confirmed send is the latest one, so an older request that finishes late cannot clear a newer change that failed.
- Deleting a sprint queues its ID and detached task rows. On retry, task rows are synced before the sprint deletion to satisfy the foreign key.
- While a table has an entry, loading uses the local copy instead of the (older) cloud rows, so a reload never undoes an unsent change, even if the tab was closed during a slow request.
- The queue is sent in the background on the next load, when the browser comes back online, or from **Retry sync now** in Database Settings, in foreign-key order: project, sprints, tasks, deletes, then audit records. Only one retry runs at a time.
- A request with no answer after 15 seconds counts as failed: the change stays queued and the next retry is not blocked.
- While changes are waiting, the navbar shows "Sync pending (n)" (or "Supabase Sync Error" after a failure) instead of "Supabase Connected", and Database Settings shows the count.
- Data entered in local-only mode is not merged into a Supabase project that already has data; connecting to such a project loads the cloud data.

### 5.5 Database security deployment checks (Sprint 2)
- Run `database/schema.sql` in the Supabase SQL Editor. Team accounts must exist in Supabase Auth with the same verified email addresses as the seeded `profiles` rows; the seed creates project membership roles for the four Team 11 accounts.
- Cloud CRUD requires an authenticated Supabase session. Unauthenticated reads and writes are denied by table grants and RLS; the app retains its local fallback.
- Confirm RLS is enabled for `profiles`, `projects`, `project_members`, `sprints`, `tasks`, `comments`, and `activity_logs`. Confirm the policies scope records to project membership and only project owners/leads can manage membership and project metadata.
- Test `activity_logs` as an authenticated member: SELECT and INSERT should work for the member's project; UPDATE, DELETE, and TRUNCATE must be denied. Deleting a project with audit rows must be rejected.
- Confirm transport in browser developer tools or with a TLS-capable client against the deployed project endpoint. The active connection must negotiate TLS 1.3. If the endpoint permits TLS 1.2, enforce a TLS 1.3 minimum at the hosting/edge layer before marking this requirement complete; application code cannot set that server-side minimum.
