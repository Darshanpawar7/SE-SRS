import { expect, it } from 'vitest';
import { buildProjectMap, clampMapZoom } from '../utils/projectMap';
const project={id:'p',key:'PMS',name:'Workspace'};
const sprints=[{id:'s',project_id:'p',name:'Sprint 1'},{id:'other',project_id:'foreign',name:'Private sprint'}];
it('never includes foreign project tasks or sprints in the map',()=>{
  const g=buildProjectMap(project,sprints,[{id:'a',project_id:'p',sprint_id:'s',title:'Auth'},{id:'foreign',project_id:'foreign',sprint_id:'s',title:'Private task'}]);
  expect(g.total).toBe(1);expect(g.matches.map(t=>t.id)).toEqual(['a']);expect(g.groups.some(s=>s.id==='other')).toBe(false);
  expect(buildProjectMap(null,sprints,[{id:'a',project_id:'p'}]).nodes).toEqual([]);
});
it('distinguishes unscheduled work from a missing or foreign sprint',()=>{
  const g=buildProjectMap(project,sprints,[{id:'a',project_id:'p',title:'Backlog'}, {id:'b',project_id:'p',sprint_id:'other',title:'Unlinked'}]);
  expect(g.groups.find(s=>s.id==='__backlog').tasks.map(t=>t.id)).toEqual(['a']);
  expect(g.groups.find(s=>s.id==='__unlinked').tasks.map(t=>t.id)).toEqual(['b']);
  const keys=new Set(g.nodes.map(n=>n.key));expect(g.edges.every(e=>keys.has(e.from)&&keys.has(e.to))).toBe(true);
});
it('searches real labels and owners while preserving membership',()=>{
  const tasks=[{id:'a',project_id:'p',sprint_id:'s',title:'API',labels:['security'],assignee_name:'Eshwar'}, {id:'b',project_id:'p',title:'Design'}];
  expect(buildProjectMap(project,sprints,tasks,'security').matches.map(t=>t.id)).toEqual(['a']);
  expect(buildProjectMap(project,sprints,tasks,'eshwar').matches.map(t=>t.id)).toEqual(['a']);
  expect(buildProjectMap(project,sprints,tasks,'Sprint 1').matches.map(t=>t.id)).toEqual(['a']);
});
it('limits canvas nodes while keeping every matching task available to the table',()=>{
  const tasks=Array.from({length:100},(_,i)=>({id:String(i),project_id:'p',title:`Task ${i}`}));
  const g=buildProjectMap(project,sprints,tasks);expect(g.matches).toHaveLength(100);expect(g.shown).toBe(80);expect(g.nodes.filter(n=>n.kind==='task')).toHaveLength(80);
});
it('bounds zoom and recovers non-finite values',()=>{expect(clampMapZoom(-2)).toBe(.1);expect(clampMapZoom(3)).toBe(1.6);expect(clampMapZoom(NaN)).toBe(1);});
