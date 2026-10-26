# Issue #37: Project metadata (PMS-F-002)

Clicking the project badge in the navbar opens **Project Details** with the project key, name, start date and end date. The team lead can edit and save them; other members see the same values read-only with a note that only the team lead can edit, and the project state rejects an edit from anyone else (or before the project has loaded).

Saving validates the values first:
- The key must be 2 to 10 letters or digits starting with a letter (it is upper-cased), and must not match another project's key in any letter case. Locally there is one project; with Supabase, every row in `projects` is checked, as is the table's unique constraint.
- The name must be 3 to 80 characters after trimming.
- Both dates must be real calendar dates, and the end date must be on or after the start date.

Valid changes are saved locally together with an audit record of each changed field, then sent to Supabase (with the queue from #20 if it is unreachable), and shown at once in the navbar badge and the dashboard header, which both read them through one `describeProject` helper. The seed project now has dates (1 September to 30 October 2026), and the seed sprints use the course's sprint weeks (19 to 23 October and 26 to 30 October 2026), so the burndown shows recorded values next to the plan instead of far beyond an old end date.

Automated cases cover normalisation, invalid keys, duplicate keys (locally and against Supabase), name and date-range rules, saving and reloading, the details and audit record being stored before Supabase answers, the audit record's contents, edits rejected from other members and before loading, the lead-only dialog, and placeholder text before loading.

Manual check: sign in as the team lead, click the project badge, change the key to `pms` and the end date to a date before the start date, and save. The date error appears and nothing changes. Fix the date and save: the badge shows `PMS` with the new name, the dashboard header shows the new dates, and the audit trail lists "updated project" with the changed fields. Sign in as another member and confirm the dialog is read-only.

## Validation

Verified on 26 October 2026: `npm test` (149 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings).
