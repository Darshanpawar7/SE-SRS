# Sprint 1/2 testing and submission

Scope: the submitted SRS/SAD/STP and existing Sprint 1/2 features. The workflow does not deploy or change the team's Supabase project. Feature PRs #103–105 and teammate PR #106 remain separate reviews; evidence on this branch does not certify those unmerged features.

## Reproduce the tests

Use Node 24, `npm ci`, then `npm run test:evidence`. This runs all unit tests including the unchanged 50 ms Kanban benchmark, then collects V8 coverage with that timing-only test excluded. Every application source module remains in the coverage denominator. The STP utility line coverage floor is 80%.

For actual browser tests:

```bash
npx playwright install --with-deps chrome msedge firefox
npm run build
npm run preview -- --host 127.0.0.1
# In a second terminal in the same folder:
npm run test:system
node tests/system/cloud-session-check.mjs
```

The system suite records blocked cloud cases until supplemented by real database evidence. The session regression uses intercepted responses to exercise network failure and 401 handling; it is not proof of database persistence or RLS.

## Disposable Supabase tests

The `Sprint 1-2 Testing Evidence` workflow starts a fresh local Supabase stack on the GitHub runner with the repository schema and migration. It creates two real Auth accounts and another private project. It checks task writes through the UI and reload after cache removal, cross-project read/write/update/delete denial, anonymous denial, audit author spoofing and audit immutability. No team credentials or GitHub secrets are needed.

See `.github/workflows/testing-phase.yml` for the exact setup commands. To run locally, Docker, Supabase CLI 2.84.2, OpenSSL, and Chrome are required. Copy the workflow's disposable stack, schema, status-file and certificate steps, start the preview, then run `npm run test:cloud`. The harness refuses non-loopback database targets. Never upload `.supabase-test.json`, certificates, keys, or the generated `supabase` folder. Stop with `supabase stop --no-backup` after the run.

The browser-facing endpoint uses TLS 1.3 and a one-day self-signed test certificate. Only the isolated browser context accepts that certificate; application HTTPS checks remain enabled. This demonstrates encrypted requests in the test environment, not trust/configuration of a hosted deployment. The service key stays in Node and is not written to reports or browser storage.

## Four required reports

CI downloads machine evidence from all three jobs, runs `npm run test:reports`, enforces the utility coverage target and records failures or missing evidence as a nonzero result. Download **four-test-reports** from the workflow run. The four Markdown deliverables and their JSON/JUnit evidence are under `docs/test-reports/latest` when generated locally. On PR #107, a separate job saves only the four reports and allowlisted numeric evidence to this PR branch after all tests pass. Detailed raw JSON/JUnit results remain in the downloadable artifact. The same application/test input hash prevents repeated report commits. On other branches, copy the four reports from the artifact into a documentation PR; keep the tested revision intact.

The full coverage HTML can be regenerated with `npm run test:coverage`; the workflow keeps JSON totals and the HTML entry separately. The older reports/PDFs are historic submissions, not current evidence.

## Human completion items

- Darshan reviews and merges the open feature/fix/testing PRs after checks pass, then reruns this workflow on final main.
- Review the SRS/SAD/STP and traceability against final merged behavior; document deviations rather than changing requirements silently.
- Check the existing recordings in `docs/demo/` against the final merged product and the required one-minute Sprint 1/two-minute Sprint 2 lengths; update them only if they no longer match.
- Review/sign off the final Test Summary Report. A script cannot supply a human approval.
- If the product will be hosted, verify that deployment's certificate, configuration and RLS separately; isolated results do not certify a particular hosted database.
