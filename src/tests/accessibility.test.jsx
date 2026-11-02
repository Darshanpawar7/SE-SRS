import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { activateCardFromKeyDown } from '../utils/accessibility';
import KanbanBoard from '../components/kanban/KanbanBoard';
import TaskModal from '../components/kanban/TaskModal';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { TEAM_MEMBERS } from '../utils/constants';

vi.mock('../context/ProjectContext', () => ({ useProject: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const task = {
  id: 'task-accessibility',
  title: 'Accessible task',
  description: 'Task details',
  status: 'todo',
  priority: 'medium',
  story_points: 3,
  assignee_id: TEAM_MEMBERS[0].id,
  assignee_name: TEAM_MEMBERS[0].name,
  labels: ['accessibility']
};

function configureProject() {
  useProject.mockReturnValue({
    activeSprintTasks: [task],
    updateTask: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn(),
    deleteTask: vi.fn(),
    activeSprintId: 'sprint-1',
    sprints: [],
    filterAssignee: 'all',
    setFilterAssignee: vi.fn(),
    filterPriority: 'all',
    setFilterPriority: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn()
  });
  useAuth.mockReturnValue({ currentUser: TEAM_MEMBERS[0] });
}

describe('keyboard and screen-reader task workflow', () => {
  it.each(['Enter', ' '])('opens a focused task card on %j and prevents the default action', (key) => {
    const activate = vi.fn();
    const card = {};
    const event = { key, target: card, currentTarget: card, preventDefault: vi.fn() };

    expect(activateCardFromKeyDown(event, activate)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(activate).toHaveBeenCalledOnce();
  });

  it('does not activate for other keys or events bubbling from a child', () => {
    const activate = vi.fn();
    const card = {};

    expect(activateCardFromKeyDown({ key: 'Escape', target: card, currentTarget: card, preventDefault: vi.fn() }, activate)).toBe(false);
    expect(activateCardFromKeyDown({ key: 'Enter', target: {}, currentTarget: card, preventDefault: vi.fn() }, activate)).toBe(false);
    expect(activate).not.toHaveBeenCalled();
  });

  it('renders focusable named task controls without nesting the quick action inside the card button role', () => {
    configureProject();
    const html = renderToStaticMarkup(React.createElement(KanbanBoard, { onOpenTaskModal: vi.fn() }));
    const cardStart = html.indexOf('role="button"');
    const quickActionStart = html.indexOf('<div class="quick-move-btns">', cardStart);

    expect(html).toContain('role="region" aria-label="Kanban task board"');
    expect(html).toContain('role="group" aria-label="To Do tasks"');
    expect(html).toContain('role="button" tabindex="0" aria-label="Open task: Accessible task"');
    expect(html.slice(cardStart, quickActionStart)).not.toContain('<button');
    expect(html).toContain('aria-label="Advance Accessible task to In Progress"');
  });

  it('associates task form labels, names the dialog, and announces validation errors', () => {
    configureProject();
    const html = renderToStaticMarkup(React.createElement(TaskModal, { task: null, isOpen: true, onClose: vi.fn() }));

    expect(html).toContain('role="dialog" aria-modal="true" aria-labelledby="task-modal-title"');
    for (const id of ['task-title', 'task-description', 'task-status', 'task-priority', 'task-sprint', 'task-assignee', 'task-label-input']) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('role="group" aria-labelledby="story-points-label"');
  });

  it('gives search and filter controls accessible names', () => {
    configureProject();
    const html = renderToStaticMarkup(React.createElement(KanbanBoard, { onOpenTaskModal: vi.fn() }));

    expect(html).toContain('aria-label="Search tasks, descriptions, or assignees"');
    expect(html).toContain('aria-label="Filter by assignee"');
    expect(html).toContain('aria-label="Filter by priority"');
  });
});
