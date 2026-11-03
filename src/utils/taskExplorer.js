const PRIORITY = { critical:0, high:1, medium:2, low:3 };
export function exploreTasks(tasks, { query = '', status = 'all', priority = 'all', assignee = 'all', sort = 'priority', dueFrom = '', dueTo = '' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return tasks.filter(task => (status === 'all' || task.status === status)
    && (priority === 'all' || task.priority === priority)
    && (assignee === 'all' || (assignee === 'unassigned' ? !task.assignee_id : task.assignee_id === assignee))
    && (!dueFrom || (task.due_date && task.due_date >= dueFrom))
    && (!dueTo || (task.due_date && task.due_date <= dueTo))
    && (!needle || `${task.title} ${task.description || ''} ${task.assignee_name || ''} ${(task.labels || []).join(' ')}`.toLocaleLowerCase().includes(needle)))
    .sort((a,b) => (sort === 'points' ? Number(b.story_points) - Number(a.story_points)
      : sort === 'title' ? a.title.localeCompare(b.title)
      : sort === 'due' ? (a.due_date || '9999').localeCompare(b.due_date || '9999')
      : sort === 'oldest' ? (Number.isFinite(Date.parse(a.created_at)) ? Date.parse(a.created_at) : Infinity) - (Number.isFinite(Date.parse(b.created_at)) ? Date.parse(b.created_at) : Infinity)
      : sort === 'updated' ? (Number.isFinite(Date.parse(b.updated_at)) ? Date.parse(b.updated_at) : -Infinity) - (Number.isFinite(Date.parse(a.updated_at)) ? Date.parse(a.updated_at) : -Infinity)
      : (PRIORITY[a.priority] ?? 4) - (PRIORITY[b.priority] ?? 4)) || a.title.localeCompare(b.title) || String(a.id).localeCompare(String(b.id)));
}
// Treat user text as data when a CSV is opened in spreadsheet software.
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^\s*[=+\-@]|^[\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
export function tasksToCsv(tasks, sprints = []) {
  const rows = [['ID','Title','Status','Priority','Story points','Assignee','Sprint','Labels','Due date','Blocker'],
    ...tasks.map(task => [task.id,task.title,task.status,task.priority,task.story_points,task.assignee_name,
      sprints.find(sprint => sprint.id === task.sprint_id)?.name || 'Unscheduled',(task.labels || []).join('; '),task.due_date,task.blocked_reason])];
  return '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
