import { TASK_PRIORITIES } from './constants';
const DAY = 86400000;
export function taskAgeDays(task, now = new Date()) {
  const time = Date.parse(task.updated_at || task.created_at);
  const today = new Date(now).getTime();
  return Number.isFinite(time) && Number.isFinite(today) && time <= today ? Math.floor((today - time) / DAY) : null;
}
export function sprintClock(sprint, now = new Date()) {
  if (!sprint) return null;
  const day = value => Date.parse(`${value}T00:00:00Z`);
  const start = day(sprint.start_date), end = day(sprint.end_date);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const today = day(new Date(now).toISOString().slice(0,10));
  const duration = Math.round((end-start)/DAY)+1;
  const elapsed = Math.max(0,Math.min(duration,Math.round((today-start)/DAY)+1));
  return {duration,elapsed,percentage:Math.round(elapsed/duration*100),daysLeft:Math.max(0,Math.round((end-today)/DAY)),overdue:sprint.status !== 'completed' && today > end};
}
export function deliverySignals(tasks, memberIds, sprint, now = new Date()) {
  const ids = new Set(memberIds);
  const open = tasks.filter(t=>t.status !== 'done');
  const attention = open.map(task=>({task,age:taskAgeDays(task,now),reasons:[
    ...(task.priority === 'critical' ? ['Critical priority'] : []),
    ...(!ids.has(task.assignee_id) ? ['No recognised owner'] : []),
    ...(taskAgeDays(task,now) !== null && taskAgeDays(task,now)>=7 ? ['No update for 7+ days'] : []),
  ]})).filter(item=>item.reasons.length).sort((a,b)=>b.reasons.length-a.reasons.length || a.task.title.localeCompare(b.task.title));
  return {
    wip:open.filter(t=>['in_progress','review'].includes(t.status)).length,
    review:open.filter(t=>t.status==='review').length,
    critical:open.filter(t=>t.priority==='critical').length,
    unassigned:open.filter(t=>!ids.has(t.assignee_id)).length,
    stale:open.filter(t=>taskAgeDays(t,now)!==null && taskAgeDays(t,now)>=7).length,
    unknownAge:open.filter(t=>taskAgeDays(t,now)===null).length,
    open:open.length,done:tasks.length-open.length,clock:sprintClock(sprint,now),attention,
    priorities:TASK_PRIORITIES.map(p=>({...p,total:tasks.filter(t=>t.priority===p.id).length,done:tasks.filter(t=>t.priority===p.id&&t.status==='done').length})),
  };
}
