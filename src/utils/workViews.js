import { taskAgeDays } from './deliverySignals';
export function applyWorkView(tasks, view, userId, memberIds, now = new Date()) {
  const ids=new Set(memberIds);
  return tasks.filter(task=>{
    if(view==='mine')return task.status!=='done'&&task.assignee_id===userId;
    if(view==='review')return task.status==='review';
    if(view==='urgent')return task.status!=='done'&&['high','critical'].includes(task.priority);
    if(view==='unassigned')return task.status!=='done'&&!ids.has(task.assignee_id);
    if(view==='stale')return task.status!=='done'&&taskAgeDays(task,now)!==null&&taskAgeDays(task,now)>=7;
    return true;
  });
}
export const WORK_VIEWS=[
  {id:'all',label:'All work',icon:'layers'}, {id:'mine',label:'My open work',icon:'person'},
  {id:'urgent',label:'Urgent',icon:'critical'},{id:'review',label:'Review',icon:'review'},
  {id:'unassigned',label:'Unassigned',icon:'person'},{id:'stale',label:'Stale · 7d+',icon:'clock'},
];
