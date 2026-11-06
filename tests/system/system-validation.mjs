// System validation suite for SprintFlow.
//
// Executes the system test cases in docs/TEST_CASE_SPECIFICATION.md and the security
// checks in STP section 5.4 against a running production build, in real browsers.
//
//   npm run build && npm run preview          # serves http://localhost:4173/
//   npm run test:system                       # in a second terminal
//
// Environment:
//   BASE_URL   app under test (default http://localhost:4173/)
//   BROWSERS   comma-separated: chrome, edge, firefox (default: all three; TC-COMPAT-01 uses each)
//   OUT_DIR    where results JSON and screenshots go (default test-results/system)
//   DIST_DIR   built bundle scanned by SEC-KEYS (default dist)
//
// Firefox needs Playwright's build: npx playwright install firefox.
// Chrome and Edge use the locally installed browsers.
//
// The build must run with no Supabase credentials: every case here uses the zero-config
// (LocalStorage) mode, so no data is written to a real database. Cases whose precondition
// is a live Supabase project are recorded as blocked, not skipped silently.

import { chromium, firefox } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173/';
const OUT_DIR = process.env.OUT_DIR || 'test-results/system';
const DIST_DIR = process.env.DIST_DIR || 'dist';
const BROWSERS = (process.env.BROWSERS || 'chrome,edge,firefox').split(',').map(name => name.trim());
// Optional comma-separated case IDs, for re-running a few cases while debugging.
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(id => id.trim()) : null;
const PRIMARY = BROWSERS[0];

// Demo profile shipped with the seed data (src/utils/constants.js).
const LEAD = { name: 'Darshan P Pawar', password: 'PES2UG24CS143', firstName: 'Darshan', role: 'Team Lead' };
const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Code Review', 'Done'];
const FIBONACCI = ['1', '2', '3', '5', '8', '13', '21'];
const PERF_BUDGET_MS = 50;

mkdirSync(OUT_DIR, { recursive: true });

const launchers = {
  chrome: () => chromium.launch({ channel: 'chrome' }),
  edge: () => chromium.launch({ channel: 'msedge' }),
  firefox: () => firefox.launch()
};
const browsers = {};
async function getBrowser(name) {
  if (!browsers[name]) browsers[name] = await launchers[name]();
  return browsers[name];
}

// ---------------------------------------------------------------- page helpers

async function openApp(browserName) {
  const browser = await getBrowser(browserName);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto(BASE_URL);
  await signInAsLead(page);
  return { context, page, errors };
}

