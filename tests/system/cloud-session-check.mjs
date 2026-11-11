// TC-SESS-01 (supplementary): a signed-in cloud member keeps an open task draft through a
// network failure, and is signed out only when Supabase rejects the session.
//
// Runs against a simulated Supabase server: Playwright answers the app's Supabase requests,
// so no real database is used. Build and serve the app first (npm run build && npm run preview).
//
//   node tests/system/cloud-session-check.mjs
//
// Environment: BASE_URL (default http://localhost:4173/), OUT_DIR (default test-results/cloud-session).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://localhost:4173/';
const outDir = process.env.OUT_DIR || 'test-results/cloud-session';
const label = 'TC-SESS-01';
mkdirSync(outDir, { recursive: true });
const SUPABASE = 'https://sftest.supabase.co';
const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const user = { id: 'uid-darshan', aud: 'authenticated', role: 'authenticated', email: 'darshan@pes.edu' };
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
const accessToken = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt })}.c2ln`;
let userEndpoint = 'ok';
const userCalls = [];

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(([url]) => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', 'sb_publishable_sftest_key');
}, [SUPABASE]);
await context.route(`${SUPABASE}/auth/v1/**`, route => {
  const url = route.request().url();
  if (url.includes('/token')) {
    return route.fulfill({ json: { access_token: accessToken, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, refresh_token: 'refresh-1', user } });
  }
  if (/\/user(\?|$)/.test(url)) {
    userCalls.push(userEndpoint);
    if (userEndpoint === 'network') return route.abort('internetdisconnected');
    if (userEndpoint === 'rejected') return route.fulfill({ status: 401, json: { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT: token is expired' } });
    return route.fulfill({ json: user });
  }
  if (url.includes('/logout')) return route.fulfill({ status: 204, body: '' });
  return route.fulfill({ json: {} });
});
await context.route(`${SUPABASE}/rest/v1/**`, route =>
  route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fulfill({ status: 201, json: [] }));

const page = await context.newPage();
page.setDefaultTimeout(15000);
const focusTab = () => page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
const signedOut = async () => (await page.getByRole('heading', { name: 'Sign in' }).count()) > 0;
const results = [];
const record = (step, ok, detail) => { results.push({ step, ok, detail }); console.log(`${label} | ${ok ? 'PASS' : 'FAIL'} | ${step} | ${detail}`); };

await page.goto(baseUrl);
await page.getByRole('heading', { name: 'Sign in' }).waitFor();
await page.getByLabel('Email').fill(user.email);
await page.getByLabel('Password').fill('cloud-password');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.locator('.user-name').waitFor();
record('Signed in to the (fake) cloud project', true, (await page.locator('header.app-navbar').innerText()).replace(/\s+/g, ' ').match(/Darshan[^|]{0,40}/)?.[0] ?? 'signed in');

await page.getByRole('button', { name: 'New Task' }).click();
const draft = 'Draft typed before a network blip';
await page.getByRole('dialog').getByLabel('Task Title').fill(draft);

userEndpoint = 'network';
await focusTab();
await page.waitForTimeout(2500);
const blipHappened = userCalls.includes('network');
const keptAfterBlip = blipHappened && !(await signedOut()) && (await page.getByRole('dialog').count()) === 1
  && (await page.getByRole('dialog').getByLabel('Task Title').inputValue()) === draft;
record('Network blip while editing: user and draft kept', keptAfterBlip,
  !blipHappened ? 'NOT EXERCISED: no failed session check happened' : keptAfterBlip ? 'still signed in, dialog open with the typed title' : (await signedOut()) ? 'sent to the sign-in page, draft lost' : 'draft changed');
await page.screenshot({ path: join(outDir, `${label}-after-blip.png`) });

if (keptAfterBlip) {
  userEndpoint = 'ok';
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForTimeout(1500);
  record('Connection back: session re-checked, still signed in', !(await signedOut()), `${userCalls.filter(c => c === 'ok').length} successful checks so far`);

  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  userEndpoint = 'rejected';
  await focusTab();
  await page.waitForTimeout(2500);
  const out = await signedOut();
  const message = out ? (await page.locator('[role=alert]').allInnerTexts()).join(' ') : '';
  const rejectedHappened = userCalls.includes('rejected');
  record('Session rejected by Supabase (401): signed out with a message', rejectedHappened && out && /session has ended/.test(message), !rejectedHappened ? 'NOT EXERCISED: no rejected check happened' : out ? message : 'still signed in');
  await page.screenshot({ path: join(outDir, `${label}-after-401.png`) });
}
console.log(`${label} | user-endpoint calls: ${userCalls.join(', ')}`);
writeFileSync(join(outDir, 'cloud-session-results.json'), JSON.stringify({ id: label, environment: 'Real Chrome with simulated Supabase responses; not a database/RLS test', results }, null, 2));
await browser.close();
process.exitCode = results.every(r => r.ok) ? 0 : 1;
