import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataService } from '../services/supabaseClient';
import { TEAM_MEMBERS } from '../utils/constants';
import {
  buildTaskPayload,
  getTaskFormValues,
  mergeTaskPayload,
  validateTaskForm
} from '../utils/taskForm';

describe('Task form validation and persistence', () => {
  let originalStorage;
  let storageValues;

  beforeEach(() => {
    originalStorage = globalThis.localStorage;
    storageValues = new Map();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => storageValues.get(key) ?? null,
        setItem: (key, value) => storageValues.set(key, String(value)),
        removeItem: (key) => storageValues.delete(key)
      }
    });
  });

  afterEach(() => {
    if (originalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalStorage
      });
    }
  });

  it('requires a nonblank title and a supported priority', () => {
    expect(validateTaskForm({ title: '  Fix a bug  ', priority: 'high' })).toBe(true);
    expect(validateTaskForm({ title: '   ', priority: 'high' })).toBe(false);
    expect(validateTaskForm({ title: 'Valid title', priority: 'urgent' })).toBe(false);
  });

  it('creates and persists every task form field', async () => {
    const currentUser = TEAM_MEMBERS[1];
    const formValues = {
      title: '  Add sign in  ',
      description: '  Add the sign in flow  ',
      status: 'todo',
      priority: 'high',
      storyPoints: 5,
      assigneeId: TEAM_MEMBERS[2].id,
      sprintId: 'sprint-2',
      labels: ['auth', 'ui']
    };
    const payload = buildTaskPayload(formValues, currentUser, TEAM_MEMBERS);
    expect(payload).toEqual({
      title: 'Add sign in',
      description: 'Add the sign in flow',
      status: 'todo',
      priority: 'high',
      story_points: 5,
      assignee_id: TEAM_MEMBERS[2].id,
      assignee_name: TEAM_MEMBERS[2].name,
      reporter_name: currentUser.name,
      sprint_id: 'sprint-2',
      labels: ['auth', 'ui']
    });

    const created = { id: 'task-new', created_at: '2026-10-23T10:00:00Z', ...payload };
    await DataService.saveTasks([created]);
    expect(await DataService.getTasks()).toEqual([created]);
  });

  it('edits and persists task fields while preserving task identity', async () => {
    const currentUser = TEAM_MEMBERS[0];
    const existing = {
      id: 'task-existing',
      created_at: '2026-10-01T09:00:00Z',
      title: 'Old title',
      description: 'Old description',
      status: 'todo',
      priority: 'low',
      story_points: 2,
      assignee_id: TEAM_MEMBERS[0].id,
      assignee_name: TEAM_MEMBERS[0].name,
      reporter_name: currentUser.name,
      sprint_id: null,
      labels: []
    };
    const edited = mergeTaskPayload(existing, buildTaskPayload({
      title: 'Updated title',
      description: 'Updated description',
      status: 'review',
      priority: 'critical',
      storyPoints: 8,
      assigneeId: TEAM_MEMBERS[3].id,
      sprintId: 'sprint-2',
      labels: ['reviewed']
    }, currentUser, TEAM_MEMBERS));

    expect(edited.id).toBe(existing.id);
    expect(edited.created_at).toBe(existing.created_at);
    await DataService.saveTasks([edited]);
    expect(await DataService.getTasks()).toEqual([edited]);
  });

  it('restores persisted values when reopening an edit form', () => {
    const savedTask = {
      title: 'Persisted title',
      description: 'Persisted description',
      status: 'review',
      priority: 'critical',
      story_points: 8,
      assignee_id: TEAM_MEMBERS[3].id,
      sprint_id: 'sprint-2',
      labels: ['reviewed']
    };

    expect(getTaskFormValues(savedTask, 'sprint-1', TEAM_MEMBERS[0])).toEqual({
      title: 'Persisted title',
      description: 'Persisted description',
      status: 'review',
      priority: 'critical',
      storyPoints: 8,
      assigneeId: TEAM_MEMBERS[3].id,
      sprintId: 'sprint-2',
      labels: ['reviewed']
    });
  });
});
