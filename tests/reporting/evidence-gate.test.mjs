import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const ids = ["TC-AUTH-01","TC-PROJ-01","TC-TASK-01","TC-TASK-02","TC-TASK-03","TC-LABEL-01","TC-KAN-01","TC-KAN-02","TC-KAN-03","TC-KAN-04","TC-FILT-01","TC-EST-01","TC-EST-02","TC-SPR-01","TC-BURN-01","TC-DASH-01","TC-WORK-01","TC-DOCS-01","TC-OFF-01","TC-SET-01","TC-LOG-01","TC-PERF-01","TC-AVAIL-01","TC-SEC-01","TC-LOAD-01","TC-RECOV-01","SEC-XSS","SEC-TOKEN","SEC-FUZZ","TC-SUPA-01","SEC-RLS","SEC-KEYS","TC-COMPAT-01"];
function fixture(change = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'sprintflow-report-fixture-'));
  const stats = { total: 100, covered: 90, pct: 90 };
  const metrics = { lines: {...stats}, statements: {...stats}, functions: {...stats}, branches: {...stats} };
  const files = {
    'test-results/unit/unit.json': {numTotalTests: 2, numPassedTests: 2, numFailedTests: 0, numPendingTests: 0, testResults: []},
    'test-results/unit/coverage.json': {numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0, testResults: []},
    'test-results/unit/manifest.json': {commit: 'abc123456', node: 'synthetic', platform: 'fixture', inputSha256: 'fixture', finishedAt: 'fixture', runs: [{exitCode: 0}]},
    'coverage/coverage-summary.json': {total: metrics, '/fixture/src/utils/example.js': structuredClone(metrics)},
    'test-results/system/system-validation-results.json': {commit: 'abc1234', browsers: ['chrome', 'edge', 'firefox'], summary: {passed: 29, failed: 0, blocked: 4}, results: ids.map(id => ({id, title: id, status: ['TC-SUPA-01','TC-SET-01','TC-SEC-01','SEC-RLS'].includes(id) ? 'blocked' : 'pass', checks: [], notes: []}))},
    'test-results/isolated-cloud/isolated-cloud-results.json': {commit: 'abc123456', summary: {passed: 7, failed: 0}, results: ['TC-SUPA-01','TC-SET-01','TC-SEC-01','SEC-RLS','SEC-AUDIT','CLOUD-RECOVERY','SEC-EXPIRED'].map(id => ({id, status: 'pass', detail: 'Synthetic fixture'}))},
    'test-results/cloud-session/cloud-session-results.json': {results: Array.from({length: 4}, () => ({ok: true, detail: 'Synthetic fixture'}))}
  };
  for (const browser of ['chrome', 'edge', 'firefox']) for (const id of ['TC-KAN-01', 'TC-KAN-02', 'TC-TASK-01']) files['test-results/system/system-validation-results.json'].results.push({id, browser, compat: true, status: 'pass', checks: [], notes: []});
  change(files);
  for (const [file, content] of Object.entries(files)) { mkdirSync(dirname(join(root, file)), {recursive: true}); writeFileSync(join(root, file), JSON.stringify(content)); }
  mkdirSync(join(root, 'test-results/unit'), {recursive: true});
  writeFileSync(join(root, 'test-results/unit/unit.xml'), '<fixture/>');
  return root;
}
function run(change) {
  const root = fixture(change);
  const out = join(root, 'reports');
  try {
    const result = spawnSync(process.execPath, [resolve('scripts/generate-test-reports.mjs')], {env: {...process.env, INPUT_DIR: root, REPORT_DIR: out}, encoding: 'utf8'});
    return {status: result.status, report: (() => {try{return readFileSync(join(out, 'SYSTEM_VALIDATION_REPORT.md'), 'utf8')}catch{return ''}})()};
  } finally { rmSync(root, {recursive: true, force: true}); }
}
test('complete evidence generates all four reports', () => assert.equal(run().status, 0));
test('a missing native browser case fails the reporting gate', () => assert.notEqual(run(f => f['test-results/system/system-validation-results.json'].results.pop()).status, 0));
test('cloud failure cannot replace a blocked acceptance case with PASS', () => {
  const r = run(f => { f['test-results/isolated-cloud/isolated-cloud-results.json'].results[0].status = 'fail'; f['test-results/isolated-cloud/isolated-cloud-results.json'].summary.failed = 1; });
  assert.notEqual(r.status, 0); assert.match(r.report, /INCOMPLETE/);
});
test('results from different source revisions fail', () => assert.notEqual(run(f => { f['test-results/isolated-cloud/isolated-cloud-results.json'].commit = 'different'; }).status, 0));
test('coverage below the STP floor fails', () => assert.notEqual(run(f => { f['coverage/coverage-summary.json']['/fixture/src/utils/example.js'].lines.covered = 79; }).status, 0));
test('missing raw unit evidence fails rather than generating an all-clear', () => assert.notEqual(run(f => { delete f['test-results/unit/unit.json']; }).status, 0));
test('missing session failure checks fail the gate', () => assert.notEqual(run(f => { f['test-results/cloud-session/cloud-session-results.json'].results.pop(); }).status, 0));

test('empty coverage cannot masquerade as 100 percent coverage', () => assert.notEqual(run(f => { delete f['coverage/coverage-summary.json']['/fixture/src/utils/example.js']; }).status, 0));
test('declaring Firefox without executing its compatibility cases fails', () => assert.notEqual(run(f => { f['test-results/system/system-validation-results.json'].results = f['test-results/system/system-validation-results.json'].results.filter(r => !(r.compat && r.browser === 'firefox')); }).status, 0));
