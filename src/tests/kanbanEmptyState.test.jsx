import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEAM_MEMBERS } from '../utils/constants';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/ProjectContext', () => ({ useProject: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const task = {
  id: 'matching-task',
  title: 'Investigate callback issue',
  description: 'Authentication callback',
  status: 'todo',
  priority: 'high',
  story_points: 3,
  assignee_id: TEAM_MEMBERS[0].id,
  assignee_name: TEAM_MEMBERS[0].name,
  labels: []
};

function renderBoard({
  tasks = [task],
  filterAssignee = 'all',
  filterPriority = 'all',
  searchQuery = ''
} = {}) {
  useProject.mockReturnValue({
    activeSprintTasks: tasks,
    sprints: [{ id: 'active-sprint', status: 'active' }],
    updateTask: vi.fn().mockResolvedValue(undefined),
    filterAssignee,
    setFilterAssignee: vi.fn(),
    filterPriority,
    setFilterPriority: vi.fn(),
    searchQuery,
    setSearchQuery: vi.fn()
  });
  useAuth.mockReturnValue({ currentUser: TEAM_MEMBERS[0] });
  return renderToStaticMarkup(React.createElement(KanbanBoard, { onOpenTaskModal: vi.fn() }));
}

describe('Kanban board filter empty state', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an accessible message naming active filters when no task matches', () => {
    const html = renderBoard({
      filterAssignee: TEAM_MEMBERS[0].id,
      filterPriority: 'high',
      searchQuery: 'no-such-task-xyz'
    });

    expect(html).toContain('class="kanban-filter-empty" role="status" aria-live="polite"');
    expect(html).toContain(`Assignee: ${TEAM_MEMBERS[0].name}`);
    expect(html).toContain('Priority: High');
    expect(html).toContain('Search: “no-such-task-xyz”');
    expect(html.match(/>Reset Filters</g)).toHaveLength(1);
  });

  it('hides the empty state while tasks match the active filters', () => {
    const html = renderBoard({
      filterAssignee: TEAM_MEMBERS[0].id,
      filterPriority: 'high',
      searchQuery: 'callback'
    });

    expect(html).toContain('Investigate callback issue');
    expect(html).not.toContain('kanban-filter-empty');
    expect(html).toContain('Reset Filters');
  });

  it('hides the empty state when there are no active filters', () => {
    const html = renderBoard({ tasks: [] });

    expect(html).not.toContain('kanban-filter-empty');
    expect(html).not.toContain('Reset Filters');
    expect(html.match(/Drop tasks here/g)).toHaveLength(5);
  });
});
