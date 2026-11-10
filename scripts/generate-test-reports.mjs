// Generate the four deliverables ONLY from machine evidence, preserving blocked/failing checks.
import { readFileSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
const input = process.env.INPUT_DIR || '.';
const out = process.env.REPORT_DIR || 'docs/test-reports/latest';
const load = file => JSON.parse(readFileSync(join(input, file), 'utf8'));
const unit = load('test-results/unit/unit.json');
const instrumented = load('test-results/unit/coverage.json');
const manifest = load('test-results/unit/manifest.json');
const coverage = load('coverage/coverage-summary.json');
const system = load('test-results/system/system-validation-results.json');
const cloud = load('test-results/isolated-cloud/isolated-cloud-results.json');
const session = load('test-results/cloud-session/cloud-session-results.json');
mkdirSync(join(out, 'evidence'), { recursive: true });
for (const file of ['test-results/unit/unit.json', 'test-results/unit/unit.xml', 'test-results/unit/coverage.json', 'test-results/unit/manifest.json', 'coverage/coverage-summary.json', 'test-results/system/system-validation-results.json', 'test-results/isolated-cloud/isolated-cloud-results.json', 'test-results/cloud-session/cloud-session-results.json']) {
  copyFileSync(join(input, file), join(out, 'evidence', basename(file)));
}
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const table = (headers, rows) => `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.map(cell).join(' | ')} |`).join('\n')}\n`;
const fileRows = Object.entries(coverage).filter(([name]) => name !== 'total').map(([name, stats]) => [name.slice(name.lastIndexOf('/src/') + 1).replaceAll('\\', '/'), stats]);
const sum = (prefix, metric) => {
  const entries = fileRows.filter(([name]) => name.startsWith(prefix));
  const total = entries.reduce((n, [, stats]) => n + stats[metric].total, 0);
  const covered = entries.reduce((n, [, stats]) => n + stats[metric].covered, 0);
  return { total, covered, pct: total ? Math.floor(covered / total * 10000) / 100 : 100 };
};
const utils = sum('src/utils/', 'lines');
const allPass = manifest.runs.every(run => run.exitCode === 0) && unit.numFailedTests === 0 && unit.numPendingTests === 0 && instrumented.numFailedTests === 0;
const commitsMatch = [system.commit, cloud.commit].every(sha => manifest.commit.startsWith(sha));
const cloudMap = new Map(cloud.results.map(r => [r.id, r]));
const primary = system.results.filter(result => !result.compat).map(result => {
  const actual = cloudMap.get(result.id);
  return actual && result.status === 'blocked' ? { ...result, status: actual.status, notes: [actual.detail], isolated: true } : result;
});
const unresolved = primary.filter(result => result.status !== 'pass');
const expectedCloud = ['TC-SUPA-01', 'TC-SET-01', 'TC-SEC-01', 'SEC-RLS', 'SEC-AUDIT', 'CLOUD-RECOVERY'];
const completeCloud = expectedCloud.every(id => cloudMap.get(id)?.status === 'pass');
const requiredCases = ["TC-AUTH-01","TC-PROJ-01","TC-TASK-01","TC-TASK-02","TC-TASK-03","TC-LABEL-01","TC-KAN-01","TC-KAN-02","TC-KAN-03","TC-KAN-04","TC-FILT-01","TC-EST-01","TC-EST-02","TC-SPR-01","TC-BURN-01","TC-DASH-01","TC-WORK-01","TC-DOCS-01","TC-OFF-01","TC-SET-01","TC-LOG-01","TC-PERF-01","TC-AVAIL-01","TC-SEC-01","TC-LOAD-01","TC-RECOV-01","SEC-XSS","SEC-TOKEN","SEC-FUZZ","TC-SUPA-01","SEC-RLS","SEC-KEYS","TC-COMPAT-01"];
const completeSystem = requiredCases.every(id => primary.some(r => r.id === id)) && primary.length === 33 && new Set(primary.map(r => r.id)).size === 33 && ['chrome', 'edge', 'firefox'].every(name => system.browsers.includes(name));
const systemPass = commitsMatch && completeSystem && completeCloud && !unresolved.length && !cloud.summary.failed && session.results.length === 4 && session.results.every(r => r.ok);
const intro = title => `# ${title}\n\nSprintFlow · Team 11 · Sprint 1/2 testing phase\n\nGenerated from an actual run on **${manifest.finishedAt}**. Source commit: \`${manifest.commit}\`. Node: ${manifest.node}, ${manifest.platform}. Application/test input SHA-256: \`${manifest.inputSha256}\`.\n\nNumeric evidence and provenance are in [evidence](evidence/). Full raw JSON/JUnit evidence is retained in the four-test-reports Actions artifact. Original November 6 reports and submitted PDFs are historical snapshots; this report describes the revision above. Report-only commits can differ from this source revision.\n\n`;
const write = (name, text) => writeFileSync(join(out, name), text);
write('UNIT_TEST_REPORT.md', intro('Unit Test Report') +
  table(['Measure', 'Uninstrumented suite', 'Instrumented suite'], [
    ['Test cases', unit.numTotalTests, instrumented.numTotalTests], ['Passed', unit.numPassedTests, instrumented.numPassedTests], ['Failed', unit.numFailedTests, instrumented.numFailedTests], ['Pending/skipped', unit.numPendingTests, instrumented.numPendingTests], ['Test files', unit.testResults.length, instrumented.testResults.length]
  ]) + `\nVerdict: **${allPass ? 'PASS' : 'FAIL'}**. The full suite includes the unchanged Kanban p95 <50 ms benchmark. Coverage excludes only that timing test because instrumentation changes timing; the production code it imports remains in the coverage denominator. The timing result is not inferred from instrumented execution.\n\n` +
  table(['Test file', 'Passed', 'Failed', 'Pending'], unit.testResults.map(file => [file.name.split('/src/').at(-1), file.assertionResults.filter(r => r.status === 'passed').length, file.assertionResults.filter(r => r.status === 'failed').length, file.assertionResults.filter(r => !['passed', 'failed'].includes(r.status)).length])));
