import { expect, it } from 'vitest';
import { exploreTasks } from '../utils/taskExplorer';
import { normalizeWorkView, parseSavedViews, putSavedView, savedViewsKey } from '../utils/savedWorkViews';
it('separates saved views by endpoint/account, member and project without key collisions',()=>{
  const keys=[savedViewsKey('cloud:a','u1','p1'),savedViewsKey('cloud:b','u1','p1'),savedViewsKey('cloud:a','u2','p1'),savedViewsKey('cloud:a','u1','p2')];
  expect(new Set(keys).size).toBe(4);expect(savedViewsKey('a:b','c','d')).not.toBe(savedViewsKey('a','b:c','d'));
});
it('recovers corrupt saved data and validates persisted filters against current enums',()=>{
  expect(parseSavedViews('bad')).toEqual([]);expect(parseSavedViews('{}')).toEqual([]);
  const normalized=normalizeWorkView({scope:'secret',attention:'invalid',filters:{status:'invented',assignee:'foreign',sort:'runSql',dueFrom:'2026-02-30'}});
  expect(normalized.scope).toBe('sprint');expect(normalized.filters.status).toBe('all');expect(normalized.filters.sort).toBe('priority');expect(normalized.filters.assignee).toBe('all');expect(normalized.filters.dueFrom).toBe('');
});
it('bounds saved view count and text and handles duplicate stored identities',()=>{
  const rows=putSavedView([],' My work ',{scope:'backlog',filters:{query:'database'}},'view-1');
  expect(parseSavedViews(JSON.stringify([...rows,...rows]))).toHaveLength(1);
  expect(rows[0].scope).toBe('backlog');expect(rows[0].name).toBe('My work');
  expect(()=>putSavedView([],' ',{},'x')).toThrow(/name/);
  expect(()=>putSavedView(Array(12).fill({}),'more',{},'x')).toThrow(/12/);
});
it('intersects inclusive due-date filters and leaves undated tasks out of a dated range',()=>{
  const rows=[{id:'a',title:'Alpha',priority:'high',due_date:'2026-11-02'}, {id:'b',title:'Beta',priority:'high',due_date:'2026-11-03'}, {id:'c',title:'Gamma',priority:'low'}];
  expect(exploreTasks(rows,{dueFrom:'2026-11-03',dueTo:'2026-11-03'}).map(t=>t.id)).toEqual(['b']);
  expect(exploreTasks(rows,{sort:'due'}).map(t=>t.id)).toEqual(['a','b','c']);
});
it('orders recorded timestamps with missing dates last and supports explicit unassigned work',()=>{
  const rows=[{id:'x',title:'X',assignee_id:'u-1'}, {id:'b',title:'B',created_at:'2026-11-02',updated_at:'2026-11-03'}, {id:'a',title:'A',created_at:'2026-11-01',updated_at:'2026-11-02'}];
  expect(exploreTasks(rows,{sort:'oldest'}).map(t=>t.id)).toEqual(['a','b','x']);
  expect(exploreTasks(rows,{sort:'updated'}).map(t=>t.id)).toEqual(['b','a','x']);
  expect(exploreTasks(rows,{assignee:'unassigned'})).toHaveLength(2);
});
