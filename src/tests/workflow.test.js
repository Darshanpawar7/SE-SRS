import { describe, it, expect, vi } from 'vitest';
import { TASK_STATUSES, STORY_POINTS, TEAM_MEMBERS } from '../utils/constants';
import { getKanbanColumns } from '../utils/kanban';
import { advanceTaskByOneStage, getNextTaskStatus } from '../utils/workflow';
import { DataService } from '../services/supabaseClient';

describe('Workflow Enums and Constants Verification', () => {
  it('verifies 5 Kanban status columns are defined in sequence', () => {
    const expected = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const actual = TASK_STATUSES.map(s => s.id);
    expect(actual).toEqual(expected);
  });

  it('provides all five named columns in board order', () => {
    const columns = getKanbanColumns();

    expect(columns.map(({ id, label }) => [id, label])).toEqual([
      ['backlog', 'Backlog'],
      ['todo', 'To Do'],
      ['in_progress', 'In Progress'],
      ['review', 'Code Review'],
      ['done', 'Done']
    ]);
  });

  it('counts exactly the tasks shown in each matching column', () => {
    const tasks = [
      { id: 'task-1', status: 'backlog' },
      { id: 'task-2', status: 'todo' },
      { id: 'task-3', status: 'todo' },
      { id: 'task-4', status: 'done' },
      { id: 'task-5', status: 'unknown' }
    ];

    const columns = getKanbanColumns(tasks);

    expect(columns.map(({ count }) => count)).toEqual([1, 2, 0, 0, 1]);
    columns.forEach((column) => expect(column.count).toBe(column.tasks.length));
  });

  it('verifies Team 11 members match official PES allocation', () => {
    expect(TEAM_MEMBERS.length).toBe(4);
    const usns = TEAM_MEMBERS.map(m => m.usn);
    expect(usns).toContain('PES2UG24CS143');
    expect(usns).toContain('PES2UG24CS158');
    expect(usns).toContain('PES2UG24CS128');
    expect(usns).toContain('PES2UG24CS173');
  });

  it('verifies Fibonacci estimation scale', () => {
    expect(STORY_POINTS).toEqual([1, 2, 3, 5, 8, 13, 21]);
  });

  it('advances a task by exactly one stage with one update call', () => {
    const task = { id: 'task-1', status: 'todo', title: 'Example' };
    const updateTask = vi.fn();

    const advanced = advanceTaskByOneStage(task, updateTask, 'Dhatri');

    expect(advanced).toBe(true);
    expect(updateTask).toHaveBeenCalledOnce();
    expect(updateTask).toHaveBeenCalledWith({ ...task, status: 'in_progress' }, 'Dhatri');
  });

  it('has no enabled next-stage action for Done tasks', () => {
    expect(getNextTaskStatus('done')).toBeNull();

    const updateTask = vi.fn();
    const advanced = advanceTaskByOneStage({ id: 'task-2', status: 'done' }, updateTask, 'Dhatri');

    expect(advanced).toBe(false);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('persists an advanced task through the local data service', async () => {
    const originalStorage = globalThis.localStorage;
    const values = new Map();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key)
      }
    });

    try {
      const tasks = [{ id: 'task-3', status: 'in_progress', title: 'Persist this move', story_points: 3 }];
      await DataService.saveTasks(tasks);

      expect(await DataService.getTasks()).toEqual(tasks);
    } finally {
      if (originalStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        Object.defineProperty(globalThis, 'localStorage', {
          configurable: true,
          value: originalStorage
        });
      }
    }
  });
});
