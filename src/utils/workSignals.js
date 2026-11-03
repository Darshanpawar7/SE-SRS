import {sanitizeUserText} from './userText';
export function validateWorkSignals(values) {
 const date=values.due_date||null;
 if(date){const parsed=new Date(`${date}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new Error('Choose a valid due date.');}
 return {due_date:date,blocked_reason:sanitizeUserText(values.blocked_reason,{field:'Blocker reason',maxLength:300,allowNewlines:false})};
}
export function workSignals(task,now=new Date()) {
 const today=new Date(now).toISOString().slice(0,10), open=task.status!=='done';
 return {blocked:open&&Boolean(task.blocked_reason?.trim()),overdue:open&&Boolean(task.due_date)&&task.due_date<today,dueToday:open&&task.due_date===today};
}
