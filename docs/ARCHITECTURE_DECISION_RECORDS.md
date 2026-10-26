# Architecture Decision Records (ADR)

## SprintFlow -- Project Management System

**Owner:** Darshan P Pawar (PES2UG24CS143) -- Team Lead and Full-Stack Architect
**Branch:** `feature/darshan-sad-architecture`
**Related Document:** `docs/SAD_Document_Team11.md`, Section 3 (Architecture)

---

## 1. Purpose

This document records the significant architectural decisions taken for SprintFlow,
together with the context that forced each decision, the alternatives that were
considered, and the consequences the team accepted. It supplements Section 3.5 of the
Software Architecture and Design Specification, which states the selected pattern but not
the full deliberation behind it.

Each record follows the standard ADR structure: Context, Decision, Alternatives,
Consequences, and Status.

---

## 2. ADR Index

| ADR ID | Title | Status | Affects SAD Section |
| :--- | :--- | :--- | :--- |
| ADR-001 | Layered Component Architecture over Microservices | Accepted | 3.5 |
| ADR-002 | React Context API over Redux for State Management | Accepted | 3.6 |
| ADR-003 | Dual-Mode Persistence (Supabase with LocalStorage Fallback) | Accepted | 3.6, 4.3 |
| ADR-004 | Row Level Security Enforced at the Database Tier | Accepted | 3.9 |
| ADR-005 | Fibonacci Story Points over Ideal-Hour Estimation | Accepted | 4.1 |
| ADR-006 | Client-Rendered SVG Burndown over a Charting Library | Accepted | 4.5 |
| ADR-007 | Vite over Create React App as Build Toolchain | Accepted | 3.6 |

---

## 3. Decision Records

### ADR-001: Layered Component Architecture over Microservices

**Status:** Accepted

**Context.** SprintFlow is developed by four students over a single academic term and must
be demonstrable on an evaluator laptop without network access or container
infrastructure. The team nevertheless needs clear module boundaries so that four people
can work in parallel without constant merge conflicts.

**Decision.** Adopt a three-layer component architecture -- Presentation, State
Management, and Data Service -- within a single React single-page application. Layer
boundaries are enforced by directory structure and by a strict dependency rule: a layer
may depend only on the layer directly beneath it.

**Alternatives considered.**

- Microservices. Rejected. Service orchestration, inter-service contracts and container
  tooling would consume more effort than the features themselves, and the system has no
  scaling requirement that would justify the overhead.
- Monolithic MVC (for example Django templates). Rejected. Server-rendered pages make the
  drag-and-drop Kanban interaction substantially harder and prevent offline operation.

**Consequences.**

- Positive: a single `npm run dev` starts the whole system; each member owns a distinct
  directory; the dependency rule keeps the component diagram accurate by construction.
- Negative: all layers deploy as one unit, so a change to the data layer requires a full
  rebuild. Accepted, because a production rebuild completes in under two seconds.

---

### ADR-002: React Context API over Redux for State Management

**Status:** Accepted

**Context.** Task, sprint and authentication state must be shared across the Kanban board,
dashboard and sprint manager. The team needed shared state without adding a dependency
that carries its own conceptual overhead.

**Decision.** Use two React Context providers: `AuthContext` for identity and role, and
`ProjectContext` for tasks, sprints and the audit log.

**Alternatives considered.**

- Redux Toolkit. Rejected. The store, slice, reducer and selector concepts add learning
  cost disproportionate to an application with roughly a dozen state fields.
- Prop drilling. Rejected. The Kanban board sits four levels below the app shell;
  threading callbacks through every level would couple unrelated components.

**Consequences.**

- Positive: no additional dependency, and the state logic is readable by every member.
- Negative: a context update re-renders all consumers. Acceptable at the current data
  volume; boards of several hundred cards would need memoised selectors.

---

### ADR-003: Dual-Mode Persistence (Supabase with LocalStorage Fallback)

**Status:** Accepted

**Context.** The system should demonstrate a real cloud database, but an evaluation must
never fail because of campus network conditions or an expired free-tier project.

**Decision.** Route every read and write through a single DataService abstraction in
`src/services/supabaseClient.js`. When Supabase credentials are configured the service
targets Supabase PostgreSQL; otherwise it transparently falls back to browser
LocalStorage seeded with representative project data.

