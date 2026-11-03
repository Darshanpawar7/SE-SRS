import { snapshotFlow } from '../utils/flowAnalytics';
const listeners = new Set(), cache = new Map();
export const flowKey = (projectId, sprintId) => projectId && sprintId ? `sprintflow_flow:${localStorage.getItem('sprintflow_cache_owner') || 'demo'}:${projectId}:${sprintId}` : null;
export function readFlow(key) {
  if (!key) return EMPTY;
  if (!cache.has(key)) {
    try { const value=JSON.parse(localStorage.getItem(key)||'[]');cache.set(key,Array.isArray(value)?value.filter(x=>x.date&&x.counts):[]); }
    catch { cache.set(key,[]); }
  }
  return cache.get(key);
}
const EMPTY = Object.freeze([]);
export const subscribeFlow = callback => { listeners.add(callback); return ()=>listeners.delete(callback); };
export function recordFlow(key,tasks,now=new Date()) {
  if (!key) return;
  const old=readFlow(key), next=snapshotFlow(old,tasks,now);
  // A no-change render is not a new observation and does not trigger a render loop.
  if (JSON.stringify(old.at(-1)?.counts)===JSON.stringify(next.at(-1)?.counts) && old.at(-1)?.date===next.at(-1)?.date) return;
  localStorage.setItem(key,JSON.stringify(next));cache.set(key,next);listeners.forEach(fn=>fn());
}
