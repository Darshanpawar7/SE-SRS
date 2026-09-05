import { describe, it, expect } from 'vitest';
import { TASK_STATUSES, TASK_PRIORITIES, STORY_POINTS, TEAM_MEMBERS } from '../utils/constants';

describe('Workflow Enums and Constants Verification', () => {
  it('verifies 5 Kanban status columns are defined in sequence', () => {
    const expected = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const actual = TASK_STATUSES.map(s => s.id);
    expect(actual).toEqual(expected);
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
