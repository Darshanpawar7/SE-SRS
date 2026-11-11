import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_PROJECT, INITIAL_SPRINTS, INITIAL_ACTIVITY } from '../services/mockData';
import { auditTaskCreated, auditProjectUpdated, auditSprintCreated, auditSprintDeleted } from '../utils/auditTrail';
import { createFakeSupabase } from './helpers/fakeSupabase';
import { commitLocalSave, recoverLocalSave } from '../services/localPersistence';

const task = { id: 'saved-task', project_id: INITIAL_PROJECT.id, title: 'Keep this task', story_points: 5, status: 'review', labels: ['saved'] };
const boot = async (cloud = null) => {
  vi.resetModules();
  const service = await import('../services/supabaseClient');
  service.setSupabaseClient(cloud);
  return service;
};

describe('PMS-NF-004 fresh-session recovery', () => {
  let storage;
  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('restores all saved entity types, activity, selection and burndown after a new module session', async () => {
    let { DataService: service } = await boot();
    const project = { ...INITIAL_PROJECT, name: 'Persisted project' };
    const sprint = { ...INITIAL_SPRINTS[0], name: 'Persisted sprint' };
    await service.saveProject(project, auditProjectUpdated(INITIAL_PROJECT, project, 'Eshwar'));
    await service.saveSprints([sprint], auditSprintCreated(sprint, 'Eshwar'));
    await service.saveTasks([task], auditTaskCreated(task, 'Eshwar'));
    service.saveSelectedSprint(sprint.id);
    const history = service.recordBurndown([sprint], [task]);
    ({ DataService: service } = await boot());
    const loaded = await service.loadAll();
    expect(loaded.project).toEqual(project);
    expect(loaded.sprints).toEqual([sprint]);
    expect(loaded.tasks).toEqual([task]);
    expect(loaded.activities).toHaveLength(INITIAL_ACTIVITY.length + 3);
    expect(service.getSelectedSprint()).toBe(sprint.id);
    expect(JSON.parse(storage.get('sprintflow_burndown_history'))).toEqual(history);
  });

  it('queues the audit event before an unanswered entity upload and restores it in a fresh session', async () => {
    const cloud = createFakeSupabase();
    cloud.holdWrites = true;
    const first = await boot(cloud);
    const record = auditTaskCreated(task, 'Eshwar');
    const saving = first.DataService.saveTasks([task], record);
    await Promise.resolve();
    expect(JSON.parse(storage.get('sprintflow_pending_sync')).activity).toEqual([record]);
    // Simulate reopening with a new service instance while the old request has no answer.
    const restarted = await boot(null);
    expect((await restarted.DataService.loadAll()).tasks).toEqual([task]);
    expect((await restarted.DataService.getActivity())[0].id).toBe(record.id);
    cloud.holdWrites = false;
    cloud.held[0].finish('interrupted');
    await saving;
    restarted.setSupabaseClient(cloud);
    await restarted.DataService.flushPending();
    expect(cloud.db.tasks).toHaveLength(1);
    expect(cloud.db.activity_logs.map(row => row.id)).toContain(record.id);
    expect(restarted.getPendingChangeCount()).toBe(0);
  });

  it('keeps all configured-mode entities through failed uploads, restart and retry', async () => {
    const cloud = createFakeSupabase({ projects: [{ ...INITIAL_PROJECT }] });
    cloud.failWith = 'offline';
    let api = await boot(cloud);
    await api.DataService.saveProject(INITIAL_PROJECT);
    await api.DataService.saveSprints(INITIAL_SPRINTS);
    await api.DataService.saveTasks([task], auditTaskCreated(task, 'Eshwar'));
    api = await boot(cloud);
    const offline = await api.DataService.loadAll(INITIAL_PROJECT.id);
    expect(offline.tasks).toEqual([task]);
    expect(offline.project.id).toBe(INITIAL_PROJECT.id);
    expect(offline.sprints).toEqual(INITIAL_SPRINTS);
    await api.DataService.flushPending();
    cloud.failWith = null;
    expect(await api.DataService.flushPending()).toBe(true);
    expect(cloud.db.projects).toHaveLength(1);
    expect(cloud.db.sprints).toHaveLength(INITIAL_SPRINTS.length);
    expect(cloud.db.tasks).toHaveLength(1);
    expect(cloud.db.activity_logs).toHaveLength(1);
  });

  it.each(['projects', 'sprints', 'tasks'])('does not let an older %s read overwrite a newer save', async table => {
    const cloud = createFakeSupabase();
    const baseFrom = cloud.from;
    let finishRead;
    cloud.from = name => {
      const builder = baseFrom(name);
      const select = builder.select;
      builder.select = (...args) => {
        select(...args);
        if (name === table) builder.then = resolve => { finishRead = () => resolve({ data: [table === 'projects' ? INITIAL_PROJECT : table === 'sprints' ? INITIAL_SPRINTS[0] : { ...task, title: 'Older cloud title' }], error: null }); };
        return builder;
      };
      return builder;
    };
    const { DataService: service } = await boot(cloud);
    if (table !== 'projects') service.setActiveProject(INITIAL_PROJECT.id);
    const reading = table === 'tasks' ? service.getTasks() : table === 'projects' ? service.getProject() : service.getSprints();
    await Promise.resolve();
    const value = table === 'projects' ? { ...INITIAL_PROJECT, name: 'Latest project' } : table === 'sprints' ? [{ ...INITIAL_SPRINTS[0], name: 'Latest sprint' }] : [{ ...task, title: 'Latest task' }];
    if (table === 'projects') await service.saveProject(value);
    if (table === 'sprints') await service.saveSprints(value);
    if (table === 'tasks') await service.saveTasks(value);
    finishRead();
    expect(await reading).toEqual(value);
  });

  it('replays an interrupted multi-key write before exposing saved state', async () => {
    storage.set('sprintflow_save_journal', JSON.stringify([
      ['sprintflow_tasks', JSON.stringify([task])],
      ['sprintflow_activity', JSON.stringify([auditTaskCreated(task, 'Eshwar')])]
    ]));
    const { DataService: service } = await boot();
    expect(await service.getTasks()).toEqual([task]);
    expect(await service.getActivity()).toHaveLength(1);
    expect(storage.has('sprintflow_save_journal')).toBe(false);
  });

  it('preserves the journal if applying it is interrupted, then replays it', () => {
    const original = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key === 'sprintflow_activity') throw new Error('quota');
      original(key, value);
    };
    expect(() => commitLocalSave({ sprintflow_tasks: [task], sprintflow_activity: [] })).toThrow('quota');
    expect(storage.has('sprintflow_save_journal')).toBe(true);
    localStorage.setItem = original;
    recoverLocalSave();
    expect(JSON.parse(storage.get('sprintflow_tasks'))).toEqual([task]);
    expect(storage.has('sprintflow_save_journal')).toBe(false);
  });

  it('does not overwrite existing entities when the initial journal cannot be saved', () => {
    storage.set('sprintflow_tasks', JSON.stringify([task]));
    localStorage.setItem = () => { throw new Error('storage full'); };
    expect(() => commitLocalSave({ sprintflow_tasks: [] })).toThrow('storage full');
    expect(JSON.parse(storage.get('sprintflow_tasks'))).toEqual([task]);
  });
  it('keeps an audit event saved while an older shared-history read is pending', async () => {
    const cloud = createFakeSupabase();
    const baseFrom = cloud.from;
    let finishRead;
    cloud.from = name => {
      const builder = baseFrom(name);
      const select = builder.select;
      builder.select = (...args) => {
        select(...args);
        if (name === 'activity_logs') builder.then = resolve => { finishRead = () => resolve({ data: [], error: null }); };
        return builder;
      };
      return builder;
    };
    const { DataService: service } = await boot(cloud);
    const reading = service.getActivity();
    await Promise.resolve();
    const record = auditTaskCreated(task, 'Eshwar');
    await service.saveTasks([task], record);
    finishRead();
    expect((await reading).map(event => event.id)).toContain(record.id);
    expect(JSON.parse(storage.get('sprintflow_activity')).map(event => event.id)).toContain(record.id);
  });

  it('recovers sprint deletion, detached tasks, audit and delete retry intent together', async () => {
    const cloud = createFakeSupabase({ sprints: INITIAL_SPRINTS, tasks: [task] });
    const { DataService: service } = await boot(cloud);
    const sprint = INITIAL_SPRINTS[0];
    const record = auditSprintDeleted(sprint, 'Eshwar');
    const remaining = INITIAL_SPRINTS.filter(item => item.id !== sprint.id);
    const detached = [{ ...task, sprint_id: null }];
    storage.set('sprintflow_activity', '[]');
    const original = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key === 'sprintflow_activity') throw new Error('interrupted');
      original(key, value);
    };
    await expect(service.deleteSprint(sprint.id, remaining, detached, [record])).rejects.toThrow('interrupted');
    expect(storage.has('sprintflow_save_journal')).toBe(true);
    localStorage.setItem = original;
    const restarted = await boot(null);
    expect(await restarted.DataService.getSprints()).toEqual(remaining);
    expect(await restarted.DataService.getTasks()).toEqual(detached);
    expect((await restarted.DataService.getActivity()).map(item => item.id)).toContain(record.id);
    expect(JSON.parse(storage.get('sprintflow_pending_sync')).deletedSprintIds).toContain(sprint.id);
    restarted.setSupabaseClient(cloud);
    await restarted.DataService.flushPending();
    expect(cloud.db.sprints.map(item => item.id)).not.toContain(sprint.id);
    expect(cloud.db.tasks[0].sprint_id).toBe(null);
    expect(cloud.db.activity_logs.map(item => item.id)).toContain(record.id);
    expect(restarted.getPendingChangeCount()).toBe(0);
  });

});
