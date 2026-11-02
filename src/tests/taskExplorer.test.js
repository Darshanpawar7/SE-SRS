import { describe, it, expect } from 'vitest';
import { exploreTasks, tasksToCsv, csvCell } from '../utils/taskExplorer';
const tasks=[{id:'a',title:'Alpha, "one"',status:'todo',priority:'low',story_points:8,assignee_id:'u1',labels:['api']},{id:'b',title:'Beta',status:'done',priority:'critical',story_points:3,assignee_id:'u2',labels:[]}];
describe('Task explorer and CSV',()=>{
  it('combines every predicate without mutating input',()=>{expect(exploreTasks(tasks,{query:'api',status:'todo',priority:'low',assignee:'u1'})).toEqual([tasks[0]]);expect(tasks[0].id).toBe('a');expect(exploreTasks(tasks,{query:'api',status:'done'})).toEqual([])});
  it('orders priorities, estimates and titles',()=>{expect(exploreTasks(tasks).map(t=>t.id)).toEqual(['b','a']);expect(exploreTasks(tasks,{sort:'points'})[0].id).toBe('a');expect(exploreTasks(tasks,{sort:'title'})[0].id).toBe('a')});
  it.each(['=1+1','+cmd','-cmd','@SUM(1)','  =1','\t=cmd'])('neutralises spreadsheet formulas %s',value=>expect(csvCell(value)).toContain("'"));
  it('escapes quotes, delimiters, unicode and newlines',()=>{const csv=tasksToCsv([{...tasks[0],title:'Royal, "α"\nwork'}]);expect(csv.startsWith('\ufeff')).toBe(true);expect(csv).toContain('"Royal, ""α""\nwork"');expect(csv).toContain('Unscheduled');expect(csv).not.toContain('Beta')});
  it('exports an empty table with headers',()=>expect(tasksToCsv([])).toContain('"ID","Title"'));
});
