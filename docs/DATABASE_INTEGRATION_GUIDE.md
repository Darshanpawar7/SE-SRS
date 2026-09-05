# Supabase PostgreSQL Database Architecture
**Owner:** CHANDAN KUMAR K (PES2UG24CS128) — Backend & Database Architect

## Features Implemented:
1. **PostgreSQL Relational Schema (`database/schema.sql`):**
   - Tables: `profiles`, `projects`, `project_members`, `sprints`, `tasks`, `comments`, `activity_logs`.
   - Foreign key constraints with `CASCADE` rules.
2. **Row Level Security (RLS):**
   - Enabled RLS across all tables to enforce strict data isolation between tenants.
3. **Dual-Mode DataService (`src/services/supabaseClient.js`):**
   - Cloud mode: Connects directly to Supabase via `@supabase/supabase-js`.
   - Offline fallback: Seamless persistent browser storage for instant evaluation without network latency.
4. **Audit Trail Engine:**
   - Chronological logging of all task state changes and sprint lifecycle events.