write('CODE_COVERAGE_REPORT.md', intro('Code Coverage Report') +
  'Method: Vitest V8, every `src/**/*.{js,jsx}` file including unimported modules; excludes test files and the Vite entry point (`src/main.jsx`) only. See `vite.config.js` and the unit manifest for exact commands.\n\n' +
  table(['Scope', 'Covered lines', 'Total lines', 'Line coverage', 'Statements', 'Functions'], ['src/utils/', 'src/services/', 'src/context/', 'src/components/', 'src/'].map(prefix => [prefix, sum(prefix, 'lines').covered, sum(prefix, 'lines').total, `${sum(prefix, 'lines').pct}%`, `${sum(prefix, 'statements').pct}%`, `${sum(prefix, 'functions').pct}%`])) +
  `\nSTP §14 utility code coverage target: **≥80%**. Measured utility line coverage: **${utils.pct}% — ${utils.pct >= 80 ? 'PASS' : 'FAIL'}**. This threshold is enforced by the report command/CI. Browser execution is reported separately and is not added to V8 unit coverage. Low UI/context coverage is visible here rather than omitted from the denominator.\n\n` +
  table(['Source file', 'Lines', 'Statements', 'Functions'], fileRows.map(([name, stats]) => [name, `${stats.lines.pct}%`, `${stats.statements.pct}%`, `${stats.functions.pct}%`])));
