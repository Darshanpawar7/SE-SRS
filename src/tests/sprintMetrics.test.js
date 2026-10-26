import { describe, it, expect } from 'vitest';
import { calculateSprintMetrics, selectSprintTasks } from '../utils/estimation';

const tasks = [
  { id: 'a', sprint_id: 's1', status: 'done', story_points: 8 },
  { id: 'b', sprint_id: 's1', status: 'review', story_points: 2 },
  { id: 'c', sprint_id: 's2', status: 'done', story_points: 21 },
  { id: 'd', sprint_id: null, status: 'done', story_points: 13 },
];
const metricsFor = (items, id) => calculateSprintMetrics(selectSprintTasks(items, id));

describe('PMS-F-009 selected sprint totals', () => {
  it('uses points, not task counts or other sprint/backlog points', () => {
    expect(metricsFor(tasks, 's1')).toEqual({
      totalTasks: 2, completedTasks: 1, totalStoryPoints: 10,
      completedStoryPoints: 8, remainingStoryPoints: 2, progressPercentage: 80,
    });
    expect(metricsFor(tasks, 's2').totalStoryPoints).toBe(21);
  });

  it.each([null, undefined, '', 'missing'])('returns zero metrics for empty scope %s', id => {
    expect(metricsFor(tasks, id)).toEqual({
      totalTasks: 0, completedTasks: 0, totalStoryPoints: 0,
      completedStoryPoints: 0, remainingStoryPoints: 0, progressPercentage: 0,
    });
  });

  it('recalculates after completion, estimation, reassignment and deletion', () => {
    const completed = tasks.map(t => t.id === 'b' ? { ...t, status: 'done' } : t);
    expect(metricsFor(completed, 's1').progressPercentage).toBe(100);
    const estimated = tasks.map(t => t.id === 'b' ? { ...t, story_points: 8 } : t);
    expect(metricsFor(estimated, 's1').progressPercentage).toBe(50);
    const moved = tasks.map(t => t.id === 'a' ? { ...t, sprint_id: 's2' } : t);
    expect(metricsFor(moved, 's1').completedStoryPoints).toBe(0);
    expect(metricsFor(tasks.filter(t => t.id !== 'b'), 's1').progressPercentage).toBe(100);
    expect(metricsFor(tasks, 's1').progressPercentage).toBe(80);
  });
});
