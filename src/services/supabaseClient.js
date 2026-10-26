import { recordDailyProgress } from '../utils/burndown';
// Supabase Client with graceful Offline / Mock fallback
import { validateStoryPoints } from '../utils/storyPoints';
import { isAuditRecord } from '../utils/auditTrail';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PROJECT, INITIAL_SPRINTS, INITIAL_TASKS, INITIAL_ACTIVITY } from './mockData';

// A usable Supabase project URL: https, a host name, and no embedded credentials.
export const isValidSupabaseUrl = (value) => {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};

// Retrieve credentials from localStorage or environment variables
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('supabase_url') || envUrl;
  const localKey = localStorage.getItem('supabase_key') || envKey;

  const isConfigured = Boolean(localUrl && localKey && isValidSupabaseUrl(localUrl));
  return { url: localUrl, key: localKey, isConfigured };
};

// Unusable credentials are rejected before anything is saved, so a typo never
// replaces a working configuration (TC-SET-01).
export const saveSupabaseConfig = (url, key) => {
  const cleanUrl = String(url ?? '').trim().replace(/\/+$/, '');
  const cleanKey = String(key ?? '').trim();
  if (!isValidSupabaseUrl(cleanUrl)) {
    throw new Error('Enter a valid https:// Supabase project URL, for example https://your-project.supabase.co.');
  }
  if (!cleanKey) throw new Error('Enter the Supabase anon public key.');
  localStorage.setItem('supabase_url', cleanUrl);
  localStorage.setItem('supabase_key', cleanKey);
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
};

let supabaseInstance = null;
let supabaseInstanceKey = '';
let injectedClient;

// Supplies a client directly (used by tests); pass undefined to use the configured one again.
export const setSupabaseClient = (client) => {
  injectedClient = client;
};

