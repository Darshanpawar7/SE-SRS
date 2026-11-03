# Verified cloud sessions and scoped caches

Maps to PMS-F-001, PMS-F-015, SO-01/SO-03 and PMS-SR-001. A cloud browser marker no longer grants a restored identity: getUser verifies the server account before project data loads. A selected profile must match that identity. Supabase auth events are handled outside the synchronous callback to avoid auth-lock deadlocks. In-flight initial loads are discarded when identity changes. Task and sprint reads explicitly select the active project.

Active browser work and pending uploads are switched by endpoint plus verified user identity. Prior data/queues are retained in local cache backups, never automatically uploaded as a different user. A legacy cloud or unattributed cache is retained in a legacy-unverified backup rather than exposed through demo sign-in or silently imported into a cloud account. A recognized demo scope remains separate. Switching back restores that scope. These backups are localStorage, not encryption or protection from a person with browser/device access. Clear browser data only after exporting anything needed.

Local demo sign-in remains offline. Configured cloud mode requires network verification on initial restore; if it fails the app asks for sign-in and keeps saved data. Once verified, existing offline writes/retries remain available. RLS remains the actual cloud authorization boundary. No live Supabase, schema deployment, external penetration test or TLS certification is claimed. Tests cover identity mismatch, expiry, cache/queue isolation and project read scoping. Review server Auth/RLS separately before deployment.

Source: https://supabase.com/docs/reference/javascript/auth-getuser

The authenticated workspace is mounted under a profile identity key. Sign-out unmounts its modal/draft/filter state; changing the verified team profile remounts it. This prevents a previous profile's unsaved task draft or open editor from appearing after another person signs in. Combined compiled-app verification covers sign-out during an open draft and fresh-profile sign-in.
