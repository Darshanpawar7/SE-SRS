import { TASK_PRIORITIES, TASK_STATUSES, TEAM_MEMBERS } from './constants';
import { flowDate, flowMetrics } from './flowAnalytics';
import { csvCell } from './taskExplorer';

const DAY = 86400000;
export function validReportDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && flowDate(time) === value;
}
export function reportRange(from, to, now = new Date()) {
  const today = flowDate(now);
  if (!validReportDate(from) || !validReportDate(to)) return { error: 'Choose valid UTC start and end dates.' };
  const days = Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1;
  if (days < 1 || days > 90) return { error: 'Choose a range of 1–90 UTC dates.' };
  if (to > today) return { error: 'The reporting range cannot include future dates.' };
  return { from, to, days, end: new Date(Math.min(new Date(now).getTime(), Date.parse(`${to}T23:59:59.999Z`))) };
}
export function rollingRange(days = 28, now = new Date()) {
  return { from: flowDate(Date.parse(flowDate(now)) - (days - 1) * DAY), to: flowDate(now) };
}
export const reportPoints = task => Number.isFinite(Number(task.story_points)) ? Math.max(0, Number(task.story_points)) : 0;
export function buildSprintReport(tasks, activities, range, now = new Date()) {
  if (range.error) return null;
  const history = flowMetrics(tasks, activities, range.end, range.days);
  const states = [...TASK_STATUSES];
  if (tasks.some(t => !states.some(s => s.id === t.status))) states.push({ id: 'unknown', label: 'Unknown status', color: '#737b85' });
  const statuses = states.map(s => ({ ...s, count: tasks.filter(t => (s.id === 'unknown' ? !TASK_STATUSES.some(v => v.id === t.status) : t.status === s.id)).length }));
  const priorityIds = TASK_PRIORITIES.map(p => p.id);
  const priorities = [...TASK_PRIORITIES, ...(tasks.some(t => !priorityIds.includes(t.priority)) ? [{ id: 'unknown', label: 'Unknown priority', color: '#737b85' }] : [])].map(p => {
    const items = tasks.filter(t => p.id === 'unknown' ? !priorityIds.includes(t.priority) : t.priority === p.id);
    return { ...p, count: items.length, states: statuses.map(s => ({ ...s, count: items.filter(t => s.id === 'unknown' ? !TASK_STATUSES.some(v => v.id === t.status) : t.status === s.id).length })) };
  });
  const memberIds = TEAM_MEMBERS.map(m => m.id);
  const owners = [...TEAM_MEMBERS, { id: 'unassigned', name: 'Unassigned / unknown', color: '#737b85' }].map(m => {
    const items = tasks.filter(t => m.id === 'unassigned' ? !memberIds.includes(t.assignee_id) : t.assignee_id === m.id);
    return { ...m, count: items.length, points: items.reduce((n, t) => n + reportPoints(t), 0), openPoints: items.filter(t => t.status !== 'done').reduce((n, t) => n + reportPoints(t), 0) };
  });
  const points = tasks.reduce((n, t) => n + reportPoints(t), 0);
  const donePoints = tasks.filter(t => t.status === 'done').reduce((n, t) => n + reportPoints(t), 0);
  return { ...history, statuses, priorities, owners, points, donePoints, completion: points ? Math.round(donePoints / points * 100) : null,
    // Open age always describes now, independently of the historical date picker.
    ages: flowMetrics(tasks, [], now).ages };
}
export function reportTasks(tasks, report, selection) {
  if (!selection) return tasks;
  if (selection.kind === 'date') {
    const ids = new Set(report.completions.filter(c => flowDate(c.timestamp) === selection.id).map(c => c.taskId));
    return tasks.filter(t => ids.has(t.id));
  }
  if (selection.kind === 'owner') return tasks.filter(t => selection.id === 'unassigned' ? !TEAM_MEMBERS.some(m => m.id === t.assignee_id) : t.assignee_id === selection.id);
  const enums = selection.kind === 'status' ? TASK_STATUSES : TASK_PRIORITIES;
  return tasks.filter(t => selection.id === 'unknown' ? !enums.some(v => v.id === t[selection.kind]) : t[selection.kind] === selection.id);
}
export function dailyReportCsv(report) {
  return '\ufeff' + [['UTC date', 'Recorded completion transitions'], ...report.throughput.map(d => [d.date, d.count])].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
