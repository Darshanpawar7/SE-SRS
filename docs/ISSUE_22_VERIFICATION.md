# Issue 22 — Blocking CI on pushes and pull requests

PMS-F-018 / TC-CICD-01. Three independent build/test/lint jobs run on every push and pull_request, including stacked PR bases, plus manual workflow_dispatch. Build, Vitest, lint, installation propagate nonzero exits. No install fallback, continue-on-error or audit suppression. Read-only token permissions, ten-minute job timeouts, and cancellation of superseded runs bound CI access and execution. Dependency security has its own blocking workflow in issue 30, auditing the committed lockfile without install scripts.

## Verify

Run `npm ci`, `npm test`, `npm run lint`, `npm run build`, and `npm audit --audit-level=high`. On GitHub open the Actions tab or PR Checks and confirm all three jobs and the separate dependency security check appear after issue 30 merges. Introduce a failing test or lint error on a disposable branch and observe a failing job; discard that commit. An outdated lockfile must fail npm ci rather than be regenerated.

The baseline lockfile has blocking vulnerabilities; issue 30 remediates these and replaces the advisory audit with a dedicated blocking workflow. Merge issue 30 first so there is no gap in audit coverage. Issue 35 strengthens lint to reject warnings. A workflow defines checks; a repository administrator must separately select required status checks in branch protection if merges must be prohibited. No branch-protection setting is claimed here, and hosted Actions execution is only verified after publication.
