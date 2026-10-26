import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DataService, getPendingChangeCount, setSupabaseClient, toSprintRow, toProjectRow } from '../services/supabaseClient';
import { AuthProvider } from '../context/AuthContext';
import { ProjectProvider } from '../context/ProjectContext';
import Navbar from '../components/layout/Navbar';
import { INITIAL_PROJECT, INITIAL_SPRINTS } from '../services/mockData';
import { auditTaskCreated } from '../utils/auditTrail';
import { signIn } from '../services/authService';
import { TEAM_MEMBERS } from '../utils/constants';
import { createFakeSupabase } from './helpers/fakeSupabase';

const makeTask = (n, changes = {}) => ({
  id: `00000000-0000-4000-8000-00000000090${n}`,
  project_id: INITIAL_PROJECT.id,
  sprint_id: INITIAL_SPRINTS[0].id,
  title: `Task ${n}`,
  status: 'todo',
  priority: 'medium',
  story_points: 3,
  labels: [],
  ...changes
});

// Lets queued promise callbacks run, so requests started without `await` reach the fake client.
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

// A cloud project that already holds the seed project, sprints and one task.
const seededCloud = (tasks = [makeTask(1)]) => createFakeSupabase({
  projects: [toProjectRow(INITIAL_PROJECT)],
  sprints: INITIAL_SPRINTS.map(toSprintRow),
  tasks
});

