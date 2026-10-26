import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { generateRecordedBurndown, observedSegments, recordDailyProgress } from '../utils/burndown';
import { DataService } from '../services/supabaseClient';
import BurndownChart from '../components/dashboard/BurndownChart';

const sprint = { id: 's1', name: 'Sprint 1', status: 'active', start_date: '2026-10-01', end_date: '2026-10-03' };
const task = { id: 't1', sprint_id: 's1', status: 'todo', story_points: 8 };

describe('PMS-F-011 recorded daily burndown', () => {
  it('records actual observations, keeps past days unchanged and leaves gaps/future days empty', () => {
    const day1 = recordDailyProgress({}, [sprint], [task], '2026-10-01');
    const day3 = recordDailyProgress(day1, [sprint], [{ ...task, status: 'done' }], '2026-10-03');
    const data = generateRecordedBurndown(sprint, day3.s1, '2026-10-03');
    expect(data.map(point => point.actual)).toEqual([8, null, 0]);
    expect(data.map(point => point.ideal)).toEqual([8, 4, 0]);
    expect(data.map(point => point.date)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(observedSegments(data)).toHaveLength(2);
    expect(day1.s1).toHaveLength(1);
    expect(generateRecordedBurndown(sprint, day3.s1, '2026-10-01').map(point => point.actual)).toEqual([8, null, null]);
  });

  it('keeps only the latest observation today, tracks scope changes, and fixes the initial ideal baseline', () => {
    const day1 = recordDailyProgress({}, [sprint], [task], '2026-10-01');
    const day2 = recordDailyProgress(day1, [sprint], [task, { ...task, id: 't2', story_points: 5 }], '2026-10-02');
    const updated = recordDailyProgress(day2, [sprint], [{ ...task, story_points: 3 }], '2026-10-02');
    expect(updated.s1).toHaveLength(2);
    expect(generateRecordedBurndown(sprint, day2.s1, '2026-10-02').map(point => point.actual)).toEqual([8, 13, null]);
    expect(generateRecordedBurndown(sprint, updated.s1, '2026-10-02').map(point => point.ideal)).toEqual([8, 4, 0]);
    expect(updated.s1[1].remainingPoints).toBe(3);
  });

  it('isolates sprints and records zero after removal or completion', () => {
    const other = { ...sprint, id: 's2' };
    const history = recordDailyProgress({}, [sprint, other], [task, { ...task, id: 't2', sprint_id: 's2', story_points: 21 }], '2026-10-01');
    expect(history.s1[0].remainingPoints).toBe(8);
    expect(history.s2[0].remainingPoints).toBe(21);
    const empty = recordDailyProgress(history, [sprint], [], '2026-10-02');
    expect(empty.s1[1].remainingPoints).toBe(0);
    expect(empty.s2).toEqual(history.s2);
  });

  it('freezes completed history and records late completion on its real date', () => {
    let history = recordDailyProgress({}, [sprint], [task], '2026-10-01');
    history = recordDailyProgress(history, [{ ...sprint, status: 'completed' }], [{ ...task, status: 'done' }], '2026-10-05');
    const reloaded = recordDailyProgress(history, [{ ...sprint, status: 'completed' }], [task], '2026-10-07');
    expect(reloaded).toEqual(history);
    const data = generateRecordedBurndown(sprint, history.s1, '2026-10-07');
    expect(data).toHaveLength(5);
    expect(data[2].actual).toBeNull();
    expect(data[4]).toMatchObject({ date: '2026-10-05', actual: 0, ideal: 0 });
  });

  it('does not invent historical values for a legacy sprint first opened after its end', () => {
    const history = recordDailyProgress({}, [sprint], [task], '2026-10-05');
    const data = generateRecordedBurndown(sprint, history.s1, '2026-10-05');
    expect(data.slice(0, 4).every(point => point.actual === null)).toBe(true);
    expect(data[4].actual).toBe(8);
  });

  it('handles empty, future, one-day and invalid sprints without NaN or crashes', () => {
    const history = recordDailyProgress({}, [sprint], [], '2026-10-01');
    expect(generateRecordedBurndown(sprint, history.s1, '2026-10-01')[0]).toMatchObject({ ideal: 0, actual: 0 });
    const oneDay = { ...sprint, end_date: sprint.start_date };
    expect(generateRecordedBurndown(oneDay, history.s1, '2026-10-01')).toHaveLength(1);
    expect(generateRecordedBurndown(sprint, history.s1, '2026-09-30').every(point => point.actual === null)).toBe(true);
    expect(generateRecordedBurndown(null)).toEqual([]);
    expect(generateRecordedBurndown({ ...sprint, end_date: 'bad' })).toEqual([]);
  });

  it('persists observations across service reads instead of truncating them to the audit feed', () => {
    const storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    });
    for (let day = 1; day <= 25; day++) {
      DataService.recordBurndown([sprint], [task], `2026-10-${String(day).padStart(2, '0')}`);
    }
    expect(DataService.recordBurndown([sprint], [task], '2026-10-25').s1).toHaveLength(25);
    DataService.resetAllData();
    expect(DataService.recordBurndown([sprint], [], '2026-10-26').s1).toHaveLength(1);
  });

  it('renders exact daily labels and actual values with accessible empty/one-point states', () => {
    const history = recordDailyProgress({}, [sprint], [task], '2026-10-01');
    const data = generateRecordedBurndown(sprint, history.s1, '2026-10-01');
    const html = renderToStaticMarkup(React.createElement(BurndownChart, { data }));
    expect(html).toContain('2026-10-01: 8 points remaining');
    expect(html).toContain('Not recorded');
    expect(html).toContain('D2');
    expect(html).not.toContain('NaN');
    expect(renderToStaticMarkup(React.createElement(BurndownChart, { data: [] }))).toContain('No sprint dates');
    expect(renderToStaticMarkup(React.createElement(BurndownChart, { data: data.slice(0, 1) }))).not.toContain('NaN');
  });
});
