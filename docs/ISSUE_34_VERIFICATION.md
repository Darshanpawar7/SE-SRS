# Issue 34 — Persistence and interrupted-save recovery

PMS-NF-004 (use SRS numbering; the old test-plan numbering differs).

## Changes

DataService saves project, sprint or task state, its audit event and configured-mode retry intent in a synchronous write-ahead journal before starting network I/O. An interrupted multi-key save replays from the journal on the next storage read. If the journal cannot be written, existing entities are not overwritten. If applying it fails, the journal remains for retry after storage space is freed. No saved data is cleared as an error recovery action.

Previously, task state and local audit history were stored before a cloud save, but the audit upload was only queued after that request returned. Closing the tab while it waited could leave an audit event local forever. The event is now queued together with the entity. Task deletion includes its tombstone in the same journal. Cloud responses begun before a newer local save no longer replace that newer saved value. Existing retry version checks still protect newer writes against older upload confirmations.

## Automated verification

`npm test -- src/tests/persistenceRecovery.test.js`: fresh service-module sessions retaining browser storage; all entity types and activity; selected sprint and burndown; unanswered configured-mode upload and queued audit; offline restart and retry; stale project/sprint/task read races; interrupted journal replay; quota failure before and during commit. Existing offline, audit and Supabase regression suites must also pass. FakeSupabase exercises client behavior; it does not validate a live database, auth or RLS.

## Browser checks for reviewer

1. Start `npm run dev`, sign in, save a project change as lead, create a sprint and task, then edit the task and inspect the audit feed. Reload and confirm all saved values, selected sprint and audit records. Close/reopen the same browser profile and origin and confirm again.
2. Configure a test Supabase project (public anon key only). Save entities and confirm cloud rows. In DevTools go Offline, edit a task and inspect Sync pending. Reload, then close/reopen: saved local changes must remain. Go Online and Retry sync now; confirm rows and audit event arrive once.
3. Delay a task upload; save, immediately close/reopen, then reconnect. The task and matching audit event must remain queued until confirmed. Watch request failures and local storage; do not clear it.
4. Repeat for project/sprint edits and task deletion. Saved data should persist; unsaved typing is not guaranteed.

## Limits

Automatic tests model fresh application sessions, not an actual OS/browser tab kill. Live Supabase and native browser close/reopen checks remain reviewer steps. Same-origin localStorage is required. Private-mode disposal, manually clearing site data, storage-device failure, quota exhaustion and simultaneous independent edits from multiple tabs/users cannot be called zero-loss guarantees; concurrent edits still use the current last-write model. A save rejected for storage capacity must be retried after preserving data/freeing space. The journal is recoverable local persistence, not a multi-user database transaction.

Integration: coordinate service-file changes with Chandan's #73/#75. This PR leaves his offline sprint operations and shared-cloud audit work to their own PRs; rerun the full suite after merging them.
