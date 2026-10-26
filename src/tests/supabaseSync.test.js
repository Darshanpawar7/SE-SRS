import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DataService,
  getSupabaseConfig,
  getSyncStatus,
  PROJECT_COLUMNS,
  saveSupabaseConfig,
  setSupabaseClient,
  SPRINT_COLUMNS,
  subscribeSyncStatus,
  TASK_COLUMNS,
  toActivityRow,
  toProjectRow,
  toSprintRow
} from '../services/supabaseClient';
import { INITIAL_PROJECT, INITIAL_SPRINTS, INITIAL_TASKS } from '../services/mockData';
import { auditTaskCreated, auditTaskUpdated } from '../utils/auditTrail';
import { createFakeSupabase } from './helpers/fakeSupabase';

// Column names of one table as declared in database/schema.sql.
const SCHEMA = readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8');
const schemaColumns = (table) => {
  const body = SCHEMA.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`))[1];
  return body.split('\n')
    .map(line => line.trim().split(/\s+/)[0])
    .filter(name => /^[a-z_]+$/.test(name));
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const cloudTask = {
  id: '00000000-0000-4000-8000-000000000901',
  project_id: INITIAL_PROJECT.id,
  sprint_id: INITIAL_SPRINTS[0].id,
  title: 'Cloud task',
  status: 'todo',
  priority: 'high',
  story_points: 5,
  labels: ['cloud']
};

describe('PMS-F-015 Supabase synchronisation', () => {
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
    vi.restoreAllMocks();
  });

  it('reads project, sprint and task records from Supabase and keeps a local copy', async () => {
    const cloud = createFakeSupabase({
      projects: [toProjectRow(INITIAL_PROJECT)],
      sprints: INITIAL_SPRINTS.map(toSprintRow),
      tasks: [cloudTask]
    });
    setSupabaseClient(cloud);

    const { project, sprints, tasks } = await DataService.loadAll();

    expect(tasks).toEqual([cloudTask]);
    expect(sprints.map(sprint => sprint.id)).toEqual(INITIAL_SPRINTS.map(sprint => sprint.id));
    expect(project).toMatchObject({ id: INITIAL_PROJECT.id, key: 'PMS' });
    expect(JSON.parse(storage.get('sprintflow_tasks'))).toEqual([cloudTask]);
    expect(getSyncStatus().state).toBe('synced');
  });

  it('publishes local data in foreign-key order on first connection to an empty project', async () => {
    const cloud = createFakeSupabase();
    setSupabaseClient(cloud);

    await DataService.loadAll();

    expect(cloud.calls.filter(call => call.kind === 'upsert').map(call => call.table))
      .toEqual(['projects', 'sprints', 'tasks']);
    expect(cloud.db.tasks).toHaveLength(INITIAL_TASKS.length);
  });

  it('maps rows onto columns that really exist in database/schema.sql', () => {
    expect(schemaColumns('tasks')).toEqual(expect.arrayContaining(TASK_COLUMNS));
    expect(schemaColumns('sprints')).toEqual(expect.arrayContaining(SPRINT_COLUMNS));
    expect(schemaColumns('projects')).toEqual(expect.arrayContaining(PROJECT_COLUMNS));
    const auditRow = toActivityRow(auditTaskCreated(cloudTask, 'Chandan Kumar K'), INITIAL_PROJECT.id);
    expect(schemaColumns('activity_logs')).toEqual(expect.arrayContaining(Object.keys(auditRow)));
  });

  it('upserts only those columns, dropping client-only fields', async () => {
    const cloud = createFakeSupabase();
    setSupabaseClient(cloud);

    await DataService.saveTasks([{ ...cloudTask, ui_only_flag: true }]);
    await DataService.saveProject(INITIAL_PROJECT);

    const [taskRow] = cloud.calls.find(call => call.table === 'tasks').payload;
    expect(Object.keys(taskRow).every(column => TASK_COLUMNS.includes(column))).toBe(true);
    expect(cloud.db.projects[0]).not.toHaveProperty('owner_name');
  });

  it('stores a change and its audit record locally before the request, even if it never answers', () => {
    const cloud = createFakeSupabase();
    cloud.hang = true;
    setSupabaseClient(cloud);
    const renamed = { ...cloudTask, title: 'Renamed before a stalled request' };
    const record = auditTaskUpdated(cloudTask, renamed, 'Chandan Kumar K');

    DataService.saveTasks([renamed], record); // not awaited: the request never finishes

    expect(JSON.parse(storage.get('sprintflow_tasks'))[0].title).toBe('Renamed before a stalled request');
    expect(JSON.parse(storage.get('sprintflow_activity'))[0].id).toBe(record.id);
  });

  it('repairs the 6-point task left by earlier seed data so the board can be saved', async () => {
    const legacy = [{ id: 'task-106', title: 'Draft Formal IEEE 830 SRS Document', story_points: 6 }, { id: 'x', title: 'Other', story_points: 3 }];
    storage.set('sprintflow_tasks', JSON.stringify(legacy));

    const tasks = await DataService.getTasks();

    expect(tasks.map(task => task.story_points)).toEqual([5, 3]);
    await expect(DataService.saveTasks(tasks)).resolves.toBeUndefined();
  });

  it('names the task when a stored estimate cannot be saved', async () => {
    await expect(DataService.saveTasks([{ id: 'y', title: 'Imported task', story_points: 4 }]))
      .rejects.toThrow('"Imported task" cannot be saved: Story points must be one of');
  });

  it('surfaces a sync error without discarding the local change', async () => {
    const cloud = createFakeSupabase();
    cloud.failWith = 'network unreachable';
    setSupabaseClient(cloud);
    const states = [];
    const unsubscribe = subscribeSyncStatus(status => states.push(status.state));

    await expect(DataService.saveTasks([cloudTask])).resolves.toBeUndefined();
    unsubscribe();

    expect(JSON.parse(storage.get('sprintflow_tasks'))).toEqual([cloudTask]);
    expect(getSyncStatus().state).toBe('error');
    expect(getSyncStatus().message).toContain('network unreachable');
    expect(states).toContain('error');
  });

  it('deletes the task row in Supabase so a deleted task cannot come back', async () => {
    const cloud = createFakeSupabase({ tasks: [cloudTask] });
    setSupabaseClient(cloud);

    await DataService.deleteTask(cloudTask.id, []);

    expect(cloud.db.tasks).toEqual([]);
    expect(JSON.parse(storage.get('sprintflow_tasks'))).toEqual([]);
  });

  it('stores audit records in activity_logs and never overwrites or duplicates one', async () => {
    const cloud = createFakeSupabase();
    setSupabaseClient(cloud);
    const record = auditTaskCreated(cloudTask, 'Chandan Kumar K', '2026-10-26T09:00:00.000Z');

    await DataService.logActivity(record);
    // Sending the same record again (e.g. a retry after a lost response) changes nothing.
    await DataService.pushActivity({ ...record, action: 'tampered' });

    expect(cloud.calls.find(call => call.table === 'activity_logs').options).toMatchObject({ ignoreDuplicates: true });
    expect(cloud.db.activity_logs).toEqual([expect.objectContaining({
      id: record.id,
      user_name: 'Chandan Kumar K',
      action: 'created task',
      entity_type: 'task',
      entity_title: 'Cloud task',
      created_at: '2026-10-26T09:00:00.000Z'
    })]);
  });

  it('TC-SET-01: rejects a malformed URL and keeps the previous configuration', () => {
    saveSupabaseConfig('https://team11.supabase.co/', 'anon-key');
    expect(getSupabaseConfig()).toMatchObject({ url: 'https://team11.supabase.co', isConfigured: true });

    expect(() => saveSupabaseConfig('not a url', 'other-key')).toThrow('valid https://');
    expect(() => saveSupabaseConfig('http://team11.supabase.co', 'other-key')).toThrow('valid https://');
    expect(() => saveSupabaseConfig('https://team11.supabase.co', '   ')).toThrow('anon public key');

    expect(getSupabaseConfig()).toMatchObject({ url: 'https://team11.supabase.co', key: 'anon-key', isConfigured: true });
  });

  it('seeds UUID identifiers that satisfy the schema and its foreign keys', () => {
    expect(INITIAL_PROJECT.id).toMatch(UUID);
    INITIAL_SPRINTS.forEach(sprint => {
      expect(sprint.id).toMatch(UUID);
      expect(sprint.project_id).toBe(INITIAL_PROJECT.id);
    });
    INITIAL_TASKS.forEach(task => {
      expect(task.id).toMatch(UUID);
      if (task.sprint_id) expect(INITIAL_SPRINTS.map(sprint => sprint.id)).toContain(task.sprint_id);
    });
  });
});
