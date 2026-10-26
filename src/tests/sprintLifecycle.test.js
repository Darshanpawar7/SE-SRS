import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSelectedSprint, transitionSprint, validateSprint } from '../utils/sprintLifecycle';
import { DataService } from '../services/supabaseClient';

const planned = { id: 's1', project_id: 'p1', name: 'Sprint 1', status: 'planned', start_date: '2026-10-01', end_date: '2026-10-15' };

describe('PMS-F-010 sprint lifecycle', () => {
  beforeEach(() => {
    const data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: key => data.delete(key),
    });
  });

  it('persists planned → active → completed and selected sprint', async () => {
    await DataService.saveSprints([planned]);
    const active = transitionSprint(await DataService.getSprints(), 's1', 'active');
    await DataService.saveSprints(active);
    DataService.saveSelectedSprint('s1');
    expect(resolveSelectedSprint(await DataService.getSprints(), DataService.getSelectedSprint())).toBe('s1');
    expect((await DataService.getSprints())[0].status).toBe('active');
    const completed = transitionSprint(await DataService.getSprints(), 's1', 'completed');
    await DataService.saveSprints(completed);
    expect((await DataService.getSprints())[0].status).toBe('completed');
    expect(planned.status).toBe('planned');
  });

  it.each([
    ['planned', 'completed'], ['planned', 'planned'], ['active', 'planned'],
    ['active', 'active'], ['completed', 'active'], ['completed', 'completed'], ['planned', 'unknown'],
  ])('rejects %s → %s', (from, to) => {
    expect(() => transitionSprint([{ ...planned, status: from }], 's1', to)).toThrow('planned to active to completed');
  });

  it('rejects missing sprints and multiple active sprints in the same project', () => {
    expect(() => transitionSprint([], 'absent', 'active')).toThrow('not found');
    const other = { ...planned, id: 's2', status: 'active' };
    expect(() => transitionSprint([planned, other], 's1', 'active')).toThrow('Complete the current');
    expect(transitionSprint([planned, { ...other, project_id: 'p2' }], 's1', 'active')[0].status).toBe('active');
  });

  it.each([
    { name: '   ' }, { start_date: 'invalid' }, { start_date: '2026-02-30' },
    { end_date: '2026-09-01' }, { end_date: '' },
  ])('rejects invalid sprint metadata %j', change => {
    expect(() => validateSprint({ ...planned, ...change })).toThrow();
  });

  it('accepts a same-day sprint and trims its name', () => {
    expect(validateSprint({ ...planned, name: ' One day ', end_date: planned.start_date }).name).toBe('One day');
  });

  it('restores a valid selection, otherwise prefers an active sprint, then first, then empty', () => {
    const sprints = [planned, { ...planned, id: 's2', status: 'active' }];
    expect(resolveSelectedSprint(sprints, 's1')).toBe('s1');
    expect(resolveSelectedSprint(sprints, 'deleted')).toBe('s2');
    expect(resolveSelectedSprint([planned], null)).toBe('s1');
    expect(resolveSelectedSprint([], 'stale')).toBeNull();
  });
});
