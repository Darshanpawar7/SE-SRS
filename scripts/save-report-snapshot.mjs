// Save the four requested reports to this PR, without publishing raw logs or credentials.
// Only a green report job can invoke this step. Detailed raw results stay in Actions artifacts.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const source = 'test-results/validated-reports';
const target = 'docs/test-reports/latest';
const manifest = JSON.parse(readFileSync(join(source, 'evidence/manifest.json'), 'utf8'));
const old = join(target, 'evidence/manifest.json');
if (existsSync(old) && JSON.parse(readFileSync(old, 'utf8')).inputSha256 === manifest.inputSha256) {
  console.log('The committed reports already cover these exact application/test inputs.');
  process.exit(0);
}
mkdirSync(join(target, 'evidence'), { recursive: true });
for (const name of ['README.md','UNIT_TEST_REPORT.md','SYSTEM_VALIDATION_REPORT.md','CODE_COVERAGE_REPORT.md','BRANCH_COVERAGE_REPORT.md']) {
  copyFileSync(join(source, name), join(target, name));
}
// Allowlisted public provenance and numeric coverage only; no raw requests, headers,
// tokens, environment dumps, unit fixtures, XML or free-form exception payloads.
writeFileSync(join(target, 'evidence/manifest.json'), JSON.stringify({
  commit: manifest.commit, inputSha256: manifest.inputSha256, startedAt: manifest.startedAt,
  finishedAt: manifest.finishedAt, node: manifest.node, platform: manifest.platform,
  workflowRun: process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY + '/actions/runs/' + process.env.GITHUB_RUN_ID
}, null, 2));
copyFileSync(join(source, 'evidence/coverage-summary.json'), join(target, 'evidence/coverage-summary.json'));
const unit = JSON.parse(readFileSync(join(source, 'evidence/unit.json'), 'utf8'));
const system = JSON.parse(readFileSync(join(source, 'evidence/system-validation-results.json'), 'utf8'));
const cloud = JSON.parse(readFileSync(join(source, 'evidence/isolated-cloud-results.json'), 'utf8'));
const session = JSON.parse(readFileSync(join(source, 'evidence/cloud-session-results.json'), 'utf8'));
writeFileSync(join(target, 'evidence/execution-summary.json'), JSON.stringify({
  unit: { total: unit.numTotalTests, passed: unit.numPassedTests, failed: unit.numFailedTests, pending: unit.numPendingTests },
  system: { summary: system.summary, cases: system.results.map(r => ({ id: r.id, status: r.status, browser: r.browser, compat: Boolean(r.compat) })) },
  cloud: { summary: cloud.summary, cases: cloud.results.map(r => ({id: r.id, status: r.status})) },
  simulatedSession: { passed: session.results.filter(r => r.ok).length, total: session.results.length }
}, null, 2));
execFileSync('git', ['add', '--', target]);
if (!execFileSync('git', ['diff', '--cached', '--name-only'], {encoding: 'utf8'}).trim()) process.exit(0);
execFileSync('git', ['-c', 'user.name=Eshwar', '-c', 'user.email=204132741+0-soul-slayer-0@users.noreply.github.com', 'commit', '-m', 'docs: record measured Sprint 1-2 testing results'], {stdio: 'inherit'});
// Ordinary non-force push: a concurrent branch change must reject publication.
execFileSync('git', ['push', 'origin', 'HEAD:refs/heads/test/eshwar-testing-phase'], {stdio: 'inherit'});
