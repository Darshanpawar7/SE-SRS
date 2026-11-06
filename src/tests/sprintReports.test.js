import { expect, it } from 'vitest';
import { buildSprintReport, dailyReportCsv, reportRange, reportTasks, rollingRange } from '../utils/sprintReports';
const now = new Date('2026-11-03T12:00:00Z');
const range = reportRange('2026-11-01','2026-11-03',now);
const tasks = [{id:'a',status:'done',priority:'high',story_points:5,assignee_id:'u-1'}, {id:'b',status:'todo',priority:'low',story_points:3,assignee_id:'retired'}, {id:'c',status:'mystery',priority:'custom',story_points:2}];
const event = (id,taskId,date) => ({id,entity_type:'task',entity_id:taskId,from:'review',to:'done',timestamp:date});
it('validates bounded inclusive UTC ranges, including real calendar dates',()=>{
  expect(range.days).toBe(3);expect(range.end.toISOString()).toBe(now.toISOString());
  expect(reportRange('2026-02-29','2026-03-01',now).error).toBeTruthy();
  expect(reportRange('2026-11-03','2026-11-01',now).error).toBeTruthy();
  expect(reportRange('2026-11-01','2026-11-04',now).error).toMatch(/future/);
  expect(reportRange('2026-01-01','2026-11-03',now).error).toMatch(/90/);
  expect(rollingRange(7,now)).toEqual({from:'2026-10-28',to:'2026-11-03'});
});
it('reconciles snapshot totals including unknown statuses, priorities and owners',()=>{
  const r=buildSprintReport(tasks,[],range,now);
  expect(r.points).toBe(10);expect(r.donePoints).toBe(5);expect(r.completion).toBe(50);
  expect(r.statuses.reduce((n,s)=>n+s.count,0)).toBe(3);
  expect(r.priorities.reduce((n,p)=>n+p.count,0)).toBe(3);
  expect(r.owners.reduce((n,o)=>n+o.points,0)).toBe(10);
  expect(r.owners.find(o=>o.id==='unassigned').count).toBe(2);
  expect(buildSprintReport([],[],range,now).completion).toBeNull();
});
it('exports recorded transitions in the range and excludes duplicates, other tasks and future events',()=>{
  const e=event('e','a','2026-11-02T08:00:00Z');
  const r=buildSprintReport(tasks,[e,e,event('old','a','2026-10-30T08:00:00Z'),event('other','outside','2026-11-02T08:00:00Z'),event('future','a','2026-11-03T23:00:00Z')],range,now);
  expect(r.completedTransitions).toBe(1);expect(r.medianHours).toBeNull();
  expect(dailyReportCsv(r)).toContain('"2026-11-02","1"');
  expect(r.throughput.map(x=>x.date)).toEqual(['2026-11-01','2026-11-02','2026-11-03']);
});
it('drills into unique current tasks even when a task has multiple completion transitions',()=>{
  const r=buildSprintReport(tasks,[event('a','a','2026-11-02T08:00:00Z'),event('b','a','2026-11-02T09:00:00Z')],range,now);
  expect(reportTasks(tasks,r,{kind:'date',id:'2026-11-02'}).map(t=>t.id)).toEqual(['a']);
  expect(reportTasks(tasks,r,{kind:'owner',id:'unassigned'}).map(t=>t.id)).toEqual(['b','c']);
  expect(reportTasks(tasks,r,{kind:'status',id:'unknown'}).map(t=>t.id)).toEqual(['c']);
  expect(reportTasks(tasks,r,{kind:'priority',id:'high'}).map(t=>t.id)).toEqual(['a']);
});
