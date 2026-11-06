import { afterEach, expect, it, vi } from 'vitest';
import { auditTaskCreated, auditTaskUpdated } from '../utils/auditTrail';
import { flowMetrics, snapshotFlow } from '../utils/flowAnalytics';
import { FLOW_MAX_KEYS, pruneFlowKeys } from '../services/flowHistoryStore';
const now=new Date('2026-11-06T12:00:00Z');
const base={id:'a',title:'Before',status:'in_progress',story_points:3,created_at:'2026-10-01T12:00:00Z'};
const event=(id,from,to,timestamp)=>({id,entity_type:'task',entity_id:'a',from,to,timestamp});
afterEach(()=>vi.unstubAllGlobals());
it('records a completion when the edit changes status and another field together',()=>{
  const completed={...base,title:'After',status:'done'};
  const record=auditTaskUpdated(base,completed,'Eshwar','2026-11-05T12:00:00Z');
  expect(record).toMatchObject({from:'in_progress',to:'done'});expect(record.details).toMatch(/title:/);
  const metrics=flowMetrics([completed],[event('start','todo','in_progress','2026-11-05T10:00:00Z'),record],now);
  expect(metrics.completedTransitions).toBe(1);expect(metrics.medianHours).toBe(2);
});
it('does not count creating a task directly in Done as a completion transition',()=>{
  const task={...base,status:'done'};
  expect(flowMetrics([task],[auditTaskCreated(task,'Eshwar','2026-11-05T10:00:00Z')],now).completedTransitions).toBe(0);
});
it('discards a cycle start when work returns to To Do before restarting',()=>{
  const metrics=flowMetrics([base],[event('a','todo','in_progress','2026-11-01T00:00:00Z'),event('b','in_progress','todo','2026-11-02T00:00:00Z'),event('c','todo','in_progress','2026-11-05T10:00:00Z'),event('d','review','done','2026-11-05T12:00:00Z')],now);
  expect(metrics.medianHours).toBe(2);
});
it('measures current open age independently of the selected completion window',()=>{
  const metrics=flowMetrics([base],[],new Date('2026-10-20T12:00:00Z'),7,now);
  expect(metrics.ages[0].days).toBe(36);
});
it('retains only the 90 calendar dates supported by the report controls',()=>{
  let rows=[];
  for(let i=100;i>=0;i--){const date=new Date(now.getTime()-i*86400000);rows=snapshotFlow(rows,[base],date);}
  expect(rows).toHaveLength(90);expect(rows.at(-1).date).toBe('2026-11-06');
});
it('bounds derived histories without touching task caches',()=>{
  const storage=new Map([['sprintflow_tasks','private work']]);
  for(let i=0;i<60;i++)storage.set('sprintflow_flow:project:'+i,JSON.stringify(snapshotFlow([],[base],now)));
  storage.set('sprintflow_flow:expired',JSON.stringify(snapshotFlow([],[base],new Date('2025-01-01'))));
  vi.stubGlobal('localStorage',{getItem:k=>storage.get(k)??null,removeItem:k=>storage.delete(k),setItem:(k,v)=>storage.set(k,v),key:i=>[...storage.keys()][i],get length(){return storage.size;}});
  pruneFlowKeys(now,'sprintflow_flow:project:59');
  expect([...storage.keys()].filter(k=>k.startsWith('sprintflow_flow:'))).toHaveLength(FLOW_MAX_KEYS);
  expect(storage.has('sprintflow_flow:expired')).toBe(false);expect(storage.has('sprintflow_flow:project:59')).toBe(true);expect(storage.get('sprintflow_tasks')).toBe('private work');
});
