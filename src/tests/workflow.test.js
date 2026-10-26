import { describe, it, expect } from 'vitest';
import { TASK_STATUSES, STORY_POINTS, TEAM_MEMBERS } from '../utils/constants';
import { getKanbanColumns } from '../utils/kanban';

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
});
