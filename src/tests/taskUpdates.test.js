import { describe, expect, it } from 'vitest';
import {
  applyTaskUpdate,
  createStatusChangeActivity,
  getTaskAfterStatusDrop
} from '../utils/taskUpdates';

describe('Kanban task transitions', () => {
  it('moves a dropped task to the target stage and ignores a same-stage drop', () => {
    const task = { id: 'task-1', title: 'Implement board', status: 'todo' };

    expect(getTaskAfterStatusDrop([task], 'task-1', 'review')).toEqual({
      ...task,
      status: 'review'
    });
    expect(getTaskAfterStatusDrop([task], 'task-1', 'todo')).toBeNull();
    expect(getTaskAfterStatusDrop([task], 'unknown-task', 'review')).toBeNull();
  });

  it('records the local update duration', () => {
    const task = { id: 'task-1', title: 'Implement board', status: 'todo' };
    const startedTask = { ...task, status: 'in_progress' };
    const clock = [10, 10.6];
    const result = applyTaskUpdate([task], startedTask, () => clock.shift());

    expect(result.previousTask).toEqual(task);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({ id: 'task-1', status: 'in_progress' });
    expect(result.durationMs).toBeCloseTo(0.6);
  });

  it('records actor, task, prior and next stage, and timestamp for the transition', () => {
    const previousTask = { id: 'task-2', title: 'Write tests', status: 'todo' };
    const updatedTask = { ...previousTask, status: 'review' };
    const activity = createStatusChangeActivity(
      previousTask,
      updatedTask,
      'Dhatri Shivaprasad',
      '2026-10-23T10:30:00.000Z'
    );

    expect(activity).toEqual({
      user: 'Dhatri Shivaprasad',
      actor: 'Dhatri Shivaprasad',
      action: 'moved task',
      target: 'Write tests',
      task_id: 'task-2',
      from: 'todo',
      to: 'review',
      timestamp: '2026-10-23T10:30:00.000Z'
    });
    expect(Number.isNaN(Date.parse(activity.timestamp))).toBe(false);
  });
});
