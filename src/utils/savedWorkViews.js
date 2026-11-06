import { TASK_PRIORITIES, TASK_STATUSES, TEAM_MEMBERS } from './constants';
import { WORK_VIEWS } from './workViews';
import { validateWorkSignals } from './workSignals';

export const EMPTY_WORK_FILTERS = Object.freeze({query:'',status:'all',priority:'all',assignee:'all',sort:'priority',dueFrom:'',dueTo:''});
export const savedViewsKey = (owner, member, project) => `sprintflow_views:${JSON.stringify([owner || 'demo',member,project])}`;
const allowed = (value, values, fallback) => values.includes(value) ? value : fallback;
const date = value => { try { return validateWorkSignals({due_date:value}).due_date || ''; } catch { return ''; } };
export function normalizeWorkView(value = {}) {
  const f = value?.filters || {};
  return {scope:allowed(value?.scope,['sprint','project','backlog'],'sprint'),
    view:allowed(value?.view,WORK_VIEWS.map(v=>v.id),'all'), attention:allowed(value?.attention,['all','blocked','overdue','dueToday'],'all'),
    filters:{query:typeof f.query==='string'?f.query.slice(0,200):'',status:allowed(f.status,['all',...TASK_STATUSES.map(s=>s.id)],'all'),priority:allowed(f.priority,['all',...TASK_PRIORITIES.map(p=>p.id)],'all'),assignee:allowed(f.assignee,['all','unassigned',...TEAM_MEMBERS.map(m=>m.id)],'all'),sort:allowed(f.sort,['priority','points','title','due','oldest','updated'],'priority'),dueFrom:date(f.dueFrom),dueTo:date(f.dueTo)}};
}
export function parseSavedViews(raw) {
  try {
    const rows = JSON.parse(raw || '[]');
    if (!Array.isArray(rows)) return [];
    const seen = new Set();
    return rows.filter(r=>r&&typeof r.id==='string'&&r.id.length<=100&&typeof r.name==='string'&&r.name.trim()&&!seen.has(r.id)&&seen.add(r.id)).slice(0,12).map(r=>({id:r.id,name:r.name.trim().slice(0,50),...normalizeWorkView(r)}));
  } catch { return []; }
}
export function putSavedView(rows, name, state, id) {
  const clean = name.trim().slice(0,50);
  if (!clean) throw new Error('Give this view a name.');
  if (rows.length >= 12) throw new Error('Keep up to 12 saved views. Remove one before adding another.');
  return [...rows,{id,name:clean,...normalizeWorkView(state)}];
}
