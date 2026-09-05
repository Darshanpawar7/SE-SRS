import { describe, it, expect } from 'vitest';
import { calculateSprintMetrics, calculateMemberWorkload, generateBurndownData } from '../utils/estimation';

describe('Agile Estimation & Metric Utilities', () => {
  const sampleTasks = [
    { id: '1', title: 'Task A', status: 'done', story_points: 5, assignee_id: 'u-1' },
    { id: '2', title: 'Task B', status: 'in_progress', story_points: 8, assignee_id: 'u-2' },
    { id: '3', title: 'Task C', status: 'todo', story_points: 3, assignee_id: 'u-1' },
    { id: '4', title: 'Task D', status: 'done', story_points: 5, assignee_id: 'u-3' }
  ];

  it('calculates sprint metrics correctly', () => {
    const metrics = calculateSprintMetrics(sampleTasks);
    expect(metrics.totalTasks).toBe(4);
    expect(metrics.completedTasks).toBe(2);
    expect(metrics.totalStoryPoints).toBe(21);
    expect(metrics.completedStoryPoints).toBe(10);
    expect(metrics.remainingStoryPoints).toBe(11);
    expect(metrics.progressPercentage).toBe(48);
  });

  it('handles empty task lists safely without division by zero', () => {
    const metrics = calculateSprintMetrics([]);
    expect(metrics.totalTasks).toBe(0);
    expect(metrics.totalStoryPoints).toBe(0);
    expect(metrics.progressPercentage).toBe(0);
  });

  it('calculates member workload and completion rates', () => {
    const members = [
      { id: 'u-1', name: 'Darshan' },
      { id: 'u-2', name: 'Dhatri' }
    ];
    const workload = calculateMemberWorkload(sampleTasks, members);
    expect(workload[0].taskCount).toBe(2);
    expect(workload[0].assignedPoints).toBe(8);
    expect(workload[0].completedPoints).toBe(5);
    expect(workload[0].completionRate).toBe(63);
  });

  it('generates 11 burndown steps for 10-day sprint', () => {
    const burndown = generateBurndownData(21, 10, 10);
    expect(burndown.length).toBe(11);
    expect(burndown[0].ideal).toBe(21);
    expect(burndown[10].ideal).toBe(0);
  });
});
