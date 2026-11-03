import { describe, expect, it } from 'vitest';
import { flowMetrics, snapshotFlow } from '../utils/flowAnalytics';
const now=new Date('2026-11-03T12:00:00Z');
const tasks=[{id:'t',status:'done',created_at:'2026-10-01T00:00:00Z'},{id:'open',status:'review',created_at:'2026-11-01T12:00:00Z'}];
const event=(id,to,time,from)=>({id,entity_id:'t',entity_type:'task',to,from,timestamp:time});
describe('recorded flow analytics',()=>{
 it('uses paired real transitions, deduplicates events, and measures cycles',()=>{
  const e=[event('a','in_progress','2026-11-01T00:00:00Z','todo'),event('b','done','2026-11-02T00:00:00Z','review')];
  const m=flowMetrics(tasks,[...e,e[1]],now);expect(m.completedTransitions).toBe(1);expect(m.medianHours).toBe(24);expect(m.ages[0].days).toBe(2);
 });
 it('does not invent timing for missing starts or future/corrupt observations',()=>{
  const m=flowMetrics(tasks,[event('a','done','2026-11-01T00:00:00Z','review'),event('b','done','2030-01-01','todo'),event('c','done','bad','todo')],now);expect(m.completedTransitions).toBe(1);expect(m.medianHours).toBe(null);expect(m.cycles).toEqual([]);
 });
 it('counts reopened completions separately and restricts to current scope',()=>{
  const e=[event('a','in_progress','2026-11-01T00:00:00Z','todo'),event('b','done','2026-11-01T01:00:00Z','review'),event('c','in_progress','2026-11-02T00:00:00Z','done'),event('d','done','2026-11-02T03:00:00Z','review')];
  expect(flowMetrics(tasks,e,now).medianHours).toBe(2);expect(flowMetrics([],e,now).completedTransitions).toBe(0);
 });
 it('replaces only today, preserves prior observations and leaves missing dates absent',()=>{
  const first=snapshotFlow([],tasks,new Date('2026-11-01'));const next=snapshotFlow(first,[{id:'t',status:'todo'}],now);expect(next.map(x=>x.date)).toEqual(['2026-11-01','2026-11-03']);expect(snapshotFlow(next,[],now)).toHaveLength(2);expect(next[0].counts.done).toBe(1);
 });
});
