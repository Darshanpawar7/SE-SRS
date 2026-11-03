import { TASK_STATUSES } from './constants';
const DAY = 86400000;
export const flowDate = now => new Date(now).toISOString().slice(0, 10);
export function snapshotFlow(history, tasks, now = new Date()) {
  const date = flowDate(now);
  const observation = { date, observed_at: new Date(now).toISOString(), counts: Object.fromEntries(TASK_STATUSES.map(s => [s.id, tasks.filter(t => t.status === s.id).length])) };
  return [...history.filter(item => item.date !== date), observation].sort((a,b)=>a.date.localeCompare(b.date));
}
export function flowMetrics(tasks, activities, now = new Date(), days = 28) {
  const end = new Date(now).getTime(), start = Date.parse(flowDate(now)) - (days - 1) * DAY;
  const ids = new Set(tasks.map(t => t.id));
  const events = activities.filter(a => a.entity_type === 'task' && ids.has(a.entity_id) && Number.isFinite(Date.parse(a.timestamp)) && Date.parse(a.timestamp) <= end)
    .sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)||String(a.id).localeCompare(String(b.id)));
  const seen = new Set(), starts = new Map(), cycles = [], throughput = new Map();
  for (const event of events) {
    if (seen.has(event.id)) continue; seen.add(event.id);
    const time = Date.parse(event.timestamp);
    if (event.to === 'in_progress' && !starts.has(event.entity_id)) starts.set(event.entity_id, time);
    if (event.to === 'done' && event.from !== 'done') {
      if (time >= start) {
        const date = flowDate(time); throughput.set(date, (throughput.get(date) || 0) + 1);
        const began = starts.get(event.entity_id);
        if (began !== undefined && time >= began) cycles.push({ id: event.id, taskId: event.entity_id, timestamp: event.timestamp, hours: (time - began)/3600000 });
      }
      starts.delete(event.entity_id);
    }
  }
  const durations = cycles.map(c=>c.hours).sort((a,b)=>a-b);
  const quantile = p => durations.length ? durations[Math.max(0,Math.ceil(durations.length*p)-1)] : null;
  const median = durations.length ? (durations[Math.floor((durations.length-1)/2)] + durations[Math.ceil((durations.length-1)/2)])/2 : null;
  const ages = tasks.filter(t=>t.status !== 'done').map(t=>({ task:t, days:(end-Date.parse(t.created_at))/DAY })).filter(a=>Number.isFinite(a.days)&&a.days>=0).sort((a,b)=>b.days-a.days);
  return {
    throughput: Array.from({length:days},(_,index)=>{const date=flowDate(start+index*DAY);return {date,count:throughput.get(date)||0};}),
    cycles, medianHours:median, p85Hours:quantile(.85), completedTransitions:[...throughput.values()].reduce((a,b)=>a+b,0), ages,
    timedItems:new Set(cycles.map(c=>c.taskId)).size,
  };
}
