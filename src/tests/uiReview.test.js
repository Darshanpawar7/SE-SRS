import { expect, it } from 'vitest';
import { selectSavedEvent } from '../utils/workspaceFeedback';
import { buildProjectMap } from '../utils/projectMap';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const now=Date.parse('2026-11-06T12:00:00Z');
it('confirms only a new recent event belonging to the current actor',()=>{
  const rows=[{id:'teammate',actor:'Darshan',timestamp:new Date(now).toISOString()},{id:'mine',actor:'Eshwar',timestamp:new Date(now-1000).toISOString()},{id:'stale',actor:'Eshwar',timestamp:new Date(now-20000).toISOString()}];
  expect(selectSavedEvent(rows,new Set(),'Eshwar',now).id).toBe('mine');
  expect(selectSavedEvent(rows,new Set(['mine']),'Eshwar',now)).toBeNull();
  expect(selectSavedEvent(rows,new Set(),null,now)).toBeNull();
});
it('distributes the canvas budget across groups and indexes every membership',()=>{
  const project={id:'p',name:'Project'},sprints=Array.from({length:6},(_,i)=>({id:'s'+i,project_id:'p',name:'Sprint '+i}));
  const tasks=sprints.flatMap(s=>Array.from({length:30},(_,i)=>({id:s.id+'-'+i,project_id:'p',sprint_id:s.id,title:'Task '+i})));
  const graph=buildProjectMap(project,sprints,tasks);
  expect(graph.shown).toBe(80);expect(graph.matches).toHaveLength(180);
  expect(graph.groups.filter(g=>g.tasks.length).every(g=>g.shown>0&&g.shown<=20)).toBe(true);
  expect(graph.taskGroups.get('s5-29')).toBe('Sprint 5');
});
it('applies appearance before mounting and tolerates blocked storage',()=>{
  const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const document={documentElement:{dataset:{}}};
  vm.runInNewContext(script,{document,localStorage:{getItem:()=>'{"theme":"dark","animations":false}'}});
  expect(document.documentElement.dataset).toMatchObject({workspaceTheme:'dark',workspaceMotion:'off'});
  expect(()=>vm.runInNewContext(script,{document,localStorage:{getItem:()=>{throw Error('blocked')}}})).not.toThrow();
});
