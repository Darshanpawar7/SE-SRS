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
