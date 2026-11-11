import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEAM_MEMBERS } from '../utils/constants';
import { applyTaskUpdate, getTaskAfterStatusDrop } from '../utils/taskUpdates';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/ProjectContext', () => ({ useProject: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const FIXTURE_SIZE = 100;
const WARMUP_COUNT = 5;
const SAMPLE_COUNT = 30;

function percentile(values, fraction) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * fraction) - 1];
}

function makeTasks() {
  const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  return Array.from({ length: FIXTURE_SIZE }, (_, index) => ({
    id: `benchmark-${index}`,
    title: `Benchmark task ${index}`,
    description: `Synthetic local-render fixture task ${index}`,
    status: statuses[index % statuses.length],
    priority: ['low', 'medium', 'high', 'critical'][index % 4],
    story_points: 3,
    assignee_id: TEAM_MEMBERS[index % TEAM_MEMBERS.length].id,
    assignee_name: TEAM_MEMBERS[index % TEAM_MEMBERS.length].name,
    labels: ['benchmark']
  }));
}

function configureBoard(tasks) {
  useProject.mockReturnValue({
    activeSprintTasks: tasks,
    sprints: [{ id: 'sprint-benchmark', status: 'active' }],
    updateTask: vi.fn().mockResolvedValue(undefined),
    filterAssignee: 'all',
    setFilterAssignee: vi.fn(),
    filterPriority: 'all',
    setFilterPriority: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn()
  });
  useAuth.mockReturnValue({ currentUser: TEAM_MEMBERS[0] });
}

describe('repeatable local Kanban drag/drop and render benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records the state update and Kanban component render path for a 100-task fixture', () => {
    let tasks = makeTasks();
    const combinedMs = [];
    const updateMs = [];
    const renderMs = [];

    for (let index = 0; index < WARMUP_COUNT + SAMPLE_COUNT; index += 1) {
      const target = tasks[index % tasks.length];
      const nextStatus = target.status === 'review' ? 'todo' : 'review';
      const startedAt = performance.now();
      const droppedTask = getTaskAfterStatusDrop(tasks, target.id, nextStatus);
      const result = applyTaskUpdate(tasks, droppedTask);
      tasks = result.tasks;
      expect(tasks.find(task => task.id === target.id).status).toBe(nextStatus);
      configureBoard(tasks);
      const markup = renderToStaticMarkup(React.createElement(KanbanBoard, { onOpenTaskModal: vi.fn() }));
      const duration = performance.now() - startedAt;

      expect(markup).toContain(target.title);
      if (index >= WARMUP_COUNT) {
        combinedMs.push(duration);
        updateMs.push(result.durationMs);
        renderMs.push(duration - result.durationMs);
      }
    }

    const summary = {
      fixtureTasks: FIXTURE_SIZE,
      warmups: WARMUP_COUNT,
      samples: SAMPLE_COUNT,
      stateUpdateP50Ms: percentile(updateMs, 0.5),
      stateUpdateP95Ms: percentile(updateMs, 0.95),
      componentRenderP50Ms: percentile(renderMs, 0.5),
      componentRenderP95Ms: percentile(renderMs, 0.95),
      combinedP50Ms: percentile(combinedMs, 0.5),
      combinedP95Ms: percentile(combinedMs, 0.95),
      combinedMaxMs: Math.max(...combinedMs)
    };

    console.warn(`KANBAN_PERF ${JSON.stringify(summary)}`);
    expect(summary.combinedP95Ms).toBeLessThan(50);
  });
});
