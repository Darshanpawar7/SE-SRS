// Task labels are short lowercase tags shown as pills on task cards (PMS-F-007).
export const MAX_LABEL_LENGTH = 24;

// "  #Front End " -> "front-end". Anything that is not a usable tag becomes ''.
export function normalizeLabel(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/^#+/, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, MAX_LABEL_LENGTH);
}

// Each label once, in first-seen order, so a card never shows the same pill twice.
export function getDistinctLabels(labels) {
  if (!Array.isArray(labels)) return [];
  return [...new Set(labels.map(normalizeLabel).filter(Boolean))];
}

export function addLabel(labels, value) {
  return getDistinctLabels([...getDistinctLabels(labels), value]);
}

// Accepts comma-separated input such as "ui, api".
export function addLabels(labels, text) {
  return String(text).split(',').reduce(addLabel, getDistinctLabels(labels));
}

export function removeLabel(labels, value) {
  const target = normalizeLabel(value);
  return getDistinctLabels(labels).filter(label => label !== target);
}
