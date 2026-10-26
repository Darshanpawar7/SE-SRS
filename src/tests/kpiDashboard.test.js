import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateSprintMetrics, selectSprintTasks } from '../utils/estimation';
import { applyTaskUpdate } from '../utils/taskUpdates';
import { buildKpiCards } from '../utils/kpis';
import KpiCards from '../components/dashboard/KpiCards';

const tasks = [
  { id: 'a', sprint_id: 's1', status: 'done', story_points: 5 },
  { id: 'b', sprint_id: 's1', status: 'in_progress', story_points: 8 },
  { id: 'c', sprint_id: 's1', status: 'todo', story_points: 3 },
  { id: 'd', sprint_id: 's2', status: 'done', story_points: 13 },
];
const metricsFor = items => calculateSprintMetrics(selectSprintTasks(items, 's1'));
const kpisFor = items => Object.fromEntries(buildKpiCards(metricsFor(items)).map(card => [card.id, card]));

describe('PMS-F-012 executive KPI dashboard', () => {
  it('reports total points, delivered velocity, completion and remaining work from the task data', () => {
    const kpis = kpisFor(tasks);
    expect(kpis.total).toMatchObject({ value: 16, meta: '3 tasks in active scope' });
    expect(kpis.velocity).toMatchObject({ value: 5, meta: '1 items completed' });
    expect(kpis.completion).toMatchObject({ value: 31, progress: 31 });
    expect(kpis.remaining).toMatchObject({ value: 11, meta: '2 tasks pending' });
  });

  it('updates every KPI after a task mutation, with no reload', () => {
    const { tasks: moved } = applyTaskUpdate(tasks, { ...tasks[1], status: 'done' });
    const kpis = kpisFor(moved);
    expect(kpis.total.value).toBe(16);
    expect(kpis.velocity.value).toBe(13);
    expect(kpis.completion.value).toBe(81);
    expect(kpis.remaining).toMatchObject({ value: 3, meta: '1 tasks pending' });

    const { tasks: reestimated } = applyTaskUpdate(moved, { ...moved[2], story_points: 8 });
    expect(kpisFor(reestimated).total.value).toBe(21);
  });

  it('renders the four cards with the computed values and an accessible progress bar', () => {
    const html = renderToStaticMarkup(React.createElement(KpiCards, { metrics: metricsFor(tasks) }));
    expect(html.match(/class="stat-card"/g)).toHaveLength(4);
    expect(html).toContain('16 <span class="stat-unit">pts</span>');
    expect(html).toContain('31%');
    expect(html).toContain('aria-valuenow="31"');
    expect(html).toContain('2 tasks pending');
  });

  it('shows zeros, not NaN, when the selected sprint has no tasks', () => {
    const html = renderToStaticMarkup(React.createElement(KpiCards, { metrics: calculateSprintMetrics([]) }));
    expect(html).not.toContain('NaN');
    expect(html).toContain('0%');
    expect(html).toContain('0 tasks in active scope');
  });
});