async function signInAsLead(page) {
  await page.getByRole('heading', { name: 'Sign in' }).waitFor();
  await page.getByLabel(LEAD.name).check();
  await page.getByLabel('Password').fill(LEAD.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.locator('.user-name').waitFor();
}

const column = (page, name) =>
  page.locator('.kanban-column', { has: page.locator('.column-name', { hasText: new RegExp(`^${name}$`) }) });
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactTitle = title => new RegExp(`^\\s*${escapeRegex(title)}\\s*$`);
// Matches the whole title, so "Task" never also matches "Task (copy)".
const card = (scope, title) => {
  const page = typeof scope.page === 'function' ? scope.page() : scope;
  return scope.locator('.task-card', { has: page.locator('.task-title', { hasText: exactTitle(title) }) });
};
const cardWith = (page, text) => page.locator('.task-card', { hasText: text });
const columnOf = async (page, title) => {
  for (const name of COLUMNS) if (await card(column(page, name), title).count()) return name;
  return null;
};
const columnCount = async (page, name) => Number(await column(page, name).locator('.column-count').innerText());

async function go(page, view) {
  await page.locator('aside').getByRole('button', { name: view, exact: true }).click();
  if (view === 'Board') await page.locator('.kanban-column').first().waitFor();
  await page.waitForTimeout(200);
}

async function selectOptionContaining(select, text) {
  const value = await select.locator('option', { hasText: text }).first().getAttribute('value');
  await select.selectOption(value);
}

async function fillTaskForm(dialog, task) {
  if (task.title !== undefined) await dialog.getByLabel('Task Title').fill(task.title);
  if (task.description) await dialog.getByLabel('Description').fill(task.description);
  if (task.status) await selectOptionContaining(dialog.getByLabel('Workflow Status'), task.status);
  if (task.priority) await selectOptionContaining(dialog.getByLabel('Priority', { exact: true }), task.priority);
  if (task.sprint) await selectOptionContaining(dialog.getByLabel('Sprint', { exact: true }), task.sprint);
  if (task.points) await dialog.getByRole('button', { name: task.points, exact: true }).click();
  if (task.assignee) await selectOptionContaining(dialog.getByLabel('Assignee'), task.assignee);
}

async function createTask(page, task) {
  await page.getByRole('button', { name: 'New Task' }).click();
  const dialog = page.getByRole('dialog');
  await fillTaskForm(dialog, task);
  await dialog.getByRole('button', { name: 'Create Task' }).click();
  await dialog.waitFor({ state: 'detached' });
}

async function editTask(page, title, changes) {
  await card(page, title).click();
  const dialog = page.getByRole('dialog');
  await fillTaskForm(dialog, changes);
  await dialog.getByRole('button', { name: 'Save Changes' }).click();
  await dialog.waitFor({ state: 'detached' });
}

async function deleteTask(page, title) {
  await card(page, title).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Delete Task' }).click();
  await dialog.waitFor({ state: 'detached' });
}

async function createSprint(page, { name, goal, start, end }) {
  await go(page, 'Sprints');
  await page.getByRole('button', { name: 'Create Sprint' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Sprint Name').fill(name);
  await dialog.getByLabel('Sprint Goal').fill(goal);
  await dialog.getByLabel('Start Date').fill(start);
  await dialog.getByLabel('End Date').fill(end);
  await dialog.getByRole('button', { name: 'Create Sprint' }).click();
  await dialog.waitFor({ state: 'detached' });
}

async function plannedPoints(page, sprintName) {
  await go(page, 'Sprints');
  const box = page.locator('.sprint-card', { hasText: sprintName }).locator('.metric-box', { hasText: 'Planned Points' });
  return Number((await box.innerText()).match(/\d+/)[0]);
}

const isoDay = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
const contentText = async page => (await page.locator('.app-content').innerText()).replace(/\s+/g, ' ');
const percentile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];

// Appends tasks straight to LocalStorage, cloned from a seeded task in the active sprint,
// then reloads. Faster than the dialog, and no "Saved" toast lands over a drop target.
async function seedTasks(page, count, prefix, statusOf) {
  // A first edit makes the app write its task list, which the seed then extends.
  await page.getByRole('button', { name: 'Advance Draft Formal IEEE 830 SRS Document to In Progress' }).click();
  await page.evaluate(({ count, prefix, statuses }) => {
    const tasks = JSON.parse(localStorage.getItem('sprintflow_tasks'));
    const template = tasks.find(task => task.title === 'Draft Formal IEEE 830 SRS Document');
    const extra = Array.from({ length: count }, (_, i) => ({
      ...template, id: `${prefix.toLowerCase().replace(/\W+/g, '-')}-${i}`, title: `${prefix} ${i}`, status: statuses[i], labels: ['seeded']
    }));
    localStorage.setItem('sprintflow_tasks', JSON.stringify([...tasks, ...extra]));
  }, { count, prefix, statuses: Array.from({ length: count }, (_, i) => statusOf(i)) });
  await page.reload();
  await page.waitForFunction(title => [...document.querySelectorAll('.task-title')].some(element => element.textContent.trim() === title), `${prefix} ${count - 1}`)
    .catch(() => { throw new Error(`Seeded task "${prefix} ${count - 1}" did not render after reload`); });
  const readyMs = await page.evaluate(() => performance.now());
  // Let the workspace finish its entry transition before the first drag starts.
  await page.waitForTimeout(600);
  return readyMs;
}

// Times one drop with the Performance API: from the drop event to the DOM commit that
// shows the card in its new column.
async function timedDrop(page, title, target) {
  await page.evaluate(({ title, target }) => {
    window.__sfDrop = { start: null, end: null };
    document.addEventListener('drop', () => {
      performance.mark('sf-drop');
      window.__sfDrop.start = performance.now();
    }, { capture: true, once: true });
    // Columns may be re-rendered, so look the target up again on every mutation.
    const arrived = () => {
      const targetColumn = [...document.querySelectorAll('.kanban-column')]
        .find(element => element.querySelector('.column-name')?.textContent.trim() === target);
      return Boolean(targetColumn) && [...targetColumn.querySelectorAll('.task-title')].some(element => element.textContent.trim() === title);
    };
    const observer = new MutationObserver(() => {
      if (window.__sfDrop.start !== null && arrived()) {
        window.__sfDrop.end = performance.now();
        performance.measure('sf-drop-to-render', 'sf-drop');
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }, { title, target });
  // Drop at the dragged card's height: browser automation cannot scroll mid-drag, and on
  // a long board the target column's centre is off-screen.
  const source = card(page, title);
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const targetBox = await column(page, target).boundingBox();
  const y = Math.min(Math.max(sourceBox.y + sourceBox.height / 2 - targetBox.y, 10), targetBox.height - 10);
  await source.dragTo(column(page, target), { targetPosition: { x: targetBox.width / 2, y } });
  await page.waitForFunction(() => window.__sfDrop.end !== null).catch(async () => {
    const state = await page.evaluate(() => JSON.stringify(window.__sfDrop));
    throw new Error(`Drop of "${title}" onto ${target} was not rendered (timing state ${state}, card now in ${await columnOf(page, title)})`);
  });
  return page.evaluate(() => window.__sfDrop.end - window.__sfDrop.start);
}

// ---------------------------------------------------------------- runner

const results = [];

async function runCase(meta, browserName, body) {
  const started = Date.now();
  const result = { ...meta, browser: browserName, status: 'pass', checks: [], notes: [], blockedReason: null };
  const check = (step, ok, actual) => result.checks.push({ step, ok: Boolean(ok), actual: String(actual) });
  const note = text => result.notes.push(text);
  const block = reason => { result.blockedReason = reason; };
  let session;
  try {
    session = await openApp(browserName);
    await body({ ...session, check, note, block, browserName });
    if (session.errors.length) check('No uncaught errors in the page', false, session.errors.join(' | '));
  } catch (error) {
    check('Steps executed without a test error', false, error.message.split('\n')[0]);
  }
  if (result.checks.some(entry => !entry.ok)) result.status = 'fail';
  else if (result.blockedReason) result.status = 'blocked';
  if (result.status === 'fail' && session) {
    const shot = `${meta.id}-${browserName}-failure.png`;
    await session.page.screenshot({ path: join(OUT_DIR, shot) }).catch(() => {});
    result.screenshot = shot;
  }
  await session?.context.close();
  result.durationMs = Date.now() - started;
  results.push(result);
  console.log(`${result.status.toUpperCase().padEnd(7)} ${meta.id.padEnd(13)} ${browserName.padEnd(7)} ${meta.title}`);
}

function recordBlocked(meta, reason) {
  results.push({ ...meta, browser: PRIMARY, status: 'blocked', checks: [], notes: [], blockedReason: reason, durationMs: 0 });
  console.log(`BLOCKED ${meta.id.padEnd(13)} ${PRIMARY.padEnd(7)} ${meta.title}`);
}

// ---------------------------------------------------------------- test cases

const caseKan01 = async ({ page, check }) => {
  const names = await page.locator('.kanban-column .column-name').allInnerTexts();
  check('Exactly five columns in lifecycle order', names.join('|') === COLUMNS.join('|'), names.join(', '));
  for (const name of COLUMNS) {
    const shown = await columnCount(page, name);
    const cards = await column(page, name).locator('.task-card').count();
    check(`${name} shows its task count`, shown === cards, `count badge ${shown}, cards ${cards}`);
  }
};

const caseKan02 = async ({ page, check }) => {
  const title = 'TC-KAN-02 drag candidate';
  await createTask(page, { title, status: 'Backlog' });
  const before = { backlog: await columnCount(page, 'Backlog'), progress: await columnCount(page, 'In Progress') };
  await card(page, title).dragTo(column(page, 'In Progress'));
  check('Card renders in In Progress on release', await columnOf(page, title) === 'In Progress', await columnOf(page, title));
  const after = { backlog: await columnCount(page, 'Backlog'), progress: await columnCount(page, 'In Progress') };
  check('Source column count decreases by one', after.backlog === before.backlog - 1, `${before.backlog} -> ${after.backlog}`);
  check('Target column count increases by one', after.progress === before.progress + 1, `${before.progress} -> ${after.progress}`);
  await page.reload();
  await page.locator('.kanban-column').first().waitFor();
  check('New state survives a refresh', await columnOf(page, title) === 'In Progress', await columnOf(page, title));
};

const caseTask01 = async ({ page, check, note }) => {
  const data = { title: 'Implement burndown chart', priority: 'High', points: '5', assignee: 'Dhatri' };
  await createTask(page, data);
  const landed = await columnOf(page, data.title);
  note(`With the default Workflow Status the card lands in "${landed}". SPRINT1_DEVIATIONS.md records that a new task starts in To Do unless another status is chosen; the specification text still says Backlog.`);
  const text = (await card(page, data.title).innerText()).replace(/\s+/g, ' ');
  check('Card shows the title', text.includes(data.title), text);
  check('Card shows a High priority badge', await card(page, data.title).locator('[data-priority="high"]', { hasText: 'High' }).count() === 1, text);
  check('Card shows a 5-point estimate', text.includes('5 SP'), text);
  check('Card shows the assignee', text.includes('Dhatri'), text);
  const backlogTitle = 'Implement burndown chart (Backlog)';
  await createTask(page, { ...data, title: backlogTitle, status: 'Backlog' });
  const firstInBacklog = (await column(page, 'Backlog').locator('.task-title').first().innerText()).trim();
  check('With Backlog chosen, the card appears at the top of the Backlog column', firstInBacklog === backlogTitle, firstInBacklog);
  await page.reload();
  await page.locator('.kanban-column').first().waitFor();
  check('Cards survive a page refresh', await card(page, data.title).count() === 1 && await card(page, backlogTitle).count() === 1, 'both present after reload');
};

const caseAuth01 = async ({ page, check }) => {
  const name = (await page.locator('.user-name').innerText()).trim();
  const role = (await page.locator('.user-role-tag').innerText()).trim();
  check('Navigation bar shows the profile name', name === LEAD.firstName, name);
  check('Navigation bar shows the role', role === LEAD.role, role);
  await page.reload();
  await page.locator('.user-name').waitFor();
  check('Session persists after refresh (no sign-in view)', await page.getByRole('heading', { name: 'Sign in' }).count() === 0, 'signed in after reload');
};

const caseTask02 = async ({ page, check }) => {
  const title = 'Setup GitHub Actions CI/CD Pipeline';
  await editTask(page, title, { priority: 'Critical' });
  const badge = card(page, title).locator('[data-priority="critical"]');
  const label = (await badge.innerText()).trim();
  check('Card shows a Critical badge', await badge.count() === 1, label);
  check('Badge carries a text label, not colour alone', label === 'Critical', label);
};

const caseTask03 = async ({ page, check }) => {
  const before = await page.locator('.task-card').count();
  await page.getByRole('button', { name: 'New Task' }).click();
  const dialog = page.getByRole('dialog');
  const title = dialog.getByLabel('Task Title');
  await dialog.getByRole('button', { name: 'Create Task' }).click();
  const nativeMessage = await title.evaluate(element => element.validationMessage);
  check('Empty title is rejected with a validation message', nativeMessage.length > 0 && await dialog.count() === 1, `browser validation: "${nativeMessage}"`);
  await title.fill(' ');
  await dialog.getByRole('button', { name: 'Create Task' }).click();
  const alert = dialog.getByRole('alert');
  const inline = (await alert.count()) ? (await alert.innerText()).trim() : '';
  const native = await title.evaluate(element => element.validationMessage);
  check('Single-space title is rejected with a validation message', (inline || native).length > 0 && await dialog.count() === 1,
    inline ? `inline message: "${inline}"` : `browser validation: "${native}"`);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  check('No task is created in either case', await page.locator('.task-card').count() === before, `${before} cards before and after`);
};

const caseKan03 = async ({ page, check }) => {
  const title = 'Draft Formal IEEE 830 SRS Document';
  check('Precondition: task is in To Do', await columnOf(page, title) === 'To Do', await columnOf(page, title));
  await page.getByRole('button', { name: `Advance ${title} to In Progress` }).click();
  check('Task moves to In Progress', await columnOf(page, title) === 'In Progress', await columnOf(page, title));
  const enabledInDone = await column(page, 'Done').getByRole('button', { name: /^Advance/ }).evaluateAll(
    buttons => buttons.filter(button => !button.disabled && button.getAttribute('aria-disabled') !== 'true').length);
  check('A task in Done cannot advance further', enabledInDone === 0, `${enabledInDone} enabled advance controls in Done`);
};

const caseKan04 = async ({ page, check }) => {
  const title = 'Build Agile Story Point Estimation Engine';
  const origin = await columnOf(page, title);
  await page.evaluate(() => {
    window.__sfDrag = { started: 0, dropped: 0 };
    document.addEventListener('dragstart', () => { window.__sfDrag.started += 1; }, true);
    document.addEventListener('drop', () => { window.__sfDrag.dropped += 1; }, true);
  });
  const box = await card(page, title).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + 20, { steps: 5 });
  await page.mouse.move(120, 620, { steps: 15 });
  await page.mouse.up();
  const drag = await page.evaluate(() => window.__sfDrag);
  check('A drag was actually started', drag.started === 1, `${drag.started} dragstart, ${drag.dropped} drop events`);
  check('Card returns to its original column', await columnOf(page, title) === origin, `${origin} -> ${await columnOf(page, title)}`);
  await page.reload();
  await page.locator('.kanban-column').first().waitFor();
  check('Status is unchanged after refresh', await columnOf(page, title) === origin, await columnOf(page, title));
};

const caseFilt01 = async ({ page, check }) => {
  await page.getByLabel('Filter by priority').selectOption('high');
  const badges = await page.locator('.task-card .priority-signal').evaluateAll(elements => elements.map(element => element.dataset.priority));
  check('Only High priority tasks are visible', badges.length > 0 && badges.every(priority => priority === 'high'), `${badges.length} visible: ${badges.join(', ')}`);
  await page.getByLabel('Search tasks, descriptions, or assignees').fill('no-such-task-xyz');
  const visible = await page.locator('.task-card').count();
  const text = await contentText(page);
  const explicitEmptyState = /no (tasks|work items) match|nothing matches|no results/i.test(text);
  const offersReset = await page.getByRole('button', { name: 'Reset Filters' }).count() === 1;
  check('No task matches the combined filters', visible === 0, `${visible} cards visible`);
  check('An explicit empty state names the active filters', explicitEmptyState,
    explicitEmptyState ? 'empty-state message shown' : 'five columns each show "Drop tasks here"; no message names the active filters');
  check('The empty state offers to clear the filters', offersReset, offersReset ? '"Reset Filters" button shown' : 'no reset control');
};

const caseEst01 = async ({ page, check }) => {
  const title = 'Setup GitHub Actions CI/CD Pipeline';
  const sprint = 'Sprint 1: Architecture & Core Workflow';
  const baseline = await plannedPoints(page, sprint);
  await go(page, 'Board');
  await card(page, title).click();
  const dialog = page.getByRole('dialog');
  const offered = await dialog.getByRole('button').evaluateAll(buttons => buttons.map(b => b.textContent.trim()).filter(t => /^\d+$/.test(t)));
  const numericInputs = await dialog.locator('input[type=number]').count();
  check('Only the seven Fibonacci values are offered', offered.join(',') === FIBONACCI.join(','), offered.join(', '));
  check('No free numeric estimate field exists', numericInputs === 0, `${numericInputs} numeric inputs`);
  const original = Number((await card(page, title).locator('.points-badge').innerText()).match(/\d+/)[0]);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  for (const value of FIBONACCI) {
    await editTask(page, title, { points: value });
    const shown = (await card(page, title).locator('.points-badge').innerText()).trim();
    check(`Estimate ${value} persists on the card`, shown === `${value} SP`, shown);
  }
  const after = await plannedPoints(page, sprint);
  check('The final estimate is reflected in sprint capacity', after === baseline - original + 21, `${baseline} -> ${after} (task ${original} -> 21)`);
};

const caseEst02 = async ({ page, check }) => {
  const sprint = 'TC-EST-02 capacity sprint';
  await createSprint(page, { name: sprint, goal: 'Capacity check', start: isoDay(0), end: isoDay(13) });
  check('Precondition: the new sprint has no tasks', await plannedPoints(page, sprint) === 0, await plannedPoints(page, sprint));
  await go(page, 'Board');
  for (const points of ['3', '5', '8']) await createTask(page, { title: `TC-EST-02 task ${points} pts`, points, sprint });
  const full = await plannedPoints(page, sprint);
  check('Capacity reports 16 points for tasks of 3, 5 and 8', full === 16, full);
  // The board lists the selected sprint, so switch to the new one to reach its tasks.
  await page.getByLabel('Selected sprint').selectOption({ label: `${sprint} (planned)` });
  await go(page, 'Board');
  await deleteTask(page, 'TC-EST-02 task 5 pts');
  const reduced = await plannedPoints(page, sprint);
  check('Capacity is recomputed to 11 after removing the 5-point task', reduced === 11, reduced);
};

const caseSpr01 = async ({ page, check }) => {
  const data = { name: 'Sprint 3', goal: 'Deliver estimation engine', start: isoDay(0), end: isoDay(13) };
  await createSprint(page, data);
  const sprintCard = page.locator('.sprint-card', { has: page.locator('.sprint-title', { hasText: /^Sprint 3$/ }) });
  check('Sprint appears in the sprint list', await sprintCard.count() === 1, await sprintCard.count());
  const text = (await sprintCard.innerText()).replace(/\s+/g, ' ');
  check('Sprint shows its goal', text.includes(data.goal), text.slice(0, 160));
  check('Sprint shows its two-week date range', text.includes(`${data.start} → ${data.end}`), `${data.start} → ${data.end}`);
  await page.getByRole('button', { name: 'New Task' }).click();
  const options = await page.getByRole('dialog').getByLabel('Sprint', { exact: true }).locator('option').allInnerTexts();
  check('Sprint is available as a task assignment target', options.includes(data.name), options.join(' | '));
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
};

async function burndownRows(page) {
  await go(page, 'Overview');
  const details = page.locator('details', { has: page.locator('summary', { hasText: 'Daily burndown values' }) });
  if (!(await details.evaluate(element => element.open))) await details.locator('summary').click();
  return details.locator('tbody tr').evaluateAll(rows => rows.map(row => ({
    date: row.querySelector('th').textContent, ideal: row.cells[1].textContent, actual: row.cells[2].textContent
  })));
}

const caseBurn01 = async ({ page, check, note }) => {
  const today = isoDay(0);
  const before = await burndownRows(page);
  const actualBefore = Number(before.find(row => row.date === today)?.actual);
  check('Precondition: today has a recorded actual value', Number.isFinite(actualBefore), before.find(row => row.date === today)?.actual ?? 'no row for today');
  await go(page, 'Board');
  const title = 'Create Executive Visibility Dashboard';
  const points = Number((await card(page, title).locator('.points-badge').innerText()).match(/\d+/)[0]);
  await page.getByRole('button', { name: `Advance ${title} to Done` }).click();
  check('Task moved to Done', await columnOf(page, title) === 'Done', await columnOf(page, title));
  const after = await burndownRows(page);
  const actualAfter = Number(after.find(row => row.date === today)?.actual);
  check('Actual line falls by exactly the completed points', actualAfter === actualBefore - points, `${actualBefore} -> ${actualAfter} (task ${points} SP)`);
  check('Ideal line is unchanged', JSON.stringify(after.map(row => row.ideal)) === JSON.stringify(before.map(row => row.ideal)), `${after.length} ideal values compared`);
  note('Read from the chart\'s "Daily burndown values" table, which lists the same series the SVG draws.');
};

async function kpis(page) {
  await go(page, 'Overview');
  const text = await contentText(page);
  const number = label => Number(text.match(new RegExp(`${label}\\s+(\\d+)`, 'i'))?.[1]);
  return { text, total: number('Total Story Points'), delivered: number('Delivered Velocity'), completion: number('Sprint Completion'), remaining: number('Remaining Workload') };
}

const caseDash01 = async ({ page, check }) => {
  let total = 0;
  for (const name of COLUMNS) total += Number((await column(page, name).locator('.column-points').innerText()).match(/\d+/)[0]);
  const done = Number((await column(page, 'Done').locator('.column-points').innerText()).match(/\d+/)[0]);
  const shown = await kpis(page);
  check('Progress, velocity and workload are shown', [shown.total, shown.delivered, shown.completion, shown.remaining].every(Number.isFinite),
    `total ${shown.total}, delivered ${shown.delivered}, completion ${shown.completion}%, remaining ${shown.remaining}`);
  check('Total matches the board', shown.total === total, `board ${total} pts, dashboard ${shown.total}`);
  check('Delivered velocity matches the Done column', shown.delivered === done, `Done ${done} pts, dashboard ${shown.delivered}`);
  check('Progress equals completed points / total points', shown.completion === Math.round((done / total) * 100), `${done}/${total} = ${(done / total * 100).toFixed(1)}%, shown ${shown.completion}%`);
};

const caseWork01 = async ({ page, check }) => {
  const shown = await kpis(page);
  const section = shown.text.split('Team 11 Capacity & Workload')[1]?.split('Real-Time Audit Trail')[0] ?? '';
  const members = [...section.matchAll(/(\d+) tasks? • (\d+) story points assigned/g)].map(match => Number(match[2]));
  check('Tasks are assigned across at least three members', members.filter(points => points > 0).length >= 3, members.join(', '));
  const sum = members.reduce((a, b) => a + b, 0);
  check('Member totals sum to the sprint total', sum === shown.total, `${members.join(' + ')} = ${sum}; sprint total ${shown.total}`);
};

const caseDocs01 = async ({ page, check }) => {
  await go(page, 'Documentation');
  const tabs = ['Functional Requirements', 'Non-Functional', 'Traceability Matrix'];
  for (const tab of tabs) {
    await page.locator('.app-content').getByRole('button', { name: tab }).click();
    const text = await contentText(page);
    const ok = text.length > 400 && !/undefined|NaN|\[object Object\]/.test(text);
    check(`"${tab}" tab renders readable content`, ok, `${text.length} characters`);
  }
  const headings = await page.locator('.app-content').getByRole('heading').allInnerTexts();
  check('Documentation has a readable heading', headings.length > 0, headings.join(' | '));
};

const caseOff01 = async ({ context, page, check }) => {
  await createTask(page, { title: 'TC-OFF-01 first offline task' });
  await createTask(page, { title: 'TC-OFF-01 second offline task' });
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(BASE_URL);
  await reopened.locator('.kanban-column').first().waitFor();
  const both = await card(reopened, 'TC-OFF-01 first offline task').count() + await card(reopened, 'TC-OFF-01 second offline task').count();
  check('Both tasks are restored after reopening the tab', both === 2, `${both} of 2 present`);
  const mode = (await reopened.locator('header.app-navbar').innerText()).replace(/\s+/g, ' ');
  check('Interface indicates offline (LocalStorage) persistence', /Local \/ Demo Mode/.test(mode), mode.match(/Local \/ Demo Mode/)?.[0] ?? mode);
};

async function trySaveConfig(page, url, key) {
  await page.locator('aside').getByRole('button', { name: 'Connections', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Project URL/i).fill(url);
  await dialog.getByLabel(/Anon/i).fill(key);
  await dialog.getByRole('button', { name: /Save & Connect/i }).click();
  await page.waitForTimeout(300);
  const text = (await dialog.innerText()).replace(/\s+/g, ' ');
  const close = dialog.getByRole('button', { name: /close/i });
  if (await close.count()) await close.first().click(); else await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  return text;
}

const caseSet01 = async ({ page, check, block }) => {
  block('Steps 1-2 need valid credentials for a provisioned Supabase test project; only step 3 (negative case) was executed.');
  const text = await trySaveConfig(page, 'not-a-url', 'not-a-key');
  check('Step 3: a malformed URL is rejected with a clear message', /Enter a valid https:\/\/ Supabase project URL/.test(text), text.match(/Enter a valid[^.]*\./)?.[0] ?? 'no message');
  const mode = (await page.locator('header.app-navbar').innerText()).replace(/\s+/g, ' ');
  check('Step 3: the previous (offline) configuration is retained', /Local \/ Demo Mode/.test(mode), mode.match(/Local \/ Demo Mode/)?.[0] ?? mode);
};

const caseSec01 = async ({ page, check, block }) => {
  block('Inspecting live HTTPS traffic needs a connected Supabase project. Client-side enforcement was verified instead.');
  const text = await trySaveConfig(page, 'http://plaintext.supabase.co', 'not-a-key');
  check('A plain http:// project URL is refused', /https:\/\//.test(text) && /Enter a valid/.test(text), text.match(/Enter a valid[^.]*\./)?.[0] ?? 'accepted');
};

async function auditFeed(page) {
  await go(page, 'Overview');
  const items = await page.locator('.activity-item').evaluateAll(elements => elements.map(element => ({
    type: element.querySelector('.audit-type')?.textContent.trim().toUpperCase() ?? '',
    text: element.querySelector('.activity-text')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
    time: element.querySelector('time')?.getAttribute('datetime') ?? ''
  })));
  const total = Number((await contentText(page)).match(/Showing \d+ of (\d+) records/)?.[1]);
  return { items, total };
}

const caseLog01 = async ({ page, check }) => {
  const before = await auditFeed(page);
  await go(page, 'Board');
  await createTask(page, { title: 'TC-LOG-01 audit probe' });
  await editTask(page, 'TC-LOG-01 audit probe', { title: 'TC-LOG-01 audit probe (renamed)' });
  await deleteTask(page, 'TC-LOG-01 audit probe (renamed)');
  const after = await auditFeed(page);
  check('Exactly three new audit entries', after.total - before.total === 3, `${before.total} -> ${after.total}`);
  const newest = after.items.slice(0, 3).reverse();
  check('Entries are CREATE, UPDATE, DELETE in chronological order', newest.map(item => item.type).join(',') === 'CREATE,UPDATE,DELETE', newest.map(item => item.type).join(', '));
  check('Each entry carries a timestamp', newest.every(item => !Number.isNaN(Date.parse(item.time))), newest.map(item => item.time).join(', '));
  check('Timestamps are in chronological order', newest.every((item, i) => i === 0 || Date.parse(item.time) >= Date.parse(newest[i - 1].time)), 'non-decreasing');
  check('Each entry names the acting user and the task', newest.every(item => item.text.includes(LEAD.name) && item.text.includes('TC-LOG-01 audit probe')), newest.map(item => item.text).join(' || '));
};

// Under Chrome automation a card that has already been dragged once does not start a
// second drag (no dragstart is dispatched), so every sample drags a different card.
const casePerf01 = async ({ page, check, note }) => {
  await seedTasks(page, 12, 'TC-PERF-01 sample', () => 'backlog');
  const timings = [];
  for (let i = 0; i < 12; i += 1) timings.push(await timedDrop(page, `TC-PERF-01 sample ${i}`, 'In Progress'));
  const samples = timings.slice(2);
  const p50 = percentile(samples, 0.5);
  const p95 = percentile(samples, 0.95);
  note(`10 measured drops after 2 warm-ups: p50 ${p50.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms, max ${Math.max(...samples).toFixed(1)} ms.`);
  check(`Drop-to-render p95 under ${PERF_BUDGET_MS} ms`, p95 < PERF_BUDGET_MS, `${p95.toFixed(1)} ms`);
  return { p50, p95, max: Math.max(...samples) };
};

const caseAvail01 = async ({ context, page, check }) => {
  await context.setOffline(true);
  for (const view of ['Overview', 'Sprints', 'Work items', 'Board']) await go(page, view);
  await createTask(page, { title: 'TC-AVAIL-01 created while offline' });
  check('Application stays usable with the network disabled', await card(page, 'TC-AVAIL-01 created while offline').count() === 1, 'task created and all views opened');
  const mode = (await page.locator('header.app-navbar').innerText()).replace(/\s+/g, ' ');
  check('Application reports offline (local) mode', /Local \/ Demo Mode/.test(mode), mode.match(/Local \/ Demo Mode/)?.[0] ?? mode);
  await context.setOffline(false);
};

const caseLoad01 = async ({ page, check, note }) => {
  const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  const renderedMs = await seedTasks(page, 100, 'TC-LOAD-01 task', i => statuses[i % 5]);
  const cards = await page.locator('.task-card').count();
  check('All seeded tasks render on the board', cards >= 106, `${cards} cards`);
  check('Every seeded task is accessible as a control', await page.getByRole('button', { name: /^Open task: TC-LOAD-01 task/ }).count() === 100, '100 task controls');
  const timings = [];
  // Tasks 90-95 start in Backlog or To Do and are each dragged once.
  for (const i of [90, 91, 95, 96, 92, 97]) timings.push(await timedDrop(page, `TC-LOAD-01 task ${i}`, 'Code Review'));
  const p95 = percentile(timings.slice(1), 0.95);
  note(`Board ready ${renderedMs.toFixed(0)} ms after navigation with ${cards} tasks; drop-to-render p95 ${p95.toFixed(1)} ms over 5 drops.`);
  check(`Drag-and-drop stays responsive (p95 under ${PERF_BUDGET_MS} ms with ${cards} tasks)`, p95 < PERF_BUDGET_MS, `${p95.toFixed(1)} ms`);
};

const caseRecov01 = async ({ context, page, check, note }) => {
  await context.setOffline(true);
  await createTask(page, { title: 'TC-RECOV-01 offline one' });
  await createTask(page, { title: 'TC-RECOV-01 offline two' });
  await context.setOffline(false);
  await page.reload();
  await page.locator('.kanban-column').first().waitFor();
  const kept = await card(page, 'TC-RECOV-01 offline one').count() + await card(page, 'TC-RECOV-01 offline two').count();
  check('No task is lost across disconnect and reconnect', kept === 2, `${kept} of 2 present`);
  note('Zero-config mode. The cloud retry queue across a reconnect is covered by unit tests (persistenceRecovery, recovery).');
};

// ---------------------------------------------------------------- supplementary cases
// The specification has no system case for these SRS requirements; they are added so every
// SRS functional requirement with a user interface has one.

const caseProj01 = async ({ page, check }) => {
  const navbar = (await page.locator('header.app-navbar').innerText()).replace(/\s+/g, ' ');
  check('Top bar shows the project key and name', /PMS SprintFlow - Project Management System/.test(navbar), navbar.slice(0, 120));
  const sprint = await page.getByLabel('Selected sprint').evaluate(select => select.selectedOptions[0].textContent.trim());
  check('Top bar shows the active sprint', /\(active\)$/.test(sprint), sprint);
  const overview = (await kpis(page)).text;
  const dates = overview.match(/PMS · SprintFlow - Project Management System · (\d{4}-\d{2}-\d{2}) → (\d{4}-\d{2}-\d{2})/);
  check('Dashboard shows the project key, name and date range', Boolean(dates), dates ? `${dates[1]} → ${dates[2]}` : 'not found');
};

const caseLabel01 = async ({ page, check }) => {
  await page.getByRole('button', { name: 'New Task' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Task Title').fill('TC-LABEL-01 labelled task');
  const input = dialog.getByLabel('Add label');
  for (const label of ['UI', '#api', 'ui']) { await input.fill(label); await input.press('Enter'); }
  await dialog.getByRole('button', { name: 'Create Task' }).click();
  await dialog.waitFor({ state: 'detached' });
  const pills = await card(page, 'TC-LABEL-01 labelled task').locator('.label-tag').allInnerTexts();
  check('Labels show as separate pills, lower-cased and de-duplicated', pills.join(' ') === '#feature #ui #api', pills.join(' '));
  await page.reload();
  await page.locator('.kanban-column').first().waitFor();
  const after = await card(page, 'TC-LABEL-01 labelled task').locator('.label-tag').allInnerTexts();
  check('Labels survive a page refresh', after.join(' ') === pills.join(' '), after.join(' '));
};

// ---------------------------------------------------------------- security checks (STP 5.4)

const secXss = async ({ page, check }) => {
  await createTask(page, {
    title: '<img src=x onerror="window.__sfXss=1">XSS probe',
    description: '<script>window.__sfXss=2</script><svg onload="window.__sfXss=3"></svg>'
  });
  await createSprint(page, { name: 'XSS sprint', goal: '<img src=x onerror="window.__sfXss=4">', start: isoDay(0), end: isoDay(5) });
  await go(page, 'Board');
  const fired = await page.evaluate(() => window.__sfXss ?? null);
  const injected = await page.locator('.task-card img, .task-card script, .sprint-card img').count();
  check('No injected script or handler executes', fired === null, fired === null ? 'window.__sfXss never set' : `handler ran (${fired})`);
  check('Input is rendered as text, not markup', injected === 0, `${injected} injected elements in cards`);
};

const secToken = async ({ page, check, note }) => {
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  check('The password is not kept in browser storage', !storage.includes(LEAD.password), storage.includes(LEAD.password) ? 'password found' : 'not found');
  check('No access token is kept in zero-config mode', !/eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/.test(storage), 'no JWT in storage');
  note('Cloud JWT expiry and rejection need a live Supabase project (see TC-SEC-01).');
};

const secFuzz = async ({ page, check }) => {
  await createTask(page, { title: `Fuzz ${'x'.repeat(5000)}` });
  const longTitle = await page.locator('.task-card .task-title', { hasText: 'Fuzz xxx' }).first().innerText();
  check('An over-long title is bounded, not crashing the app', longTitle.length < 5000, `${longTitle.length} characters stored`);
  const special = 'Ω ✓ "quotes" & ampersand; DROP TABLE tasks; -- 🚀';
  await createTask(page, { title: special });
  const shown = (await cardWith(page, 'DROP TABLE tasks').first().locator('.task-title').innerText()).trim();
  check('Special characters are stored and shown as typed', shown === special, shown);
};

function secKeys() {
  const assets = join(DIST_DIR, 'assets');
  const files = readdirSync(assets).filter(file => file.endsWith('.js'));
  const bundle = files.map(file => readFileSync(join(assets, file), 'utf8')).join('\n');
  const jwts = bundle.match(/eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/g) ?? [];
  const secretKeys = bundle.match(/sb_secret_[\w-]{16,}/g) ?? [];
  const checks = [
    { step: 'No complete JWT (anon or service_role) is embedded in the bundle', ok: jwts.length === 0, actual: `${jwts.length} found in ${files.length} files` },
    { step: 'No Supabase secret key is embedded in the bundle', ok: secretKeys.length === 0, actual: `${secretKeys.length} found` }
  ];
  results.push({
    id: 'SEC-KEYS', requirement: 'PMS-SR-002', plan: 'STP 5.4', title: 'API key exposure in the client bundle', browser: 'static',
    status: checks.every(entry => entry.ok) ? 'pass' : 'fail', checks, notes: ['Static scan of the production bundle in dist/assets.'], blockedReason: null, durationMs: 0
  });
  console.log(`${results.at(-1).status.toUpperCase().padEnd(7)} SEC-KEYS      static  API key exposure in the client bundle`);
}

// ---------------------------------------------------------------- compatibility (TC-COMPAT-01)

async function boardLayout(browserName) {
  const { context, page } = await openApp(browserName);
  const boxes = await page.locator('.kanban-column').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: Math.round(rect.x), width: Math.round(rect.width) };
  }));
  await page.screenshot({ path: join(OUT_DIR, `TC-COMPAT-01-${browserName}-board.png`) });
  await context.close();
  return boxes;
}

async function runCompatibility() {
  const layouts = {};
  for (const name of BROWSERS) {
    layouts[name] = await boardLayout(name);
    await runCase({ id: 'TC-KAN-01', requirement: 'not in SRS', plan: 'PMS-NF-003', title: 'Five-column board (compatibility run)', compat: true }, name, caseKan01);
    await runCase({ id: 'TC-KAN-02', requirement: 'not in SRS', plan: 'PMS-NF-003', title: 'Drag-and-drop transition (compatibility run)', compat: true }, name, caseKan02);
    await runCase({ id: 'TC-TASK-01', requirement: 'not in SRS', plan: 'PMS-NF-003', title: 'Create a task (compatibility run)', compat: true }, name, caseTask01);
  }
  const compatRuns = results.filter(entry => entry.compat);
  const checks = BROWSERS.map(name => {
    const runs = compatRuns.filter(entry => entry.browser === name);
    return { step: `${name}: TC-KAN-01, TC-KAN-02 and TC-TASK-01 pass`, ok: runs.length === 3 && runs.every(entry => entry.status === 'pass'), actual: runs.map(entry => `${entry.id} ${entry.status}`).join(', ') };
  });
  const baseline = layouts[BROWSERS[0]];
  for (const name of BROWSERS.slice(1)) {
    const drift = Math.max(...layouts[name].map((box, i) => Math.max(Math.abs(box.x - baseline[i].x), Math.abs(box.width - baseline[i].width))));
    checks.push({ step: `${name}: column layout matches ${BROWSERS[0]} within 4 px`, ok: drift <= 4, actual: `max drift ${drift} px` });
  }
  const versions = {};
  for (const name of BROWSERS) versions[name] = (await getBrowser(name)).version();
  results.push({
    id: 'TC-COMPAT-01', requirement: 'not in SRS', plan: 'PMS-NF-003', title: 'Core workflows on Chrome, Edge and Firefox', browser: BROWSERS.join('+'),
    status: checks.every(entry => entry.ok) ? 'pass' : 'fail', checks, layouts, versions,
    notes: [`Browser versions: ${Object.entries(versions).map(([name, version]) => `${name} ${version}`).join(', ')}.`], blockedReason: null, durationMs: 0
  });
  console.log(`${results.at(-1).status.toUpperCase().padEnd(7)} TC-COMPAT-01  all     Core workflows on Chrome, Edge and Firefox`);
}

// ---------------------------------------------------------------- run

// requirement: SRS ID (the project's baseline); plan: the Test Plan's ID for the same feature.
// The two numberings differ; see docs/SPRINT1_DEVIATIONS.md, Section 1.
const cases = [
  [{ id: 'TC-AUTH-01', requirement: 'PMS-F-001', plan: 'PMS-F-001', title: 'Authenticate and establish session' }, caseAuth01],
  [{ id: 'TC-PROJ-01', requirement: 'PMS-F-002', plan: '—', title: 'Show project metadata (supplementary)', supplementary: true }, caseProj01],
  [{ id: 'TC-TASK-01', requirement: 'PMS-F-006', plan: 'PMS-F-002', title: 'Create a task with complete metadata' }, caseTask01],
  [{ id: 'TC-TASK-02', requirement: 'PMS-F-006', plan: 'PMS-F-016', title: 'Assign Critical priority' }, caseTask02],
  [{ id: 'TC-TASK-03', requirement: 'PMS-F-006', plan: 'PMS-F-002', title: 'Reject a task with an empty title' }, caseTask03],
  [{ id: 'TC-LABEL-01', requirement: 'PMS-F-007', plan: '—', title: 'Add labels to a task (supplementary)', supplementary: true }, caseLabel01],
  [{ id: 'TC-KAN-01', requirement: 'PMS-F-003', plan: 'PMS-F-003', title: 'Render the five-column board' }, caseKan01],
  [{ id: 'TC-KAN-02', requirement: 'PMS-F-004', plan: 'PMS-F-004', title: 'Transition a task by drag-and-drop' }, caseKan02],
  [{ id: 'TC-KAN-03', requirement: 'PMS-F-005', plan: 'PMS-F-005', title: 'Advance a task by single action' }, caseKan03],
  [{ id: 'TC-KAN-04', requirement: 'PMS-F-004', plan: 'PMS-F-004', title: 'Cancel a drag outside any column' }, caseKan04],
  [{ id: 'TC-FILT-01', requirement: 'PMS-F-017', plan: 'PMS-F-011', title: 'Filter by priority' }, caseFilt01],
  [{ id: 'TC-EST-01', requirement: 'PMS-F-008', plan: 'PMS-F-006', title: 'Assign Fibonacci story points' }, caseEst01],
  [{ id: 'TC-EST-02', requirement: 'PMS-F-009', plan: 'PMS-F-008', title: 'Calculate sprint capacity' }, caseEst02],
  [{ id: 'TC-SPR-01', requirement: 'PMS-F-010', plan: 'PMS-F-007', title: 'Create a sprint' }, caseSpr01],
  [{ id: 'TC-BURN-01', requirement: 'PMS-F-011', plan: 'PMS-F-009', title: 'Update the burndown chart' }, caseBurn01],
  [{ id: 'TC-DASH-01', requirement: 'PMS-F-012', plan: 'PMS-F-010', title: 'Display KPI metrics' }, caseDash01],
  [{ id: 'TC-WORK-01', requirement: 'PMS-F-013', plan: 'PMS-F-017', title: 'Show workload distribution' }, caseWork01],
  [{ id: 'TC-DOCS-01', requirement: 'not in SRS', plan: 'PMS-F-018', title: 'Render in-app documentation' }, caseDocs01],
  [{ id: 'TC-OFF-01', requirement: 'PMS-F-016', plan: 'PMS-F-014', title: 'Persist offline without configuration' }, caseOff01],
  [{ id: 'TC-SET-01', requirement: 'PMS-F-015', plan: 'PMS-F-015', title: 'Switch data mode from settings' }, caseSet01],
  [{ id: 'TC-LOG-01', requirement: 'PMS-F-014', plan: 'PMS-F-012', title: 'Record an audit trail for mutations' }, caseLog01],
  [{ id: 'TC-PERF-01', requirement: 'PMS-NF-001', plan: 'PMS-NF-001', title: 'Drag-and-drop transition under 50 ms' }, casePerf01],
  [{ id: 'TC-AVAIL-01', requirement: 'PMS-NF-002', plan: 'PMS-NF-002', title: 'Stay usable with the network disabled' }, caseAvail01],
  [{ id: 'TC-SEC-01', requirement: 'PMS-SR-003', plan: 'PMS-NF-004', title: 'Encrypted transport to Supabase' }, caseSec01],
  [{ id: 'TC-LOAD-01', requirement: 'not in SRS', plan: 'PMS-NF-005', title: 'Board with 100+ tasks' }, caseLoad01],
  [{ id: 'TC-RECOV-01', requirement: 'PMS-NF-004', plan: 'PMS-NF-006', title: 'No data loss across disconnect and reconnect' }, caseRecov01],
  [{ id: 'SEC-XSS', requirement: 'PMS-SR-004', plan: 'STP 5.4', title: 'XSS input sanitization' }, secXss],
  [{ id: 'SEC-TOKEN', requirement: 'not in SRS', plan: 'STP 5.4', title: 'Session token handling' }, secToken],
  [{ id: 'SEC-FUZZ', requirement: 'PMS-SR-004', plan: 'STP 5.4', title: 'Input validation fuzzing' }, secFuzz]
];

const started = new Date();
recordBlocked({ id: 'TC-SUPA-01', requirement: 'PMS-F-015', plan: 'PMS-F-013', title: 'Persist to Supabase PostgreSQL' },
  'Precondition not met: needs a Supabase test project with database/schema.sql (and the 20261103 migration) applied.');
recordBlocked({ id: 'SEC-RLS', requirement: 'PMS-SR-001', plan: 'STP 5.4', title: 'Row Level Security on direct API calls' },
  'Needs a live Supabase project to send cross-project API calls. The policies in database/schema.sql are checked statically by src/tests/databaseSecurity.test.js.');
for (const [meta, body] of cases) if (!ONLY || ONLY.includes(meta.id)) await runCase(meta, PRIMARY, body);
if (!ONLY) {
  secKeys();
  await runCompatibility();
}
for (const browser of Object.values(browsers)) await browser.close();

const primary = results.filter(entry => !entry.compat);
const summary = {
  total: primary.length,
  passed: primary.filter(entry => entry.status === 'pass').length,
  failed: primary.filter(entry => entry.status === 'fail').length,
  blocked: primary.filter(entry => entry.status === 'blocked').length
};
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* not a git checkout */ }
writeFileSync(join(OUT_DIR, 'system-validation-results.json'), JSON.stringify({
  startedAt: started.toISOString(), finishedAt: new Date().toISOString(), baseUrl: BASE_URL, commit, browsers: BROWSERS, summary, results
}, null, 2));
console.log(`\n${summary.passed} passed, ${summary.failed} failed, ${summary.blocked} blocked of ${summary.total} (results in ${OUT_DIR})`);
process.exitCode = summary.failed ? 1 : 0;
