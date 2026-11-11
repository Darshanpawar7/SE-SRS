// Reproducible unit evidence. The unchanged 50 ms benchmark runs without V8 instrumentation.
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const out = process.env.EVIDENCE_DIR || 'test-results/unit';
mkdirSync(out, { recursive: true });
const startedAt = new Date().toISOString();
const runs = [];
for (const [name, args] of [
  ['unit', ['run']],
  ['coverage', ['run', '--coverage', '--exclude', 'src/tests/kanbanPerformance.test.jsx']]
]) {
  const command = ['node_modules/vitest/vitest.mjs', ...args, '--reporter=default', '--reporter=json', '--reporter=junit', `--outputFile.json=${out}/${name}.json`, `--outputFile.junit=${out}/${name}.xml`];
  const result = spawnSync(process.execPath, command, { stdio: 'inherit' });
  runs.push({ name, command: ['node', ...command].join(' '), exitCode: result.status ?? 1 });
}
// Hash the exact application and test inputs. Report-only commits do not change this hash.
const hash = createHash('sha256');
const walk = dir => readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
for (const file of [...walk('src'), ...walk('tests'), ...walk('scripts'), ...walk('database'), 'package.json', 'package-lock.json', 'vite.config.js'].sort()) hash.update(file).update('\0').update(readFileSync(file)).update('\0');
let commit = 'unavailable (archive checkout)';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* ZIP users have no git metadata. */ }
const manifest = { startedAt, finishedAt: new Date().toISOString(), commit, inputSha256: hash.digest('hex'), node: process.version, platform: process.platform, runs };
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
process.exitCode = runs.some(run => run.exitCode !== 0) ? 1 : 0;
