# Issue #20: Offline CRUD fallback

Without Supabase credentials, creating, editing, moving and deleting tasks work from browser storage and survive reloads and closed tabs, and the navbar shows "Local / Demo Mode".

With credentials, a change Supabase does not confirm (for example, the network is down) is kept locally and queued. Previously the next load read the older cloud rows and the local change was lost. Now each change is marked as waiting before it is sent, and the mark is cleared only when Supabase confirms the latest send of that table. While a table is marked, loading uses the local copy, so a reload during a slow or failed save, or an older save that finishes after a newer one failed, never brings back older data. The queue holds changed tables, deleted task IDs and audit records. It is sent in foreign-key order in the background on the next load, when the browser comes back online, or from **Retry sync now** in Database Settings. Only one retry runs at a time, and a request with no answer after 15 seconds counts as failed and stays queued. Each item leaves the queue only after Supabase confirms it. While changes are waiting, the navbar shows "Sync pending (n)" instead of "Supabase Connected" (or "Supabase Sync Error" after a failure), and Database Settings shows how many changes are waiting.

Automated cases cover local-only create, update and delete across reloads (TC-OFF-01); a failed save kept and queued; a reload while still offline showing the local change, followed by a successful sync; tasks created while disconnected reaching the cloud after reconnecting (TC-RECOV-01); an offline delete that does not come back; queued audit records, sent only once; a reload during a slow save; writes refused while reads still work; an older save finishing after a newer one failed; a stalled request timing out without blocking the next retry; the navbar's pending state; and a failed retry keeping everything queued.

Manual check (TC-OFF-01): with no Supabase credentials, create two tasks, close the tab, reopen the app, and confirm both tasks are present and the navbar shows "Local / Demo Mode". With credentials: disconnect the network, move a task, reload, and confirm the move is still shown and the navbar warns that changes are waiting; reconnect and confirm the change reaches the `tasks` table.

## Validation

Verified on 26 October 2026: `npm test` (119 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings). Cloud behaviour was verified against the in-memory Supabase stand-in.
