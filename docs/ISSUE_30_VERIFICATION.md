# Issue 30 — Dependency security gate and remediation

PMS-SR-005. Threshold: HIGH and CRITICAL block. Run `npm run audit:security` (equivalent to `npm audit --audit-level=high`) for the entire dependency tree including dev dependencies. Registry/network failures also return nonzero; no `|| true`, allowlist or blanket exception. A dedicated dependency-audit.yml workflow runs the command on pushes and pull requests, and fails on its exit code. Issue 22 removes the old advisory duplicate and strengthens the remaining CI jobs. Each PR can be reviewed against main independently.

## Remediation, 2 November 2026

Baseline npm audit reported 14 vulnerable package entries: 9 moderate, 3 high, 2 critical. Upgrade Vite 5 to 7.3.7, Vitest 2 to 4.1.12, and the compatible React plugin to 5.2.0; refresh source-map-js to 1.2.2 and zod to 4.6.7. Vitest 4 removes the old tinypool/vite-node dependency path. The source-map-js and zod fixes are transitive lockfile updates. No forced incompatible transitive overrides or npm audit fix --force were used. Full test suite and production build are rerun for this migration.

Post-remediation audit: zero high and critical, seven moderate package entries, all in the development-only lint toolchain path through minimatch. These do not meet the blocking threshold. They remain visible in the included JSON report and should be revisited when compatible upstream fixes land; no exception for a blocking finding exists. Avoid processing untrusted arbitrary glob patterns through developer tools.

The existing project used `high` already; this PR documents that threshold explicitly rather than silently broadening it to critical. Changing it is a team review decision. New advisories can change results at any time; rerun before merging.

## Runtime and review

Use Node 24 LTS (`nvm use` reads .nvmrc), or Node 20.19+/22.12+ as declared in package.json. Vite 7 / plugin-react 5 need the newer minor versions; an arbitrary old Node 20 build is unsupported. CI setup-node 20 resolves its current patched minor. Run `npm ci`, `npm test`, `npm run lint`, `npm run build`, `npm run audit:security`. A clean npm ci verifies the lockfile.

See `docs/security/npm-audit-before.json` and `npm-audit-after.json` for machine-readable package paths and exact advisory URLs (GHSA-5xrq-8626-4rwp, GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr, GHSA-587h-7wmj-h5pm, GHSA-68fv-2mgg-jv7q, GHSA-mrhx-c7xc-m3w5). Reports count affected package entries, not distinct exploitable production vulnerabilities.

Sources: https://docs.npmjs.com/cli/commands/npm-audit/ ; https://v7.vite.dev/guide/migration ; https://v4.vitest.dev/guide/migration.html .