**Alternatives considered.**

- Cloud only. Rejected. A network failure during the viva would block the entire
  demonstration.
- LocalStorage only. Rejected. The project would then demonstrate no database design, no
  schema, and no access-control model.

**Consequences.**

- Positive: the application is always demonstrable, and the same call sites serve both
  modes.
- Negative: the abstraction must keep two code paths behaviourally equivalent, which the
  workflow unit tests cover. Offline mode is single-device by nature and therefore does
  not exercise Row Level Security.

---

### ADR-004: Row Level Security Enforced at the Database Tier

**Status:** Accepted

**Context.** A browser client holds only the Supabase anonymous key, which is public by
design. Authorisation therefore cannot be enforced in client code, because anyone can
call the REST endpoint directly with that key.

**Decision.** Enforce all access control through PostgreSQL Row Level Security policies
defined in `database/schema.sql`. Client-side role checks exist only to hide controls a
user cannot use; they are treated as user-experience affordances, never as a security
boundary.

**Alternatives considered.**

- Client-side role checks alone. Rejected. Trivially bypassed with a direct API call.
- A custom backend service in front of the database. Rejected. It would reintroduce
  server deployment, which ADR-001 deliberately avoided, to solve a problem that RLS
  already solves at the correct tier.

**Consequences.**

- Positive: authorisation holds regardless of how the data is reached.
- Negative: policy errors surface as empty result sets rather than explicit failures, so
  policies must be tested directly against the database.

---

### ADR-005: Fibonacci Story Points over Ideal-Hour Estimation

**Status:** Accepted

**Context.** The project brief requires an estimation capability. Estimates must convey
relative size and uncertainty rather than false precision.

**Decision.** Restrict story points to the Fibonacci sequence 1, 2, 3, 5, 8, 13, 21, and
validate the constraint in `src/utils/estimation.js`.

**Alternatives considered.**

- Ideal hours. Rejected. Hour estimates invite precision the team cannot justify and are
  routinely read as commitments.
- T-shirt sizes. Rejected. Non-numeric sizes cannot be summed into sprint capacity or
  plotted on a burndown chart.

**Consequences.**

- Positive: widening gaps in the scale communicate growing uncertainty, and points sum
  directly into capacity and velocity.
- Negative: points are not comparable across teams, which is an accepted property of the
  technique rather than a defect.

---

### ADR-006: Client-Rendered SVG Burndown over a Charting Library

**Status:** Accepted

**Context.** The dashboard needs a burndown chart comparing ideal against actual remaining
story points across a sprint.

**Decision.** Render the chart as inline SVG computed directly from sprint state.

**Alternatives considered.**

- Chart.js or Recharts. Rejected. A charting dependency adds significant bundle weight for
  a single chart of fixed, simple shape.

**Consequences.**

- Positive: no dependency, full control over monochrome print styling, and the chart
  reflects state changes immediately.
- Negative: further chart types would each need hand-rolling. This decision should be
  revisited if a third chart type is ever required.

---

### ADR-007: Vite over Create React App as Build Toolchain

**Status:** Accepted

**Context.** The team iterates frequently and the CI pipeline runs on every push.

**Decision.** Use Vite 5 for the development server and production bundling.

**Alternatives considered.**

- Create React App. Rejected. It is no longer actively recommended, and its cold start and
  rebuild times are markedly slower.

**Consequences.**

- Positive: sub-second hot module replacement and a production build under two seconds,
  which keeps CI feedback fast.
- Negative: the team must use the Vite environment-variable convention (the `VITE_`
  prefix), which is documented in `.env.example`.

---

## 4. Traceability to the SAD

| ADR ID | SAD Section | Architectural Concern Served |
| :--- | :--- | :--- |
| ADR-001 | 3.5 Chosen Architecture Pattern | Modularity, parallel team development |
| ADR-002 | 3.6 Technology Stack | Shared state without external dependency |
| ADR-003 | 3.6 Data Stores, 4.3 API Design | Availability during evaluation |
| ADR-004 | 3.9 Security Architecture | Confidentiality, least privilege |
| ADR-005 | 4.1 Design Overview | Estimation capability |
| ADR-006 | 4.5 UX Design | Sprint progress visibility |
| ADR-007 | 3.6 Technology Stack | Build reproducibility, CI feedback speed |
