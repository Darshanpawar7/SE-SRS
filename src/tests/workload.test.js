import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateMemberWorkload, summarizeWorkload } from '../utils/estimation';
import WorkloadList from '../components/dashboard/WorkloadList';

const members = [
  { id: 'u-1', name: 'Darshan P Pawar', usn: 'PES2UG24CS143', initials: 'DP', color: '#6366f1' },
  { id: 'u-2', name: 'Dhatri Shivaprasad', usn: 'PES2UG24CS158', initials: 'DS', color: '#ec4899' },
  { id: 'u-3', name: 'Chandan Kumar K', usn: 'PES2UG24CS128', initials: 'CK', color: '#10b981' },
];
const tasks = [
  { id: 't1', assignee_id: 'u-1', status: 'done', story_points: 5 },
  { id: 't2', assignee_id: 'u-1', status: 'todo', story_points: 3 },
  { id: 't3', assignee_id: 'u-2', status: 'done', story_points: 8 },
  { id: 't4', assignee_id: null, status: 'todo', story_points: 2 },
  { id: 't5', assignee_id: 'u-9', status: 'review', story_points: 1 },
];
const byId = workload => Object.fromEntries(workload.map(member => [member.id, member]));

describe('PMS-F-013 team workload and capacity', () => {
  it("matches each member's assigned and completed points to their own tasks", () => {
    const workload = byId(calculateMemberWorkload(tasks, members));
    expect(workload['u-1']).toMatchObject({ taskCount: 2, assignedPoints: 8, completedPoints: 5, completionRate: 63 });
    expect(workload['u-2']).toMatchObject({ taskCount: 1, assignedPoints: 8, completedPoints: 8, completionRate: 100 });
  });

  it('reports a 0% completion rate, never NaN, for a member with no assigned points', () => {
    const workload = byId(calculateMemberWorkload(tasks, members));
    expect(workload['u-3']).toMatchObject({ taskCount: 0, assignedPoints: 0, completedPoints: 0, completionRate: 0 });
  });

  it('reconciles member totals with the sprint total by separating unowned work', () => {
    const summary = summarizeWorkload(tasks, members);
    const sprintTotal = tasks.reduce((sum, task) => sum + task.story_points, 0);
    expect(summary.assignedPoints).toBe(16);
    expect(summary).toMatchObject({ unassignedTasks: 2, unassignedPoints: 3 });
    expect(summary.assignedPoints + summary.unassignedPoints).toBe(sprintTotal);
  });

  it('recalculates after a task is reassigned or completed', () => {
    const changed = tasks.map(task => (task.id === 't4' ? { ...task, assignee_id: 'u-3', status: 'done' } : task));
    const summary = summarizeWorkload(changed, members);
    expect(byId(summary.members)['u-3']).toMatchObject({ assignedPoints: 2, completedPoints: 2, completionRate: 100 });
    expect(summary.unassignedPoints).toBe(1);
  });

  it('renders every member with their points and the unowned work', () => {
    const html = renderToStaticMarkup(React.createElement(WorkloadList, { tasks, members }));
    members.forEach(member => expect(html).toContain(member.usn));
    expect(html).toContain('8 story points assigned');
    expect(html).toContain('5 pts done (63%)');
    expect(html).toContain('Unassigned: 2 tasks • 3 story points');
    expect(html).not.toContain('NaN');
    expect(renderToStaticMarkup(React.createElement(WorkloadList, { tasks: [], members }))).not.toContain('Unassigned');
  });
});
