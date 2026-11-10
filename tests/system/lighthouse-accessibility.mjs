// Measure SRS PMS-NF-003 with actual Lighthouse/Chrome, in local demo mode only.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const { default: lighthouse } = await import(pathToFileURL(process.env.LIGHTHOUSE_MODULE || '/tmp/sf-lighthouse/node_modules/lighthouse/core/index.js'));
const out = 'test-results/lighthouse';
mkdirSync(out, { recursive: true });
const context = await chromium.launchPersistentContext(out + '/profile', { channel: 'chrome', viewport: {width: 1440, height: 900}, args: ['--remote-debugging-port=9222'] });
const page = context.pages()[0];
const baseUrl = process.env.BASE_URL || 'http://localhost:4173/';
const views = [];
let commit = 'unknown';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(); } catch { /* ZIP checkout */ }
try {
  await page.goto(baseUrl);
  for (const name of ['Sign in', 'Board']) {
    if (name === 'Board') {
      await page.goto(baseUrl);
      await page.getByLabel('Darshan P Pawar').check();
      await page.getByLabel('Password').fill('PES2UG24CS143');
      await page.getByRole('button', {name: 'Sign in', exact: true}).click();
      await page.locator('.kanban-column').first().waitFor();
    }
    const result = await lighthouse(baseUrl, { port: 9222, onlyCategories: ['accessibility'], disableStorageReset: true, formFactor: 'desktop', screenEmulation: {disabled: true}, throttlingMethod: 'provided', output: ['json', 'html'], logLevel: 'error' });
    if (!result?.lhr || result.lhr.runtimeError) throw new Error(result?.lhr?.runtimeError?.message || 'Lighthouse did not produce a report');
    const slug = name === 'Board' ? 'board' : 'sign-in';
    writeFileSync(out + '/' + slug + '.json', result.report[0]);
    writeFileSync(out + '/' + slug + '.html', result.report[1]);
    const failedAudits = Object.values(result.lhr.audits).filter(a => a.score !== null && a.score < 1).map(a => ({id: a.id, title: a.title, nodes: a.details?.items?.flatMap(i => i.node ? [{selector: i.node.selector, explanation: i.node.explanation}] : []) || []}));
    const score = result.lhr.categories.accessibility.score;
    views.push({name, score, lighthouseVersion: result.lhr.lighthouseVersion, failedAudits});
    console.log('LIGHTHOUSE ' + name + ': ' + Math.round(score * 100) + '/100 ' + JSON.stringify(failedAudits));
  }
} finally {
  await context.close();
  writeFileSync(out + '/lighthouse-results.json', JSON.stringify({commit, executedAt: new Date().toISOString(), views, environment: 'Actual Chrome, Lighthouse 13.6.0, desktop 1440x900; local demo account'}, null, 2));
}
const fixedRules = ['landmark-one-main', 'heading-order', 'label-content-name-mismatch'];
process.exitCode = views.length === 2 && views.every(v => v.score > 0.9 && !v.failedAudits.some(a => fixedRules.includes(a.id))) ? 0 : 1;