export const getSupabase = () => {
  if (injectedClient !== undefined) return injectedClient;
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  // Recreate the client when the credentials change instead of reusing a stale one.
  const instanceKey = `${url}|${key}`;
  if (!supabaseInstance || supabaseInstanceKey !== instanceKey) {
    try {
      supabaseInstance = createClient(url, key);
      supabaseInstanceKey = instanceKey;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

// Result of the most recent Supabase request, shown in the navbar and settings.
let syncStatus = { state: 'local', message: '', at: null };
const syncListeners = new Set();

export const getSyncStatus = () => syncStatus;

export const subscribeSyncStatus = (listener) => {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
};

const setSyncStatus = (state, message) => {
  syncStatus = { state, message, at: new Date().toISOString() };
  syncListeners.forEach(listener => listener(syncStatus));
};

// Runs one Supabase request. supabase-js reports failures in `error` rather than
// throwing, so both paths are checked. Failures are surfaced, never thrown: the
// copy already written to this browser is always kept.
async function runCloud(label, request) {
  try {
    const { data, error } = await request();
    if (error) throw error;
    setSyncStatus('synced', 'All changes are synced with Supabase.');
    return { ok: true, data };
  } catch (err) {
    const message = `${label} failed to sync with Supabase: ${err?.message || err}. Your changes are kept in this browser.`;
    console.warn(message);
    setSyncStatus('error', message);
    return { ok: false, data: null };
  }
}

// Rows sent to Supabase carry only the columns defined in database/schema.sql.
export const TASK_COLUMNS = ['id', 'project_id', 'sprint_id', 'title', 'description', 'status', 'priority', 'story_points', 'assignee_id', 'assignee_name', 'reporter_name', 'labels', 'created_at', 'updated_at'];
export const SPRINT_COLUMNS = ['id', 'project_id', 'name', 'goal', 'status', 'start_date', 'end_date', 'total_points', 'completed_points'];
export const PROJECT_COLUMNS = ['id', 'name', 'key', 'description', 'owner_id', 'status', 'start_date', 'target_date'];

const pickColumns = (record, columns) =>
  Object.fromEntries(columns.filter(column => record[column] !== undefined).map(column => [column, record[column]]));

export const toTaskRow = task => pickColumns(task, TASK_COLUMNS);
export const toSprintRow = sprint => pickColumns(sprint, SPRINT_COLUMNS);
export const toProjectRow = project => pickColumns(project, PROJECT_COLUMNS);
export const toActivityRow = (record, projectId) => ({
  id: record.id,
  project_id: projectId ?? null,
  user_name: record.actor,
  action: record.action,
  entity_type: record.entity_type,
  entity_title: record.target,
  details: JSON.stringify({
    type: record.type, entity_id: record.entity_id, from: record.from, to: record.to, details: record.details
  }),
  created_at: record.timestamp
});

// Storage keys for offline persistence
const STORAGE_KEYS = {
  PROJECT: 'sprintflow_project',
  SPRINTS: 'sprintflow_sprints',
  TASKS: 'sprintflow_tasks',
  ACTIVITY: 'sprintflow_activity',
  SELECTED_SPRINT: 'sprintflow_selected_sprint',
  BURNDOWN: 'sprintflow_burndown_history'
};

const readLocal = (key, fallback) => {
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
};

const writeLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// Cloud tables that were empty on the last read. Their local data is published on load.
const emptyCloudTables = new Set();

// Audit records come back frozen: the application can read them but never edit them.
const readActivity = () => {
  const local = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  if (!local) localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITY));
  const records = local ? JSON.parse(local) : INITIAL_ACTIVITY;
  return records.map(record => Object.freeze({ ...record }));
};

const requireAuditRecord = (record) => {
  if (!isAuditRecord(record)) {
    throw new Error('Only complete audit records (actor, type, timestamp) can be logged.');
  }
};

// Adds one record to the browser's audit history in a single synchronous step, so two
// records written together cannot overwrite each other. Returns the updated history.
const appendActivity = (record) => {
  const updated = [Object.freeze({ ...record }), ...readActivity()];
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
  return updated;
};

// Names the task in the error, so an invalid estimate stored by an older build can be found.
const validateTaskEstimate = (task) => {
  try {
    validateStoryPoints(task.story_points);
  } catch (err) {
    throw new Error(`"${task.title ?? task.id}" cannot be saved: ${err.message}`);
  }
};

// Earlier builds seeded one task with a 6-point estimate, which the Fibonacci rule
// rejects, so every board save failed in browsers that still hold it. It gets the
// same correction as the seed data.
const LEGACY_SEED_TASK_ID = 'task-106';

const readLocalTasks = () => {
  const tasks = readLocal(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  if (!tasks.some(task => task.id === LEGACY_SEED_TASK_ID && task.story_points === 6)) return tasks;
  const repaired = tasks.map(task => (
    task.id === LEGACY_SEED_TASK_ID && task.story_points === 6 ? { ...task, story_points: 5 } : task
  ));
  writeLocal(STORAGE_KEYS.TASKS, repaired);
  return repaired;
};

// Unified Data Service: operates on Supabase when connected, else localStorage
export const DataService = {
  getSelectedSprint() {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_SPRINT);
  },

  saveSelectedSprint(sprintId) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SPRINT, sprintId);
  },

  recordBurndown(sprints, tasks, now = new Date()) {
    const saved = localStorage.getItem(STORAGE_KEYS.BURNDOWN);
    const history = recordDailyProgress(saved ? JSON.parse(saved) : {}, sprints, tasks, now);
    localStorage.setItem(STORAGE_KEYS.BURNDOWN, JSON.stringify(history));
    return history;
  },

  // Loads everything. On first connection to an empty Supabase project, this browser's
  // data is published in foreign-key order: project, then sprints, then tasks.
  async loadAll() {
    const project = await this.getProject();
    const [sprints, tasks, activities] = await Promise.all([
      this.getSprints(),
      this.getTasks(),
      this.getActivity()
    ]);
    if (emptyCloudTables.size > 0) await this.publishAll({ project, sprints, tasks });
    return { project, sprints, tasks, activities };
  },

  async publishAll({ project, sprints, tasks }) {
    emptyCloudTables.clear();
    return (await this.pushProject(project)) && (await this.pushSprints(sprints)) && (await this.pushTasks(tasks));
  },

  async getProject() {
    const local = readLocal(STORAGE_KEYS.PROJECT, INITIAL_PROJECT);
    const supabase = getSupabase();
    if (!supabase) return local;
    const { ok, data } = await runCloud('Loading the project', () => supabase.from('projects').select('*').limit(1));
    if (!ok) return local;
    if (!data?.length) {
      emptyCloudTables.add('projects');
      return local;
    }
    const project = { ...local, ...data[0] };
    writeLocal(STORAGE_KEYS.PROJECT, project);
    return project;
  },

  async getSprints() {
    const local = readLocal(STORAGE_KEYS.SPRINTS, INITIAL_SPRINTS);
    const supabase = getSupabase();
    if (!supabase) return local;
    const { ok, data } = await runCloud('Loading sprints', () =>
      supabase.from('sprints').select('*').order('start_date', { ascending: true }));
    if (!ok) return local;
    if (!data?.length) {
      emptyCloudTables.add('sprints');
      return local;
    }
    writeLocal(STORAGE_KEYS.SPRINTS, data);
    return data;
  },

  async getTasks() {
    const local = readLocalTasks();
    const supabase = getSupabase();
    if (!supabase) return local;
    const { ok, data } = await runCloud('Loading tasks', () =>
      supabase.from('tasks').select('*').order('created_at', { ascending: false }));
    if (!ok) return local;
    if (!data?.length) {
      emptyCloudTables.add('tasks');
      return local;
    }
    writeLocal(STORAGE_KEYS.TASKS, data);
    return data;
  },

  // A change and its audit record are written to this browser together, before anything
  // is sent, so closing the tab during a slow request loses neither of them.
  async saveTasks(tasks, auditRecord = null) {
    tasks.forEach(validateTaskEstimate);
    if (auditRecord) requireAuditRecord(auditRecord);
    writeLocal(STORAGE_KEYS.TASKS, tasks);
    if (auditRecord) appendActivity(auditRecord);
    await this.pushTasks(tasks);
    if (auditRecord) await this.pushActivity(auditRecord);
  },

  async pushTasks(tasks) {
    const supabase = getSupabase();
    if (!supabase || tasks.length === 0) return true;
    return (await runCloud('Saving tasks', () => supabase.from('tasks').upsert(tasks.map(toTaskRow)))).ok;
  },

  // Removes one task here and in Supabase, so a deleted task cannot come back on the next load.
  async deleteTask(taskId, remainingTasks, auditRecord = null) {
    if (auditRecord) requireAuditRecord(auditRecord);
    writeLocal(STORAGE_KEYS.TASKS, remainingTasks);
    if (auditRecord) appendActivity(auditRecord);
    const supabase = getSupabase();
    if (!supabase) return true;
    const { ok } = await runCloud('Deleting a task', () => supabase.from('tasks').delete().eq('id', taskId));
    if (auditRecord) await this.pushActivity(auditRecord);
    return ok;
  },

  async saveSprints(sprints, auditRecord = null) {
    if (auditRecord) requireAuditRecord(auditRecord);
    writeLocal(STORAGE_KEYS.SPRINTS, sprints);
    if (auditRecord) appendActivity(auditRecord);
    await this.pushSprints(sprints);
    if (auditRecord) await this.pushActivity(auditRecord);
  },

  async pushSprints(sprints) {
    const supabase = getSupabase();
    if (!supabase || sprints.length === 0) return true;
    return (await runCloud('Saving sprints', () => supabase.from('sprints').upsert(sprints.map(toSprintRow)))).ok;
  },

  async saveProject(project, auditRecord = null) {
    if (auditRecord) requireAuditRecord(auditRecord);
    writeLocal(STORAGE_KEYS.PROJECT, project);
    if (auditRecord) appendActivity(auditRecord);
    await this.pushProject(project);
    if (auditRecord) await this.pushActivity(auditRecord);
  },

  async pushProject(project) {
    const supabase = getSupabase();
    if (!supabase || !project) return true;
    return (await runCloud('Saving the project', () => supabase.from('projects').upsert(toProjectRow(project)))).ok;
  },

  async getActivity() {
    return readActivity();
  },

  // Append-only: a new record goes on top and the history is never truncated.
  // There is deliberately no method to edit or remove an audit record.
  async logActivity(record) {
    requireAuditRecord(record);
    const updated = appendActivity(record);
    await this.pushActivity(record);
    return updated;
  },

  // A stored record is never overwritten: a record whose id already exists is skipped
  // (INSERT ... ON CONFLICT DO NOTHING), so sending it again is harmless.
  async pushActivity(record) {
    const supabase = getSupabase();
    if (!supabase) return true;
    const projectId = readLocal(STORAGE_KEYS.PROJECT, INITIAL_PROJECT).id;
    return (await runCloud('Recording the audit trail', () =>
      supabase.from('activity_logs').upsert(toActivityRow(record, projectId), { onConflict: 'id', ignoreDuplicates: true }))).ok;
  },

  // Resets the demo board but keeps the audit trail, which must survive every change.
  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_SPRINT);
    localStorage.removeItem(STORAGE_KEYS.BURNDOWN);
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(INITIAL_PROJECT));
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(INITIAL_SPRINTS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  }
};
