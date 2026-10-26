# Issue #18: Immutable audit trail

Every task and sprint mutation now writes one audit record built by `createAuditRecord`: creating, editing, moving and deleting a task, creating a sprint, and starting or completing a sprint. Each record has a type (CREATE, UPDATE or DELETE), the acting team member, the action, the affected entity, and an ISO timestamp; edits also list each changed field with its full old and new value. Records are frozen, the data service only appends them, and there is no way in the application to edit or delete one. The history is no longer cut to the latest 20 entries, and resetting demo data keeps the history and records who reset it.

The dashboard shows the latest seven records with "Showing 7 of N records" and a control to show the full history. Status moves display stage names ("In Progress → Code Review").

Automated cases cover record contents and freezing, rejection of records without an actor, type or valid timestamp, the TC-LOG-01 create/edit/delete sequence, plain moves and no-change saves, sprint records, untruncated history with earlier records unchanged, history surviving a demo reset, relative time formatting, and the rendered feed.

Manual check (TC-LOG-01): note the record count on the dashboard, create a task, edit its title, delete it, and open the dashboard. Exactly three new records appear, CREATE, UPDATE and DELETE, each with your name and a time. Reset the demo data from Database Settings and confirm the earlier records are still listed.

## Validation

Verified on 26 October 2026: `npm test` (95 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings).
