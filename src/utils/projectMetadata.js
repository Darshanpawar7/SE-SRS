// Project metadata rules (PMS-F-002): a unique key, a name and a valid date range.
const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isCalendarDate = (value) => {
  if (!DATE_PATTERN.test(value ?? '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// Returns the cleaned values or throws an Error whose message can be shown as-is.
// `otherProjects` must not include the project being edited.
export function validateProjectMetadata(values, otherProjects = []) {
  const key = String(values.key ?? '').trim().toUpperCase();
  const name = String(values.name ?? '').trim();
  const { start_date: startDate, target_date: targetDate } = values;

  if (!KEY_PATTERN.test(key)) {
    throw new Error('Project key must be 2 to 10 letters or digits and start with a letter, for example PMS.');
  }
  if (otherProjects.some(project => String(project.key ?? '').toUpperCase() === key)) {
    throw new Error(`Project key ${key} is already used by another project.`);
  }
  if (name.length < 3 || name.length > 80) {
    throw new Error('Project name must be 3 to 80 characters.');
  }
  if (!isCalendarDate(startDate) || !isCalendarDate(targetDate)) {
    throw new Error('Choose valid start and end dates.');
  }
  if (targetDate < startDate) {
    throw new Error('End date must be on or after the start date.');
  }
  return { key, name, start_date: startDate, target_date: targetDate };
}

// One source for how a project is shown, so every view displays the same saved values.
export function describeProject(project) {
  if (!project) return { key: 'PMS', name: 'Project Management', dates: '' };
  const dates = project.start_date && project.target_date
    ? `${project.start_date} → ${project.target_date}`
    : '';
  return { key: project.key, name: project.name, dates };
}
