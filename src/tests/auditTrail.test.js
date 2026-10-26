import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AUDIT_TYPES,
  auditDemoReset,
  auditSprintCreated,
  auditSprintTransition,
  auditTaskCreated,
  auditTaskDeleted,
  auditTaskUpdated,
  createAuditRecord,
  formatAuditTime
} from '../utils/auditTrail';
import { DataService } from '../services/supabaseClient';
import { INITIAL_ACTIVITY } from '../services/mockData';
import AuditTrail from '../components/dashboard/AuditTrail';
import { AuthProvider } from '../context/AuthContext';
import { ProjectProvider, useProject } from '../context/ProjectContext';

// Renders the real providers once and returns the project context, so tests call the
// same mutation functions the screens use.
const renderApp = () => {
  let app;
  const Capture = () => { app = useProject(); return null; };
  renderToStaticMarkup(React.createElement(AuthProvider, null,
    React.createElement(ProjectProvider, null, React.createElement(Capture))));
  return app;
};

const T0 = Date.parse('2026-10-26T09:00:00.000Z');
const at = seconds => new Date(T0 + seconds * 1000).toISOString();
const task = { id: 't1', title: 'Write audit tests', status: 'todo', priority: 'medium', story_points: 3, labels: [] };

describe('PMS-F-014 immutable audit trail', () => {
  beforeEach(() => {
    const data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: key => data.delete(key),
    });
  });

  it('creates frozen records with actor, action, target and timestamp', () => {
    const record = auditTaskCreated(task, 'Chandan Kumar K', at(0));
    expect(record).toMatchObject({
      type: 'CREATE', actor: 'Chandan Kumar K', user: 'Chandan Kumar K', action: 'created task',
      entity_type: 'task', entity_id: 't1', target: 'Write audit tests', timestamp: at(0)
    });
    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.isFrozen(record)).toBe(true);
    expect(() => { record.actor = 'Someone else'; }).toThrow();
  });

  it('rejects records that could not be attributed or dated', () => {
    const base = { type: AUDIT_TYPES.CREATE, action: 'created task', entityType: 'task', target: 'x' };
    expect(() => createAuditRecord({ ...base, actor: '  ' })).toThrow('acting team member');
    expect(() => createAuditRecord({ ...base, actor: 'Chandan', type: 'EDIT' })).toThrow('Unknown audit record type');
    expect(() => createAuditRecord({ ...base, actor: 'Chandan', timestamp: 'not a date' })).toThrow('valid timestamp');
  });

  it('TC-LOG-01: create, title edit and delete add exactly three records in order', async () => {
    const before = (await DataService.getActivity()).length;
    const renamed = { ...task, title: 'Write audit trail tests' };

    await DataService.logActivity(auditTaskCreated(task, 'Chandan Kumar K', at(0)));
    await DataService.logActivity(auditTaskUpdated(task, renamed, 'Chandan Kumar K', at(1)));
    const history = await DataService.logActivity(auditTaskDeleted(renamed, 'Chandan Kumar K', at(2)));

    expect(history).toHaveLength(before + 3);
    const added = history.slice(0, 3).reverse();
    expect(added.map(record => record.type)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
    expect(added.map(record => record.timestamp)).toEqual([at(0), at(1), at(2)]);
    added.forEach(record => expect(record).toMatchObject({ actor: 'Chandan Kumar K', entity_type: 'task', entity_id: 't1' }));
    expect(added[1].details).toBe('title: Write audit tests → Write audit trail tests');
  });

  it('TC-LOG-01 through the app: creating, editing and deleting a task each add one record', async () => {
    const app = renderApp();
    const created = await app.addTask({ title: 'Audit me', status: 'todo', priority: 'medium', story_points: 3, labels: [] }, 'Chandan Kumar K');
    await app.updateTask({ ...created, title: 'Audit me again' }, 'Chandan Kumar K');
    await app.deleteTask(created.id, 'Chandan Kumar K');

    const recent = (await DataService.getActivity()).slice(0, 3).reverse();
    expect(recent.map(record => `${record.type} ${record.action}`))
      .toEqual(['CREATE created task', 'UPDATE updated task', 'DELETE deleted task']);
    recent.forEach(record => expect(record).toMatchObject({ actor: 'Chandan Kumar K', entity_id: created.id }));
  });

  it('records sprint creation and start made through the app', async () => {
    const app = renderApp();
    const sprint = await app.addSprint({ name: 'Audit sprint', goal: '', start_date: '2026-10-26', end_date: '2026-10-30' }, 'Eshwar');
    await app.updateSprintStatus(sprint.id, 'active', 'Eshwar');

    const recent = (await DataService.getActivity()).slice(0, 2).reverse();
    expect(recent.map(record => `${record.type} ${record.action}`)).toEqual(['CREATE created sprint', 'UPDATE started sprint']);
  });

  it('keeps long before and after values in full', () => {
    const description = 'x'.repeat(120);
    const record = auditTaskUpdated(task, { ...task, description }, 'Dhatri Shivaprasad', at(0));
    expect(record.details).toBe(`description: — → ${description}`);
  });

  it('records a plain move as "moved task" and ignores a save with no changes', () => {
    const moved = auditTaskUpdated(task, { ...task, status: 'review' }, 'Dhatri Shivaprasad', at(0));
    expect(moved).toMatchObject({ type: 'UPDATE', action: 'moved task', from: 'todo', to: 'review' });
    expect(auditTaskUpdated(task, { ...task }, 'Dhatri Shivaprasad', at(0))).toBeNull();
  });

  it('records sprint creation and lifecycle transitions', () => {
    const sprint = { id: 's1', name: 'Sprint 1', status: 'planned' };
    expect(auditSprintCreated(sprint, 'Eshwar', at(0))).toMatchObject({ type: 'CREATE', action: 'created sprint', entity_type: 'sprint' });
    expect(auditSprintTransition(sprint, { ...sprint, status: 'active' }, 'Eshwar', at(1)))
      .toMatchObject({ type: 'UPDATE', action: 'started sprint', from: 'planned', to: 'active' });
    expect(auditSprintTransition({ ...sprint, status: 'active' }, { ...sprint, status: 'completed' }, 'Eshwar', at(2)).action)
      .toBe('completed sprint');
  });

  it('never truncates history and leaves earlier records unchanged', async () => {
    const first = await DataService.logActivity(auditTaskCreated(task, 'Chandan Kumar K', at(0)));
    const snapshot = JSON.parse(JSON.stringify(first));
    for (let i = 1; i <= 30; i++) {
      await DataService.logActivity(auditTaskUpdated(task, { ...task, title: `Edit ${i}` }, 'Chandan Kumar K', at(i)));
    }
    const history = await DataService.getActivity();
    expect(history).toHaveLength(snapshot.length + 30);
    expect(JSON.parse(JSON.stringify(history.slice(30)))).toEqual(snapshot);
    expect(history.every(record => Object.isFrozen(record))).toBe(true);
  });

  it('keeps both records when two are logged at the same moment', async () => {
    const first = auditTaskCreated({ ...task, id: 'a' }, 'Chandan Kumar K', at(0));
    const second = auditTaskCreated({ ...task, id: 'b' }, 'Dhatri Shivaprasad', at(1));

    await Promise.all([DataService.logActivity(first), DataService.logActivity(second)]);

    const ids = (await DataService.getActivity()).map(record => record.id);
    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);
  });

  it('keeps the audit trail when demo data is reset, and records the reset', async () => {
    await DataService.logActivity(auditTaskCreated(task, 'Chandan Kumar K', at(0)));
    DataService.resetAllData();
    await DataService.logActivity(auditDemoReset('Darshan P Pawar', at(1)));
    const history = await DataService.getActivity();
    expect(history[0]).toMatchObject({ action: 'reset demo data for', actor: 'Darshan P Pawar' });
    expect(history[1]).toMatchObject({ action: 'created task', entity_id: 't1' });
  });

  it('only accepts complete audit records', async () => {
    await expect(DataService.logActivity({ user: 'Someone', action: 'deleted task' })).rejects.toThrow('complete audit records');
  });

  it('formats record times relative to now, falling back to the old display text', () => {
    const now = new Date(T0);
    expect(formatAuditTime({ timestamp: at(-20) }, now)).toBe('Just now');
    expect(formatAuditTime({ timestamp: at(-60) }, now)).toBe('1 min ago');
    expect(formatAuditTime({ timestamp: at(-45 * 60) }, now)).toBe('45 mins ago');
    expect(formatAuditTime({ timestamp: at(-3 * 3600) }, now)).toBe('3 hours ago');
    expect(formatAuditTime({ timestamp: '2026-09-05T10:50:00.000Z' }, now)).toContain('2026');
    expect(formatAuditTime({ time: 'Yesterday' }, now)).toBe('Yesterday');
  });

  it('shows the latest seven records, the total count and a full-history control', () => {
    const records = Array.from({ length: 9 }, (_, i) => auditTaskCreated({ ...task, id: `t${i}` }, 'Chandan Kumar K', at(-i * 60)));
    const html = renderToStaticMarkup(React.createElement(AuditTrail, { records, now: new Date(T0) }));
    expect(html.match(/class="activity-item"/g)).toHaveLength(7);
    expect(html).toContain('Showing 7 of 9 records');
    expect(html).toContain('Show full history (9 records)');
    expect(html).toContain('<span class="audit-type">CREATE</span>');
  });

  it('shows status labels for moves in the seed history', () => {
    const html = renderToStaticMarkup(React.createElement(AuditTrail, { records: INITIAL_ACTIVITY, now: new Date(T0) }));
    expect(html).toContain('In Progress → Code Review');
    expect(html).not.toContain('Show full history');
  });
});
