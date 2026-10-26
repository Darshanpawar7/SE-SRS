# Issue #36: Team sign-in and profile switching (PMS-F-001)

The application now opens on a sign-in view. A visitor chooses one of the four Team 11 profiles and confirms with a password; nothing else in the application is reachable without a session. When Supabase is configured, Supabase Auth checks the password. In the default demo mode, the password is the member's USN. Only the four team accounts can sign in: any other email is rejected before Supabase is contacted. If a Supabase connection was saved in this browser but the team has no Supabase Auth accounts yet, **Use local demo mode instead** on the sign-in view removes that saved connection, so nobody is locked out; a connection built into the deployment cannot be removed this way.

The session is stored in the browser, so the signed-in profile persists across views and reloads; a stored session that does not match a team member (edited or corrupt) is discarded. The navbar shows the member's name and role (Team Lead or Team Member; the full team role is in the profile menu and on hover). Switching profile means signing out from the profile menu and signing in as another member. The earlier "simulate a teammate" switcher, which changed identity without any check, has been removed.

Each member has an access role. Only the team lead can use lead-only actions: resetting the demo data (enforced in the project state, not just hidden in the settings dialog) and, with #37, editing project details. The reset only works in local demo mode: with Supabase connected, the shared cloud data would be loaded again straight away, so the reset is blocked with a message instead of being recorded without effect.

Automated cases cover a successful sign-in that survives a reload, wrong and empty passwords, non-team accounts, switching profile, edited and corrupt sessions, Supabase Auth sign-in (including rejecting non-team accounts without calling Supabase), lead-only permissions, the rendered sign-in view, the application showing only the sign-in view until a member signs in, the local demo mode option, and the reset rules (team lead only, and only while Supabase is not connected).

Manual check (TC-AUTH-01): open the application, select the Team Lead profile, enter `PES2UG24CS143` and sign in. The navbar shows "Darshan" and "Team Lead". Refresh: you stay signed in. Choose "Switch profile", sign in as Dhatri with `PES2UG24CS158`, and confirm Reset Seed Data in Database Settings is disabled with the message that only the team lead can reset.

## Validation

Verified on 26 October 2026: `npm test` (129 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings).
