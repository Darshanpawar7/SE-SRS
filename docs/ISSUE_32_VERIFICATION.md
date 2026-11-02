# Issue #32: Maintain availability through offline fallback

Task create, update, and delete operations persist in browser `localStorage` when no Supabase credentials are configured. Cloud failures retain local changes in the pending-sync queue and the local version wins on reload until a retry succeeds.

Sprint create, status updates, and deletion also persist locally. Deleting a sprint preserves its tasks by detaching them from the sprint, records the deletion in the audit history, and selects another available sprint when possible. With cloud access restored, detached task rows are synchronized before the queued sprint deletion.

Automated tests cover task CRUD without credentials and across reloads, cloud failure/reconnect behavior, sprint CRUD locally across reloads, and retrying a failed cloud sprint deletion without losing task assignments or audit history.

Manual verification: disconnect from the network or leave Supabase credentials unset, create/update/delete tasks and a sprint, reload the page, and confirm the saved state remains. Restore connectivity, retry sync, and confirm the cloud task/sprint rows match the local state.