describe('PMS-F-016 offline CRUD fallback', () => {
  let storage;

  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    setSupabaseClient(undefined);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('TC-OFF-01: without credentials, create, update and delete persist in local storage across reloads', async () => {
    setSupabaseClient(null);
    await DataService.saveTasks([makeTask(1), makeTask(2)]);
    expect((await DataService.loadAll()).tasks.map(task => task.id)).toEqual([makeTask(1).id, makeTask(2).id]);

    await DataService.saveTasks([makeTask(1, { status: 'done' }), makeTask(2)]);
    await DataService.deleteTask(makeTask(2).id, [makeTask(1, { status: 'done' })]);

    const { tasks } = await DataService.loadAll();
    expect(tasks).toEqual([makeTask(1, { status: 'done' })]);
    expect(getPendingChangeCount()).toBe(0);
  });

  it('keeps a change locally and queues it when the cloud save fails', async () => {
    const cloud = seededCloud();
    setSupabaseClient(cloud);
    await DataService.loadAll();

    cloud.failWith = 'Failed to fetch';
    await DataService.saveTasks([makeTask(1, { title: 'Renamed offline' })]);

    expect(JSON.parse(storage.get('sprintflow_tasks'))[0].title).toBe('Renamed offline');
    expect(cloud.db.tasks[0].title).toBe('Task 1');
    expect(getPendingChangeCount()).toBe(1);
  });

  it('shows the local change after a reload while the cloud is still unreachable, then syncs it', async () => {
    const cloud = seededCloud();
    setSupabaseClient(cloud);
    await DataService.loadAll();
    cloud.failWith = 'Failed to fetch';
    await DataService.saveTasks([makeTask(1, { status: 'review' })]);

    // Reload while still offline: the queued local copy wins over the older cloud row.
    expect((await DataService.loadAll()).tasks[0].status).toBe('review');

    // Back online: the reload shows the local change and sends it in the background.
    cloud.failWith = null;
    const { tasks } = await DataService.loadAll();
    await DataService.flushPending();
    expect(tasks[0].status).toBe('review');
    expect(cloud.db.tasks[0].status).toBe('review');
    expect(getPendingChangeCount()).toBe(0);
  });

  it('TC-RECOV-01: tasks created while disconnected are not lost after reconnecting', async () => {
    const cloud = seededCloud();
    setSupabaseClient(cloud);
    await DataService.loadAll();

    cloud.failWith = 'Failed to fetch';
    await DataService.saveTasks([makeTask(3), makeTask(2), makeTask(1)]);
    expect(await DataService.flushPending()).toBe(false);

    cloud.failWith = null;
    expect(await DataService.flushPending()).toBe(true);
    expect(cloud.db.tasks.map(task => task.id).sort()).toEqual([makeTask(1).id, makeTask(2).id, makeTask(3).id]);
    expect(getPendingChangeCount()).toBe(0);
  });

  it('sends an offline delete later, so the deleted task does not come back', async () => {
    const cloud = seededCloud([makeTask(1), makeTask(2)]);
    setSupabaseClient(cloud);
    await DataService.loadAll();

    cloud.failWith = 'Failed to fetch';
    await DataService.deleteTask(makeTask(2).id, [makeTask(1)]);
    expect((await DataService.loadAll()).tasks.map(task => task.id)).toEqual([makeTask(1).id]);

    cloud.failWith = null;
    expect((await DataService.loadAll()).tasks.map(task => task.id)).toEqual([makeTask(1).id]);
    await DataService.flushPending();
    expect(cloud.db.tasks.map(task => task.id)).toEqual([makeTask(1).id]);
  });

  it('queues audit records that fail to upload and inserts them later', async () => {
    const cloud = seededCloud();
    cloud.failWith = 'Failed to fetch';
    setSupabaseClient(cloud);
    const record = auditTaskCreated(makeTask(4), 'Chandan Kumar K', '2026-10-26T09:00:00.000Z');

    const history = await DataService.logActivity(record);
    expect(history[0].id).toBe(record.id);
    expect(getPendingChangeCount()).toBe(1);

    cloud.failWith = null;
    await DataService.flushPending();
    expect(cloud.db.activity_logs.map(row => row.id)).toEqual([record.id]);
    expect(getPendingChangeCount()).toBe(0);
  });

  it('runs one retry at a time, so a queued record is sent once', async () => {
    const cloud = seededCloud();
    cloud.failWith = 'Failed to fetch';
    setSupabaseClient(cloud);
    await DataService.logActivity(auditTaskCreated(makeTask(5), 'Chandan Kumar K', '2026-10-26T09:00:00.000Z'));
    cloud.failWith = null;
    cloud.calls.length = 0;

    const results = await Promise.all([DataService.flushPending(), DataService.flushPending()]);

    expect(results).toEqual([true, true]);
    expect(cloud.calls.filter(call => call.table === 'activity_logs')).toHaveLength(1);
    expect(getPendingChangeCount()).toBe(0);
  });

  it('marks a change before sending it, so a reload during a slow save keeps the local copy', async () => {
    vi.useFakeTimers();
    const cloud = seededCloud();
    setSupabaseClient(cloud);
    await DataService.loadAll();
    cloud.hangWrites = true;

    const save = DataService.saveTasks([makeTask(1, { title: 'Renamed during a slow save' })]); // gets no answer

    const { tasks } = await DataService.loadAll();
    expect(tasks[0].title).toBe('Renamed during a slow save');
    expect(cloud.db.tasks[0].title).toBe('Task 1');

    // With no answer after 15 seconds the save counts as failed: it stays queued, and the
    // stalled request does not block the next retry.
    await vi.runAllTimersAsync();
    await save;
    expect(getPendingChangeCount()).toBe(1);
    cloud.hangWrites = false;
    expect(await DataService.flushPending()).toBe(true);
    expect(cloud.db.tasks[0].title).toBe('Renamed during a slow save');
  });

  it('loads the local copy, not the older cloud row, when writes fail but reads still work', async () => {
    const cloud = seededCloud();
    setSupabaseClient(cloud);
    await DataService.loadAll();
    cloud.failWritesWith = 'new row violates row-level security policy';

    await DataService.saveTasks([makeTask(1, { status: 'done' })]);
    const { tasks } = await DataService.loadAll();

    expect(tasks[0].status).toBe('done');
    expect(getPendingChangeCount()).toBe(1);
  });

  it('does not let an older save that finishes late clear a newer failed one', async () => {
    const cloud = seededCloud();
    setSupabaseClient(cloud);
    await DataService.loadAll();
    cloud.holdWrites = true;

    const first = DataService.saveTasks([makeTask(1, { title: 'v1' })]);
    const second = DataService.saveTasks([makeTask(1, { title: 'v2' })]);
    await settle();
    cloud.held[1].finish('Failed to fetch'); // v2 fails...
    await second;
    cloud.held[0].finish();                  // ...then v1 succeeds late
    await first;

    expect(getPendingChangeCount()).toBe(1);
    cloud.holdWrites = false;
    expect((await DataService.loadAll()).tasks[0].title).toBe('v2');
    await DataService.flushPending();
    expect(cloud.db.tasks[0].title).toBe('v2');
  });

  it('shows waiting changes in the navbar instead of "Supabase Connected"', async () => {
    setSupabaseClient(null);
    await signIn(TEAM_MEMBERS[0].email, TEAM_MEMBERS[0].usn); // the navbar is only shown after sign-in
    storage.set('supabase_url', 'https://team11.supabase.co');
    storage.set('supabase_key', 'anon-key');
    storage.set('sprintflow_pending_sync', JSON.stringify({ seq: 1, tables: { tasks: 1 }, deletedTaskIds: [], activity: [] }));

    const html = renderToStaticMarkup(React.createElement(AuthProvider, null,
      React.createElement(ProjectProvider, null, React.createElement(Navbar, {}))));

    expect(html).not.toContain('Supabase Connected');
    expect(html).toContain('1 change(s) are waiting to sync');
  });

  it('keeps every queued change when a retry fails again', async () => {
    const cloud = seededCloud([makeTask(1), makeTask(2)]);
    setSupabaseClient(cloud);
    cloud.failWith = 'Failed to fetch';
    await DataService.saveTasks([makeTask(1, { priority: 'high' }), makeTask(2)]);
    await DataService.deleteTask(makeTask(2).id, [makeTask(1, { priority: 'high' })]);

    expect(getPendingChangeCount()).toBe(2);
    expect(await DataService.flushPending()).toBe(false);
    expect(getPendingChangeCount()).toBe(2);
    expect(JSON.parse(storage.get('sprintflow_tasks'))).toEqual([makeTask(1, { priority: 'high' })]);
  });
});
