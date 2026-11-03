import {expect,it} from 'vitest';
import {validateWorkSignals,workSignals} from '../utils/workSignals';
import {tasksToCsv} from '../utils/taskExplorer';
import {auditTaskUpdated} from '../utils/auditTrail';
it('validates real calendar dates and sanitizes bounded blocker text',()=>{
 expect(validateWorkSignals({due_date:'2026-11-03',blocked_reason:'<b>Waiting</b>'})).toEqual({due_date:'2026-11-03',blocked_reason:'Waiting'});
 expect(()=>validateWorkSignals({due_date:'2026-02-30'})).toThrow('valid due');expect(()=>validateWorkSignals({blocked_reason:'x'.repeat(301)})).toThrow('300');
});
it('classifies overdue and blocked work while excluding completed work',()=>{
 const task={status:'review',due_date:'2026-11-02',blocked_reason:'API access'};
 expect(workSignals(task,new Date('2026-11-03'))).toEqual({blocked:true,overdue:true,dueToday:false});
 expect(workSignals({...task,status:'done'},new Date('2026-11-03')).blocked).toBe(false);
});
it('audits planning changes and protects exported blocker formulas',()=>{
 expect(auditTaskUpdated({id:'t',title:'T'},{id:'t',title:'T',blocked_reason:'Waiting'},'Eshwar').details).toContain('blocked_reason');
 expect(tasksToCsv([{id:'t',title:'T',blocked_reason:'=EVIL()',labels:[]}])).toContain("'=EVIL()");
});