write('BRANCH_COVERAGE_REPORT.md', intro('Branch Coverage Report') +
  'Method: V8 branch outcomes reported by Vitest, aggregated by covered/total outcomes, not by averaging percentages. A line can be covered while an alternate condition is never exercised. No separate mandatory branch percentage is specified in the STP; no invented branch target is claimed.\n\n' +
  table(['Scope', 'Covered outcomes', 'Total outcomes', 'Branch coverage'], ['src/utils/', 'src/services/', 'src/context/', 'src/components/', 'src/'].map(prefix => [prefix, sum(prefix, 'branches').covered, sum(prefix, 'branches').total, `${sum(prefix, 'branches').pct}%`])) +
  '\nFiles with unexecuted outcomes, lowest coverage first:\n\n' +
  table(['Source file', 'Covered', 'Total', 'Branch coverage'], fileRows.filter(([, stats]) => stats.branches.covered < stats.branches.total).sort((a, b) => a[1].branches.pct - b[1].branches.pct).map(([name, stats]) => [name, stats.branches.covered, stats.branches.total, `${stats.branches.pct}%`])));
write('SYSTEM_VALIDATION_REPORT.md', intro('System Validation Report') +
  `Build served by Vite preview; actual Chrome, Edge and Firefox controlled by Playwright. Zero-configuration cases use clean contexts. Four initially blocked cases are supplemented only when the matching **real isolated Supabase Auth/PostgreSQL** case passes. No mocked response counts as database/RLS evidence.\n\nSource revisions agree: **${commitsMatch ? 'yes' : 'NO'}**. Browser suite: ${system.summary.passed} passed, ${system.summary.failed} failed, ${system.summary.blocked} blocked. Isolated database suite: ${cloud.summary.passed} passed, ${cloud.summary.failed} failed. Combined specified case results: ${primary.filter(r => r.status === 'pass').length}/${primary.length} passed, ${unresolved.length} unresolved.\n\nVerdict: **${systemPass ? 'PASS for automated acceptance on this isolated test environment' : 'INCOMPLETE / FAIL — inspect evidence below'}**. This is not hosted-production sign-off. STP exit also requires owner review, SRS/SAD approval and demo deliverables; those cannot be approved by a test script.\n\n` +
  table(['Case', 'SRS / plan', 'Result', 'Environment / evidence'], primary.map(result => [result.id, `${result.requirement} / ${result.plan}`, result.status, result.isolated ? `Real isolated Supabase: ${result.notes.join(' ')}` : `${result.browser}: ${result.blockedReason || result.checks.filter(c => !c.ok).map(c => c.actual).join('; ') || result.title}`])) +
  '\nAdditional security and compatibility evidence:\n\n' +
  table(['Check', 'Result', 'Detail'], [
    ...cloud.results.filter(r => !primary.some(p => p.id === r.id)).map(r => [r.id, r.status, r.detail]),
    ...session.results.map(r => [`TC-SESS-01: ${r.step}`, r.ok ? 'pass' : 'fail', `Real Chrome with simulated network/Auth responses: ${r.detail}`]),
    ...system.results.filter(r => r.compat).map(r => [`${r.id} (${r.browser})`, r.status, r.title])
  ]) + '\nTransport scope: the browser-facing disposable endpoint negotiates TLS 1.3; the test alone accepts its self-signed loopback certificate and proxies to the local stack over HTTP. Hosted certificate trust, hosted configuration and deployment-specific policies must be checked after deployment. No service key is sent to the browser.\n');
write('README.md', `# Current testing evidence\n\nSource: \`${manifest.commit}\`; executed ${manifest.finishedAt}.\n\n- [Unit Test Report](UNIT_TEST_REPORT.md)\n- [System Validation Report](SYSTEM_VALIDATION_REPORT.md)\n- [Code Coverage Report](CODE_COVERAGE_REPORT.md)\n- [Branch Coverage Report](BRANCH_COVERAGE_REPORT.md)\n\nRegenerate with the instructions in [TESTING_PHASE.md](../../TESTING_PHASE.md). Historical submitted PDFs remain in the parent folder.\n`);
console.log(`Reports written to ${out}; utility line coverage ${utils.pct}%; system ${systemPass ? 'pass' : 'incomplete/fail'}`);
if (!allPass || !systemPass || utils.pct < 80 || !existsSync(join(out, 'BRANCH_COVERAGE_REPORT.md'))) process.exitCode = 1;
