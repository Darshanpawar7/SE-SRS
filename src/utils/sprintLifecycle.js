export function validateSprint(sprint) {
  if (!sprint.name?.trim()) throw new Error('Sprint name is required.');
  for (const key of ['start_date', 'end_date']) {
    const value = sprint[key];
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error('Choose valid start and end dates.');
    }
  }
  if (sprint.end_date < sprint.start_date) throw new Error('End date must be on or after start date.');
  return { ...sprint, name: sprint.name.trim() };
}

export function transitionSprint(sprints, sprintId, status) {
  const sprint = sprints.find(item => item.id === sprintId);
  if (!sprint) throw new Error('Sprint not found.');
  const nextStatus = { planned: 'active', active: 'completed' }[sprint.status];
  if (!nextStatus || status !== nextStatus) {
    throw new Error('Sprints must move from planned to active to completed.');
  }
  if (status === 'active') {
    validateSprint(sprint);
    if (sprints.some(item => item.id !== sprintId && item.project_id === sprint.project_id && item.status === 'active')) {
      throw new Error('Complete the current active sprint before starting another.');
    }
  }
  return sprints.map(item => item.id === sprintId ? { ...item, status } : item);
}

export function resolveSelectedSprint(sprints, savedId) {
  return sprints.find(sprint => sprint.id === savedId)?.id
    ?? sprints.find(sprint => sprint.status === 'active')?.id
    ?? sprints[0]?.id
    ?? null;
}
