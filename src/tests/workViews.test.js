import {it,expect} from 'vitest';
import {applyWorkView} from '../utils/workViews';
const now=new Date('2026-10-22T12:00:00Z');
const tasks=[{id:'a',title:'Mine',assignee_id:'u1',status:'review',priority:'high',updated_at:'2026-10-01'},
{id:'b',title:'Done',assignee_id:'u1',status:'done',priority:'critical',updated_at:'2026-01-01'},
{id:'c',title:'No owner',assignee_id:'missing',status:'todo',priority:'low',updated_at:'bad'}];
it('combines a selected scope with distinct actionable quick views',()=>{
 expect(applyWorkView(tasks,'mine','u1',['u1'],now).map(t=>t.id)).toEqual(['a']);
 expect(applyWorkView(tasks,'urgent','u1',['u1'],now).map(t=>t.id)).toEqual(['a']);
 expect(applyWorkView(tasks,'review','u1',['u1'],now).map(t=>t.id)).toEqual(['a']);
 expect(applyWorkView(tasks,'unassigned','u1',['u1'],now).map(t=>t.id)).toEqual(['c']);
 expect(applyWorkView(tasks,'stale','u1',['u1'],now).map(t=>t.id)).toEqual(['a']);
 expect(applyWorkView(tasks,'all','u1',['u1'],now)).toEqual(tasks);
});
it('keeps empty scopes empty and does not assign someone else’s tasks to the current user',()=>{
 expect(applyWorkView([],'urgent','u1',['u1'],now)).toEqual([]);
 expect(applyWorkView(tasks,'mine','u2',['u1','u2'],now)).toEqual([]);
});
