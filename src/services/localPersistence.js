// A write-ahead journal makes a local entity + audit + retry-intent save recoverable.
// localStorage.setItem is atomic per key; there is no transaction across keys.
const JOURNAL_KEY = 'sprintflow_save_journal';

export function recoverLocalSave() {
  const raw = localStorage.getItem(JOURNAL_KEY);
  if (!raw) return;
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.some(entry => !Array.isArray(entry)
    || entry.length !== 2 || typeof entry[0] !== 'string' || typeof entry[1] !== 'string'
    || !entry[0].startsWith('sprintflow_') || entry[0] === JOURNAL_KEY)) {
    throw new Error('Saved recovery journal is invalid. Preserve browser data before attempting recovery.');
  }
  for (const [key, value] of entries) localStorage.setItem(key, value);
  localStorage.removeItem(JOURNAL_KEY);
}

export function commitLocalSave(values) {
  recoverLocalSave();
  const entries = Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]);
  // If this fails (quota/storage disabled), no entity or audit record has changed.
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  // An interruption here leaves the journal intact; the next read replays it.
  recoverLocalSave();
}
