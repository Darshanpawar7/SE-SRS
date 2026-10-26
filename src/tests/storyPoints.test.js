import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORY_POINTS } from '../utils/constants';
import { validateStoryPoints } from '../utils/storyPoints';
import { DataService } from '../services/supabaseClient';

describe('PMS-F-008 Fibonacci estimates', () => {
  beforeEach(() => {
    const data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    });
  });

  it('offers exactly the SRS scale', () => {
    expect(STORY_POINTS).toEqual([1, 2, 3, 5, 8, 13, 21]);
    STORY_POINTS.forEach(value => expect(validateStoryPoints(value)).toBe(value));
  });

  it.each([0, -1, 4, 6, 34, 1.5, NaN, Infinity, null, undefined, '', '5', true])(
    'rejects invalid estimate %s before replacing saved tasks', async value => {
      await DataService.saveTasks([{ id: 'existing', story_points: 3 }]);
      await expect(DataService.saveTasks([{ id: 'bad', story_points: value }])).rejects.toThrow('Story points');
      expect(await DataService.getTasks()).toEqual([{ id: 'existing', story_points: 3 }]);
    }
  );

  it('persists every allowed estimate through a read after save', async () => {
    const tasks = STORY_POINTS.map(points => ({ id: String(points), story_points: points }));
    await DataService.saveTasks(tasks);
    expect(await DataService.getTasks()).toEqual(tasks);
    await DataService.saveTasks([]);
    expect(await DataService.getTasks()).toEqual([]);
  });
});
