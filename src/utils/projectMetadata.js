// Project metadata rules (PMS-F-002): a unique key, a name and a valid date range.
import { sanitizeUserText } from './userText';
import { isValidCalendarDate, validateProjectDateRange } from './projectDates';
const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;
const isCalendarDate = isValidCalendarDate;

// Returns the cleaned values or throws an Error whose message can be shown as-is.
// `otherProjects` must not include the project being edited.
export function validateProjectMetadata(values, otherProjects = []) {
  const key = String(values.key ?? '').trim().toUpperCase();
  const name = sanitizeUserText(values.name, { field: 'Project name', maxLength: 80, allowNewlines: false });
  const description = sanitizeUserText(values.description, { field: 'Project description', maxLength: 2000 });
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
  const dateRange = validateProjectDateRange(startDate, targetDate);
  if (!dateRange.valid) throw new Error(dateRange.error);
  return { key, name, description, start_date: startDate, target_date: targetDate };
}

// One source for how a project is shown, so every view displays the same saved values.
export function describeProject(project) {
  if (!project) return { key: 'PMS', name: 'Project Management', dates: '' };
  const dates = project.start_date && project.target_date
    ? `${project.start_date} → ${project.target_date}`
    : '';
  return { key: project.key, name: sanitizeUserText(project.name), dates };
}
