const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidCalendarDate(value) {
  if (!DATE_PATTERN.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateProjectDateRange(startDate, targetDate) {
  if (!startDate || !targetDate) return { valid: false, error: 'Choose both a start date and target date.' };
  if (!isValidCalendarDate(startDate) || !isValidCalendarDate(targetDate)) return { valid: false, error: 'Choose valid project dates.' };
  if (targetDate < startDate) return { valid: false, error: 'Target date cannot be before the start date' };
  return { valid: true, error: '' };
}
