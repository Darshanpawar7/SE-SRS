import React from 'react';
import { readFileSync } from 'node:fs';
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

const lightCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const darkCss = readFileSync(new URL('../styles/motion.css', import.meta.url), 'utf8');

function readColorTokens(css, selector) {
  const block = css.match(selector)?.[1];
  if (!block) throw new Error('Expected theme color token block');
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)]
    .map(([, name, color]) => [name, color]));
}

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const lightColors = readColorTokens(lightCss, /:root\s*\{([^}]+)\}/);
const darkColors = readColorTokens(darkCss, /:root\[data-workspace-theme=dark\]\s*\{([^}]+)\}/);

function configureProject() {
  useProject.mockReturnValue({
    activeSprintTasks: [task],
    updateTask: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn(),
    deleteTask: vi.fn(),
    activeSprintId: 'sprint-1',
    sprints: [{ id: 'sprint-1', status: 'active' }],
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
    for (const label of ['Backlog', 'To Do', 'In Progress', 'Code Review', 'Done']) {
      expect(html).toContain(`role="group" aria-label="${label} tasks"`);
    }
    expect(html.match(/class="column-count">\d+</g)).toHaveLength(5);
    expect(html).toContain('role="button" tabindex="0" aria-label="Open task: Accessible task"');
    expect(html.slice(cardStart, quickActionStart)).not.toContain('<button');
    expect(html).toContain('aria-label="Advance Accessible task to In Progress"');
  });

  it('associates task form labels, names the dialog, and announces validation errors', () => {
    configureProject();
    const html = renderToStaticMarkup(React.createElement(TaskModal, { task: null, isOpen: true, onClose: vi.fn() }));

    expect(html).toContain('role="dialog" aria-modal="true" aria-labelledby="task-modal-title"');
    for (const id of ['task-title', 'task-description', 'task-status', 'task-priority', 'task-sprint', 'task-assignee', 'task-due', 'task-blocker', 'task-label-input']) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('role="group" aria-labelledby="story-points-label"');
  });

  it('keeps declared light and dark theme text and status colors above WCAG AA contrast', () => {
    for (const [theme, colors] of [['light', lightColors], ['dark', darkColors]]) {
      for (const [foreground, background] of [
        ['text-main', 'bg-main'],
        ['text-muted', 'bg-card'],
        ['text-dim', 'bg-card'],
        ['success', 'success-light'],
        ['warning', 'warning-light'],
        ['danger', 'danger-light'],
        ['info', 'info-light']
      ]) {
        expect(contrastRatio(colors[foreground], colors[background]), `${theme} ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio(colors.accent, colors['bg-main']), `${theme} focus outline on page`).toBeGreaterThanOrEqual(3);
    }
  });

  it('declares a visible keyboard focus outline for interactive controls', () => {
    expect(lightCss).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)/);
  });

  it('gives search and filter controls accessible names', () => {
    configureProject();
    const html = renderToStaticMarkup(React.createElement(KanbanBoard, { onOpenTaskModal: vi.fn() }));

    expect(html).toContain('aria-label="Search tasks, descriptions, or assignees"');
    expect(html).toContain('aria-label="Filter by assignee"');
    expect(html).toContain('aria-label="Filter by priority"');
  });
});
