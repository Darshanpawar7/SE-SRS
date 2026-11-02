# Issue #74: Load shared audit history from Supabase

The audit feed previously read only browser `localStorage`, so a second browser could not see events written to the shared Supabase project. `DataService.getActivity()` now loads records for the current project, maps them back to the application audit shape, merges them with local-only records by ID, and caches the combined history. Cloud rows take precedence for duplicate IDs, and a failed cloud read reports the sync error while preserving the local feed.

Automated tests cover cloud row mapping and caching, project scoping, local/cloud merging without duplicates, and local fallback on cloud read failure.

Manual verification: sign in to a Supabase-backed project in two browsers. Create or update a task in the first browser, then reload the second browser and confirm the audit event appears in the feed. Temporarily disconnect the second browser and confirm its previously cached history remains visible with a sync error reported.
