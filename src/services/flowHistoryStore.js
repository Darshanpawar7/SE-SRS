import { snapshotFlow, retainedFlow } from '../utils/flowAnalytics';
const listeners = new Set(), cache = new Map();
const EMPTY = Object.freeze([]);
const PREFIX = 'sprintflow_flow:';
export const FLOW_MAX_KEYS = 50;
export const flowKey = (projectId, sprintId) => projectId && sprintId ? PREFIX + (localStorage.getItem('sprintflow_cache_owner') || 'demo') + ':' + projectId + ':' + sprintId : null;
export function readFlow(key) {
  if (!key) return EMPTY;
  if (!cache.has(key)) {
    try { const value=JSON.parse(localStorage.getItem(key)||'[]');cache.set(key,Array.isArray(value)?retainedFlow(value):[]); }
    catch { cache.set(key,[]); }
  }
  return cache.get(key);
}
export const subscribeFlow = callback => { listeners.add(callback); return ()=>listeners.delete(callback); };
export function pruneFlowKeys(now = new Date(), keep = null) {
  const keys = new Set(cache.keys());
  if (typeof localStorage.key === 'function') {
    for (let index=0;index<localStorage.length;index++) {
      const key=localStorage.key(index);if(key?.startsWith(PREFIX))keys.add(key);
    }
  }
  const remaining=[];
  for (const key of keys) {
    let history=[];
    try { const parsed=JSON.parse(localStorage.getItem(key)||'[]');history=retainedFlow(Array.isArray(parsed)?parsed:[],now); } catch { /* Disposable derived history. */ }
    if(!history.length&&key!==keep){localStorage.removeItem(key);cache.delete(key);continue;}
    if(history.length)localStorage.setItem(key,JSON.stringify(history));
    remaining.push({key,date:history.at(-1)?.date||''});
  }
  remaining.sort((a,b)=>Number(b.key===keep)-Number(a.key===keep)||b.date.localeCompare(a.date)||a.key.localeCompare(b.key));
  for(const {key} of remaining.slice(FLOW_MAX_KEYS)){localStorage.removeItem(key);cache.delete(key);}
}
export function recordFlow(key,tasks,now=new Date()) {
  if (!key) return;
  const old=readFlow(key), next=snapshotFlow(old,tasks,now);
  pruneFlowKeys(now,key);
  if (JSON.stringify(old)===JSON.stringify(next)) return;
  if (old.length===next.length&&JSON.stringify(old.at(-1)?.counts)===JSON.stringify(next.at(-1)?.counts)&&old.at(-1)?.date===next.at(-1)?.date) return;
  localStorage.setItem(key,JSON.stringify(next));cache.set(key,next);listeners.forEach(fn=>fn());
}
