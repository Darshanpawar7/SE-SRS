import { calculateSprintMetrics, selectSprintTasks } from './estimation';

const DAY_MS = 86400000;
export const utcDate = (now = new Date()) => new Date(now).toISOString().slice(0, 10);
const dateTime = value => Date.parse(`${value}T00:00:00.000Z`);

// One latest observed value per sprint/date; editing today never rewrites yesterday.
export function recordDailyProgress(history, sprints, tasks, now = new Date()) {
  const date = utcDate(now);
  const next = { ...history };
  for (const sprint of sprints) {
    const previous = history[sprint.id] || [];
    if (previous.some(entry => entry.status === 'completed')) continue;
    const metrics = calculateSprintMetrics(selectSprintTasks(tasks, sprint.id));
    const snapshot = {
      date,
      totalPoints: metrics.totalStoryPoints,
      remainingPoints: metrics.remainingStoryPoints,
      status: sprint.status,
    };
    next[sprint.id] = [...previous.filter(entry => entry.date !== date), snapshot]
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return next;
}

export function generateRecordedBurndown(sprint, history = [], now = new Date()) {
  if (!sprint) return [];
  const start = dateTime(sprint.start_date);
  const end = dateTime(sprint.end_date);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const today = utcDate(now);
  const observed = history.filter(entry => entry.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const baseline = observed.filter(entry => entry.date <= sprint.start_date).at(-1) || observed[0];
  const total = baseline?.totalPoints ?? 0;
  const latestDate = observed.at(-1)?.date;
  // Overdue work is shown on the date it was observed, never backdated to the deadline.
  const chartEnd = Math.max(end, latestDate ? dateTime(latestDate) : end);
  const duration = (end - start) / DAY_MS;
  const byDate = new Map(observed.map(entry => [entry.date, entry]));
  const result = [];
  for (let time = start, day = 0; time <= chartEnd; time += DAY_MS, day++) {
    const date = utcDate(time);
    const snapshot = byDate.get(date);
    result.push({
      day: `Day ${day}`, date,
      ideal: duration === 0 ? 0 : Math.max(0, Math.round(total * (1 - day / duration) * 10) / 10),
      actual: date <= today && snapshot ? snapshot.remainingPoints : null,
    });
  }
  return result;
}

// Missing observations break the actual line instead of implying invented progress.
export function observedSegments(data) {
  const segments = [];
  let current = [];
  data.forEach((point, index) => {
    if (point.actual === null) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push({ ...point, index });
  });
  if (current.length) segments.push(current);
  return segments;
}
