import { recordDailyProgress } from '../utils/burndown';
// Supabase Client with graceful Offline / Mock fallback
import { validateStoryPoints } from '../utils/storyPoints';
import { isAuditRecord } from '../utils/auditTrail';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PROJECT, INITIAL_SPRINTS, INITIAL_TASKS, INITIAL_ACTIVITY } from './mockData';

// Retrieve credentials from localStorage or environment variables
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = localStorage.getItem('supabase_url') || envUrl;
  const localKey = localStorage.getItem('supabase_key') || envKey;

  const isConfigured = Boolean(localUrl && localKey && localUrl.startsWith('https://'));
  return { url: localUrl, key: localKey, isConfigured };
};

export const saveSupabaseConfig = (url, key) => {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_key', key.trim());
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
};

let supabaseInstance = null;

export const getSupabase = () => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (isConfigured) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(url, key);
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        return null;
      }
    }
    return supabaseInstance;
  }
  return null;
};

// Storage keys for offline persistence
const STORAGE_KEYS = {
  PROJECT: 'sprintflow_project',
  SPRINTS: 'sprintflow_sprints',
  TASKS: 'sprintflow_tasks',
  ACTIVITY: 'sprintflow_activity',
  SELECTED_SPRINT: 'sprintflow_selected_sprint',
  BURNDOWN: 'sprintflow_burndown_history'
};

// Audit records come back frozen: the application can read them but never edit them.
const readActivity = () => {
  const local = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  if (!local) localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITY));
  const records = local ? JSON.parse(local) : INITIAL_ACTIVITY;
  return records.map(record => Object.freeze({ ...record }));
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

  async getProject() {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('projects').select('*').limit(1).single();
      if (!error && data) return data;
    }
    const local = localStorage.getItem(STORAGE_KEYS.PROJECT);
    if (local) return JSON.parse(local);
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(INITIAL_PROJECT));
    return INITIAL_PROJECT;
  },

  async getSprints() {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('sprints').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    const local = localStorage.getItem(STORAGE_KEYS.SPRINTS);
    if (local) return JSON.parse(local);
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(INITIAL_SPRINTS));
    return INITIAL_SPRINTS;
  },

  async getTasks() {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    const local = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (local) return JSON.parse(local);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  },

  async saveTasks(tasks) {
    tasks.forEach(task => validateStoryPoints(task.story_points));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    const supabase = getSupabase();
    if (supabase) {
      // Upsert to Supabase
      try {
        await supabase.from('tasks').upsert(tasks);
      } catch (e) {
        console.warn('Supabase task sync note:', e);
      }
    }
  },

  async saveSprints(sprints) {
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('sprints').upsert(sprints);
      } catch (e) {
        console.warn('Supabase sprint sync note:', e);
      }
    }
  },

  async getActivity() {
    return readActivity();
  },

  // Append-only: a new record goes on top and the history is never truncated.
  // The read and the write happen in one synchronous step, so two records logged at
  // the same time cannot overwrite each other. There is deliberately no method to
  // edit or remove an audit record.
  async logActivity(record) {
    if (!isAuditRecord(record)) {
      throw new Error('Only complete audit records (actor, type, timestamp) can be logged.');
    }
    const updated = [Object.freeze({ ...record }), ...readActivity()];
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
    return updated;
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

