import { describe, expect, it } from 'vitest';
import { buildProjectDashboard, projectRoleForUser, toAssigneeOptions } from '../utils/projectDashboard';
import { canCreateSprints, canManageMembers, shouldShowBoardEmptyState } from '../utils/projectAccess';
import { validateProjectDateRange } from '../utils/projectDates';

const project = { id: 'p1', key: 'AL', name: 'Alpha', description: 'A project', start_date: '2026-11-01', target_date: '2026-11-11' };
const members = [
  { member_id: 'm1', user_id: 'u1', member_name: 'A Lead', email: 'lead@example.com', role: 'lead' },
  { member_id: 'm2', user_id: 'u2', member_name: 'A Developer', email: 'dev@example.com', role: 'developer' }
];

describe('project dashboard and selected-project permissions', () => {
  it('derives the role from the selected project membership, not the global profile role', () => {
    expect(projectRoleForUser(members, { email: 'LEAD@example.com', accessRole: 'developer' })).toBe('lead');
    expect(projectRoleForUser(members, { email: 'elsewhere@example.com', accessRole: 'lead' })).toBeNull();
  });

  it('builds dashboard totals only from its passed project data', () => {
    const summary = buildProjectDashboard(project, members, [{ id: 's1' }], [
      { status: 'done', story_points: 5 }, { status: 'todo', story_points: 3 }
    ], new Date('2026-11-06T12:00:00Z'));
    expect(summary).toMatchObject({ key: 'AL', name: 'Alpha', lead: members[0], memberCount: 2,
      sprintCount: 1, storyPoints: 8, completedPoints: 5, remainingPoints: 3,
      statusCounts: { done: 1, todo: 1 }, daysRemaining: 5, progress: 50 });
  });

  it('keeps project members and roles for real assignee selectors', () => {
    expect(toAssigneeOptions(members)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'u1', name: 'A Lead', role: 'Lead' }),
      expect.objectContaining({ id: 'u2', name: 'A Developer', role: 'Developer' })
    ]));
  });

  it('shows sprint actions by membership role and board guidance only with no sprint', () => {
    expect(canManageMembers('lead')).toBe(true);
    expect(canManageMembers('developer')).toBe(false);
    expect(canCreateSprints('scrum_master')).toBe(true);
    expect(canCreateSprints('viewer')).toBe(false);
    expect(shouldShowBoardEmptyState([])).toBe(true);
    expect(shouldShowBoardEmptyState([{ id: 's1' }])).toBe(false);
    expect(buildProjectDashboard(project, [], [], []).hasTasks).toBe(false);
  });

  it('shares date range rules for equal, earlier and missing or invalid dates', () => {
    expect(validateProjectDateRange('2026-11-07', '2026-11-07').valid).toBe(true);
    expect(validateProjectDateRange('2026-11-08', '2026-11-07').error).toBe('Target date cannot be before the start date');
    expect(validateProjectDateRange('', '2026-11-07').valid).toBe(false);
    expect(validateProjectDateRange('2026-02-30', '2026-03-01').valid).toBe(false);
    // Changing the start after choosing a target uses the same current-value validation.
    expect(validateProjectDateRange('2026-11-10', '2026-11-09').valid).toBe(false);
  });
});
