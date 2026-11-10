// REAL disposable Supabase Auth/PostgreSQL tests; no production target is accepted.
// Start the isolated stack as documented in docs/TESTING_PHASE.md. Service key stays in Node.
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'node:https';
import { request } from 'node:http';
import { connect } from 'node:tls';
import { randomUUID, createHmac } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const out = 'test-results/isolated-cloud';
mkdirSync(out, { recursive: true });
const startedAt = new Date().toISOString();
const results = [];
const config = JSON.parse(readFileSync('.supabase-test.json', 'utf8'));
const api = new URL(config.API_URL);
if (api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname)) throw new Error('Only the disposable loopback Supabase stack is allowed.');
const serviceKey = config.SERVICE_ROLE_KEY;
const anonKey = config.ANON_KEY;
if (!serviceKey || !anonKey) throw new Error('Missing disposable stack keys.');
const admin = createClient(api.href, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const publicClient = () => createClient(api.href, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const password = `Test-only-${randomUUID()}!`;
const project = '11111111-1111-1111-1111-111111111111';
const foreign = randomUUID();
const assert = (value, message) => { if (!value) throw new Error(message); };
const requireOk = response => { assert(!response.error, response.error?.message || 'Request failed'); return response.data; };
const run = async (id, title, body) => {
  const start = Date.now();
  try { const detail = await body(); results.push({ id, title, status: 'pass', detail: detail || 'All assertions passed', durationMs: Date.now() - start }); }
  catch (error) { // Only assertion/error messages are recorded; never tokens, request headers or credentials.
    results.push({ id, title, status: 'fail', detail: String(error.message).replaceAll(serviceKey, '[REDACTED]').replaceAll(anonKey, '[PUBLIC KEY]').replaceAll(password, '[TEST PASSWORD]'), durationMs: Date.now() - start });
  }
  console.log(`${results.at(-1).status.toUpperCase()} ${id}: ${results.at(-1).detail}`);
};

let server, browser;
try {
  for (const email of ['darshan@pes.edu', 'qa-outsider@example.test']) requireOk(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
  requireOk(await admin.from('profiles').insert({ user_id: 'qa-outsider', full_name: 'QA Outsider', email: 'qa-outsider@example.test' }));
  requireOk(await admin.from('projects').insert({ id: foreign, name: 'Other private project', key: 'QA-PRIVATE', owner_id: 'qa-outsider' }));
  const lead = publicClient();
  const outsider = publicClient();
  requireOk(await lead.auth.signInWithPassword({ email: 'darshan@pes.edu', password }));
  requireOk(await outsider.auth.signInWithPassword({ email: 'qa-outsider@example.test', password }));
  const privateTask = requireOk(await admin.from('tasks').insert({ project_id: foreign, title: 'Private task' }).select().single());

  await run('SEC-RLS', 'Cross-project read, insert, update and delete enforcement', async () => {
    assert(requireOk(await lead.from('projects').select('*').eq('id', foreign)).length === 0, 'Foreign project leaked');
    assert(requireOk(await lead.from('tasks').select('*').eq('id', privateTask.id)).length === 0, 'Foreign task leaked');
    assert((await lead.from('tasks').insert({ project_id: foreign, title: 'Forbidden insert' })).error, 'Foreign insert accepted');
    assert(requireOk(await lead.from('tasks').update({ title: 'Forbidden edit' }).eq('id', privateTask.id).select()).length === 0, 'Foreign update accepted');
    assert(requireOk(await lead.from('tasks').delete().eq('id', privateTask.id).select()).length === 0, 'Foreign delete accepted');
    assert(requireOk(await admin.from('tasks').select('title').eq('id', privateTask.id).single()).title === 'Private task', 'Private row changed');
    assert(requireOk(await outsider.from('tasks').select('*').eq('project_id', project)).length === 0, 'Second account saw team data');
    assert((await publicClient().from('tasks').select('*')).error, 'Anonymous table read accepted');
    return 'Two real Auth accounts; foreign reads return zero rows, insert denied, update/delete affect zero rows; private row unchanged; anonymous read denied.';
  });
  await run('SEC-EXPIRED', 'Real Auth and REST reject correctly signed expired JWTs', async () => {
    assert(config.JWT_SECRET, 'Disposable JWT signing secret unavailable');
    const session = requireOk(await lead.auth.getSession()).session;
    const parts = session.access_token.split('.');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.iat = Math.floor(Date.now() / 1000) - 7200;
    payload.exp = Math.floor(Date.now() / 1000) - 3600;
    const unsigned = header + '.' + Buffer.from(JSON.stringify(payload)).toString('base64url');
    const expired = unsigned + '.' + createHmac('sha256', config.JWT_SECRET).update(unsigned).digest('base64url');
    for (const endpoint of ['auth/v1/user', 'rest/v1/tasks?select=id']) {
      const response = await fetch(new URL(endpoint, api), { headers: { apikey: anonKey, Authorization: 'Bearer ' + expired } });
      const message = await response.text();
      assert([401, 403].includes(response.status) && /expir/i.test(message), 'Expired token was not explicitly rejected by ' + endpoint.split('?')[0] + ' (HTTP ' + response.status + '): ' + message.slice(0, 300));
    }
    const invalid = await fetch(new URL('rest/v1/tasks?select=id', api), { headers: { apikey: anonKey, Authorization: 'Bearer invalid-token' } });
    assert(invalid.status === 401, 'Malformed token accepted');
    return 'A real session token was re-signed with the disposable stack secret and an expired timestamp; Auth and REST both returned authentication-denial expiry errors. Malformed token also returned 401.';
  });
  await run('SEC-AUDIT', 'Audit spoofing and history mutation rejected', async () => {
    const entry = { project_id: project, user_name: 'Darshan P Pawar', action: 'CREATE', entity_type: 'task', entity_title: 'QA audit', details: 'Isolated test' };
    const log = requireOk(await lead.from('activity_logs').insert(entry).select().single());
    assert((await lead.from('activity_logs').insert({ ...entry, user_name: 'QA Outsider' })).error, 'Spoofed author accepted');
    assert((await lead.from('activity_logs').update({ details: 'changed' }).eq('id', log.id)).error, 'Audit update accepted');
    assert((await lead.from('activity_logs').delete().eq('id', log.id)).error, 'Audit delete accepted');
    assert(requireOk(await admin.from('activity_logs').select('details').eq('id', log.id).single()).details === entry.details, 'Audit history changed');
  });

  // Local-only TLS termination: no application validation is weakened. Loopback upstream
  // is disposable HTTP; browser-facing transport is TLS 1.3 with a one-day test certificate.
  server = createServer({ key: readFileSync('/tmp/sf-test.key'), cert: readFileSync('/tmp/sf-test.crt'), minVersion: 'TLSv1.3' }, (req, res) => {
    const upstream = request(new URL(req.url, api), { method: req.method, headers: { ...req.headers, host: api.host } }, response => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(502); res.end('Test upstream unavailable'); });
    req.pipe(upstream);
  });
  await new Promise(resolve => server.listen(54433, '127.0.0.1', resolve));
  const tlsUrl = 'https://127.0.0.1:54433';
  let protocol;
  await new Promise((resolve, reject) => {
    const socket = connect({ host: '127.0.0.1', port: 54433, rejectUnauthorized: false }, () => { protocol = socket.getProtocol(); socket.end(); resolve(); });
    socket.on('error', reject);
  });
  browser = await chromium.launch({ channel: 'chrome' });
  // The only trust exception is this disposable self-signed loopback certificate.
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('dialog', dialog => dialog.accept());
  const requests = [];
  page.on('request', req => { if (req.url().startsWith(tlsUrl)) requests.push(req.url()); });
  const signIn = async passwordValue => {
    await page.getByRole('heading', { name: 'Sign in' }).waitFor();
    await page.getByLabel('Darshan P Pawar').check();
    await page.getByLabel('Password').fill(passwordValue);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.locator('.user-name').waitFor();
  };
  await page.goto(process.env.BASE_URL || 'http://localhost:4173/');
  await signIn('PES2UG24CS143');
  await run('TC-SET-01', 'Settings switches from demo to real Supabase Auth', async () => {
    await page.getByRole('button', { name: 'Connections', exact: true }).click();
    await page.getByLabel('Supabase Project URL').fill(tlsUrl);
    await page.getByLabel('Supabase Anon Public API Key').fill(anonKey);
    await page.getByRole('button', { name: 'Save & Connect' }).click();
    await signIn(password);
    await page.waitForFunction(() => document.querySelectorAll('.task-card').length > 0);
    assert(await page.evaluate(url => localStorage.getItem('supabase_url') === url, tlsUrl), 'Configuration was not retained');
    assert(/Supabase|Synced|Live|Cloud/.test(await page.locator('.status-pill').innerText()), 'Cloud connection indicator did not update');
    await page.getByRole('button', { name: 'Connections', exact: true }).click();
    const settings = page.getByRole('dialog');
    await settings.getByLabel('Supabase Project URL').fill('not-a-url');
    await settings.getByRole('button', { name: 'Save & Connect' }).click();
    await settings.getByRole('alert').waitFor();
    assert(await page.evaluate(url => localStorage.getItem('supabase_url') === url, tlsUrl), 'Malformed URL replaced the working cloud configuration');
    await settings.getByRole('button', { name: 'Close settings dialog' }).click();
    return 'Saved valid HTTPS configuration, indicator updated, real Auth sign-in passed, malformed replacement rejected and working cloud configuration retained.';
  });
  const title = `QA cloud persistence ${Date.now()}`;
  await run('TC-SUPA-01', 'UI task write survives a clean browser cache and reload', async () => {
    await page.getByRole('button', { name: 'New Task', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Task Title').fill(title);
    await dialog.getByRole('button', { name: 'Create Task', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    let row;
    for (let i = 0; i < 40; i++) {
      row = requireOk(await admin.from('tasks').select('*').eq('title', title));
      if (row.length === 1) break;
      await page.waitForTimeout(250);
    }
    assert(row?.length === 1 && row[0].project_id === project, 'UI-created task not persisted to PostgreSQL');
    await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('sprintflow_') && !key.includes('session')) localStorage.removeItem(key); });
    await page.reload();
    // Local profile may need restoring if the project cache reset also removed it.
    if (await page.getByRole('heading', { name: 'Sign in' }).count()) await signIn(password);
    await page.locator('.task-title', { hasText: title }).waitFor();
    await page.screenshot({ path: `${out}/persisted-cloud-task.png` });
    return 'Task created through React UI, independently read from PostgreSQL, then loaded again after clearing application caches.';
  });
  await run('CLOUD-RECOVERY', 'Offline task is retained and replays to PostgreSQL on reconnect', async () => {
    const offlineTitle = 'QA offline recovery ' + Date.now();
    await context.setOffline(true);
    await page.getByRole('button', { name: 'New Task', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Task Title').fill(offlineTitle);
    await dialog.getByRole('button', { name: 'Create Task', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    await page.locator('.task-title', { hasText: offlineTitle }).waitFor();
    assert(requireOk(await admin.from('tasks').select('id').eq('title', offlineTitle)).length === 0, 'Task reached the database while the browser was offline');
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    let rows = [];
    for (let i = 0; i < 80; i++) {
      rows = requireOk(await admin.from('tasks').select('id').eq('title', offlineTitle));
      if (rows.length) break;
      await page.waitForTimeout(250);
    }
    assert(rows.length === 1, 'Queued offline task did not replay to PostgreSQL');
    await page.reload();
    await page.locator('.task-title', { hasText: offlineTitle }).waitFor();
    return 'Browser was genuinely offline; task remained visible locally, database had no row until reconnect, then exactly one persisted row survived reload.';
  });
  await run('TC-SEC-01', 'HTTPS transport and URL credential hygiene', async () => {
    assert(protocol === 'TLSv1.3', 'TLS 1.3 was not negotiated');
    assert(requests.some(url => url.includes('/auth/v1/')) && requests.some(url => url.includes('/rest/v1/')), 'Auth and REST requests were not exercised');
    assert(requests.every(url => url.startsWith('https://') && !url.includes(anonKey) && !url.includes(password) && !url.includes('access_token=')), 'Sensitive value in a URL');
    return `${protocol}; real Auth and REST over HTTPS; no password, API key or access_token in recorded URLs. Self-signed test certificate; hosted deployment trust remains a separate check.`;
  });
  await context.close();
} catch (error) {
  results.push({ id: 'CLOUD-SETUP', title: 'Disposable stack and browser setup', status: 'fail', detail: String(error.message).replaceAll(serviceKey, '[REDACTED]').replaceAll(anonKey, '[PUBLIC KEY]').replaceAll(password, '[TEST PASSWORD]') });
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  let commit = 'unknown';
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* ZIP checkout */ }
  const summary = { total: results.length, passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length };
  writeFileSync(`${out}/isolated-cloud-results.json`, JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), commit, environment: 'Disposable local Supabase Auth/PostgreSQL; self-signed TLS 1.3 proxy; no hosted project', summary, results }, null, 2));
  process.exitCode = summary.failed || summary.passed !== 7 ? 1 : 0;
}
