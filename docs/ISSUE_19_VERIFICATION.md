# Issue #19: Supabase PostgreSQL synchronisation

With valid credentials the data service reads the project, sprints and tasks from Supabase and keeps a local copy. On first connection to an empty Supabase project it publishes the browser's data in foreign-key order (project, sprints, tasks). Every save writes locally first and then upserts to Supabase; deleting a task deletes its row; audit records are inserted into `activity_logs`.

Fixes to the previous sync code:
- supabase-js returns errors instead of throwing, so failed saves were silently ignored. Every request now checks the result; failures are shown in the navbar and Database Settings, and the local data is kept.
- Task, sprint and project IDs were strings such as `task-101`, which the schema's UUID columns reject. New records and the seed data now use UUIDs.
- The project row included `owner_name`, which the `projects` table does not have. Rows now carry only schema columns.
- Deleted tasks were never deleted in Supabase and came back on the next load.
- The client was created once and kept even after the credentials changed.
- A change was saved locally but its audit record only after the cloud request finished, so closing the tab mid-request lost the record. A change and its audit record are now written locally together, before any request.
- Browsers that ran earlier builds hold a 6-point seed task that made every save fail; it is corrected on load, and a refused save now names the task and returns the board to the saved state.
- Database Settings accepted any URL. It now rejects anything that is not an `https://` URL, or an empty key, with a message, and keeps the previous configuration (TC-SET-01).

Schema compatibility (column mapping and identifiers) is documented in `docs/DATABASE_INTEGRATION_GUIDE.md`, section 5.

Automated cases use an in-memory Supabase stand-in and cover cloud reads with a local copy, first-connection publishing order, the client's columns checked against `database/schema.sql`, schema-only rows, a change and its audit record stored before a stalled request, legacy seed repair, error surfacing without data loss, deletes, audit inserts, credential validation, and UUID seed data.

Manual check (TC-SUPA-01): run `database/schema.sql` in a Supabase project, enter its URL and anon key in Database Settings, create a task, and confirm the row appears in the `tasks` table with matching values and the task is still there after a refresh. Enter `not-a-url` and save: the message appears and the previous connection keeps working.

## Validation

Verified on 26 October 2026: `npm test` (107 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings). A live Supabase project was not available; cloud behaviour was verified against the in-memory stand-in.
