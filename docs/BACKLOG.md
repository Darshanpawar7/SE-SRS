# SprintFlow Backlog

This backlog maps one item to each requirement statement in the approved SRS. The SRS contains 18 functional requirements, three Security Objectives (SO-01 to SO-03), five Security Requirements (PMS-SR-001 to PMS-SR-005), and five quality requirements (PMS-NF-001 to PMS-NF-005). Security objectives and requirements are tracked as NFRs. No additional product requirements have been introduced.

Story points use Fibonacci values (1, 2, 3, 5, 8). Statuses describe the existing repository baseline; acceptance criteria describe the follow-up work needed to meet each SRS statement.

## Sprint 1 — Core requirements (19–23 Oct 2026)

**Plan:** Close gaps in profiles and project metadata, the core Kanban and task workflow, estimation and sprint metrics, auditability, cloud synchronization, and offline persistence.

| ID | Backlog item | Type | SP | Assignee | Status |
|---|---|---:|---:|---|---|
| PMS-F-001 | Support team profile switching | FR | 3 | Darshan P Pawar (@Darshanpawar7) | partial |
| PMS-F-002 | Maintain project metadata | FR | 5 | Darshan P Pawar (@Darshanpawar7) | partial |
| PMS-F-003 | Render five Kanban workflow columns | FR | 2 | Dhatri Shivaprasad (@dhatri-shastry) | done-baseline |
| PMS-F-004 | Move cards with HTML5 drag and drop | FR | 3 | Dhatri Shivaprasad (@dhatri-shastry) | partial |
| PMS-F-005 | Advance task to the next stage | FR | 2 | Dhatri Shivaprasad (@dhatri-shastry) | done-baseline |
| PMS-F-006 | Create and update tasks | FR | 3 | Dhatri Shivaprasad (@dhatri-shastry) | done-baseline |
| PMS-F-007 | Categorize tasks with labels and tags | FR | 3 | Dhatri Shivaprasad (@dhatri-shastry) | done-baseline |
| PMS-F-008 | Enforce Fibonacci story point values | FR | 3 | Eshwar (@0-soul-slayer-0) | done-baseline |
| PMS-F-009 | Calculate planned points and completion | FR | 3 | Eshwar (@0-soul-slayer-0) | done-baseline |
| PMS-F-010 | Manage sprint lifecycle | FR | 3 | Eshwar (@0-soul-slayer-0) | partial |
| PMS-F-011 | Plot actual and ideal burndown | FR | 3 | Eshwar (@0-soul-slayer-0) | partial |
| PMS-F-012 | Show executive KPI dashboard | FR | 3 | Darshan P Pawar (@Darshanpawar7) | done-baseline |
| PMS-F-013 | Show team workload and capacity | FR | 3 | Darshan P Pawar (@Darshanpawar7) | done-baseline |
| PMS-F-014 | Maintain an immutable audit trail | FR | 3 | Chandan Kumar K (@chandanKumar-k) | partial |
| PMS-F-015 | Synchronize data with Supabase PostgreSQL | FR | 5 | Chandan Kumar K (@chandanKumar-k) | partial |
| PMS-F-016 | Preserve offline CRUD fallback | FR | 5 | Chandan Kumar K (@chandanKumar-k) | partial |

**Sprint 1 total: 52 SP**

### Sprint 1 points per person

| Member | Points |
|---|---:|
| Darshan P Pawar (@Darshanpawar7) | 14 |
| Dhatri Shivaprasad (@dhatri-shastry) | 13 |
| Chandan Kumar K (@chandanKumar-k) | 13 |
| Eshwar (@0-soul-slayer-0) | 12 |
| **Total** | **52** |

## Sprint 2 — Remaining FRs, NFRs, tests, and hardening (26–30 Oct 2026)

**Plan:** Complete remaining filtering and CI requirements, then verify and harden security, performance, availability, accessibility, persistence, and maintainability controls. Use automated tests and CI checks for measurable criteria.

| ID | Backlog item | Type | SP | Assignee | Status |
|---|---|---:|---:|---|---|
| PMS-F-017 | Filter tasks by multiple attributes | FR | 3 | Dhatri Shivaprasad (@dhatri-shastry) | done-baseline |
| PMS-F-018 | Run CI on pushes and pull requests | FR | 3 | Eshwar (@0-soul-slayer-0) | partial |
| SO-01 | Isolate data by role and membership | NFR | 5 | Darshan P Pawar (@Darshanpawar7) | not-started |
| SO-02 | Protect audit record integrity | NFR | 2 | Chandan Kumar K (@chandanKumar-k) | partial |
| SO-03 | Attribute changes to verified actors | NFR | 3 | Darshan P Pawar (@Darshanpawar7) | partial |
| PMS-SR-001 | Enforce Supabase row-level security | NFR | 5 | Chandan Kumar K (@chandanKumar-k) | not-started |
| PMS-SR-002 | Keep credentials out of source control | NFR | 5 | Darshan P Pawar (@Darshanpawar7) | partial |
| PMS-SR-003 | Require HTTPS and TLS for cloud traffic | NFR | 3 | Chandan Kumar K (@chandanKumar-k) | partial |
| PMS-SR-004 | Sanitize textual input against XSS | NFR | 3 | Dhatri Shivaprasad (@dhatri-shastry) | not-started |
| PMS-SR-005 | Block CI on dependency security findings | NFR | 3 | Eshwar (@0-soul-slayer-0) | partial |
| PMS-NF-001 | Meet local interaction performance target | NFR | 3 | Dhatri Shivaprasad (@dhatri-shastry) | partial |
| PMS-NF-002 | Maintain availability through offline fallback | NFR | 3 | Chandan Kumar K (@chandanKumar-k) | partial |
| PMS-NF-003 | Meet accessibility and usability target | NFR | 5 | Dhatri Shivaprasad (@dhatri-shastry) | partial |
| PMS-NF-004 | Preserve data across reloads and tab closures | NFR | 3 | Eshwar (@0-soul-slayer-0) | partial |
| PMS-NF-005 | Keep architecture maintainable and build clean | NFR | 5 | Eshwar (@0-soul-slayer-0) | partial |

**Sprint 2 total: 54 SP**

### Sprint 2 points per person

| Member | Points |
|---|---:|
| Darshan P Pawar (@Darshanpawar7) | 13 |
| Dhatri Shivaprasad (@dhatri-shastry) | 14 |
| Chandan Kumar K (@chandanKumar-k) | 13 |
| Eshwar (@0-soul-slayer-0) | 14 |
| **Total** | **54** |

## Overall allocation

| Member | Sprint 1 | Sprint 2 | Overall |
|---|---:|---:|---:|
| Darshan P Pawar (@Darshanpawar7) | 14 | 13 | 27 |
| Dhatri Shivaprasad (@dhatri-shastry) | 13 | 14 | 27 |
| Chandan Kumar K (@chandanKumar-k) | 13 | 13 | 26 |
| Eshwar (@0-soul-slayer-0) | 12 | 14 | 26 |
| **Total** | **52** | **54** | **106** |

## Status guide

- **done-baseline** — the main behavior is present in the current source; acceptance verification or hardening may still be planned.
- **partial** — a basic path exists, but one or more SRS acceptance conditions are missing or not demonstrated. Examples include simulated profile switching without real authentication, interpolated rather than recorded daily burndown, non-append-only activity history, and a non-blocking dependency audit in CI.
- **not-started** — the repository does not implement the stated control as a complete feature.

Each member has 12–14 SP in each sprint and 26–27 SP overall.
