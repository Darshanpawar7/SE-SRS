import React, { useRef, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TASK_STATUSES, TASK_PRIORITIES, TEAM_MEMBERS } from '../../utils/constants';
import { exploreTasks, tasksToCsv } from '../../utils/taskExplorer';
import './taskExplorer.css';
import { PriorityBadge, StatusBadge } from './TaskSignals';
import { useAuth } from '../../context/AuthContext';
import { selectSprintTasks } from '../../utils/estimation';
import { applyWorkView, WORK_VIEWS } from '../../utils/workViews';
import WorkSignals from './WorkSignals';
import {workSignals} from '../../utils/workSignals';
import SignalIcon from './SignalIcon';
import TaskPreviewDrawer from './TaskPreviewDrawer';
import { EMPTY_WORK_FILTERS, savedViewsKey, parseSavedViews, putSavedView } from '../../utils/savedWorkViews';
export default function TaskExplorer({ onOpenTask }) {
  const { project } = useProject();
  const { currentUser } = useAuth();
  const key = savedViewsKey(localStorage.getItem('sprintflow_cache_owner'), currentUser?.id, project?.id);
  return <ExplorerWorkspace key={key} storageKey={key} onOpenTask={onOpenTask} />;
}
function ExplorerWorkspace({ onOpenTask, storageKey }) {
  const { tasks, sprints, activeSprintId, project, activities } = useProject();
  const { currentUser } = useAuth();
  const drawer = useRef(null);
  const [previewId, setPreviewId] = useState(null);
  const [saved, setSaved] = useState(() => { try { return parseSavedViews(localStorage.getItem(storageKey)); } catch { return []; } });
  const [viewName, setViewName] = useState('');
  const [message, setMessage] = useState('');
  const persistViews = next => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaved(next); return true; }
    catch { setMessage('This browser could not save the view. Free storage and try again.'); return false; }
  };
  const preview = task => { setPreviewId(task.id); drawer.current.showModal(); };

  const [view, setView] = useState('all');
  const [attention, setAttention] = useState('all');
  const [scope, setScope] = useState('sprint');
  const [filters, setFilters] = useState({ ...EMPTY_WORK_FILTERS });
  const update = (key, value) => setFilters(old => ({...old,[key]:value}));
  const invalidDueRange = filters.dueFrom && filters.dueTo && filters.dueFrom > filters.dueTo;
  const inScope = scope === 'project' ? tasks : scope === 'backlog' ? tasks.filter(task => !task.sprint_id) : selectSprintTasks(tasks, activeSprintId);
  const members = TEAM_MEMBERS.map(member => member.id);
  const eligible = inScope.filter(task=>attention==='all'||workSignals(task)[attention]);
  const visible = exploreTasks(applyWorkView(eligible, view, currentUser?.id, members), filters);
  const points = visible.reduce((sum,task) => sum + Number(task.story_points || 0),0);
  const download = () => {
    const url = URL.createObjectURL(new Blob([tasksToCsv(visible,sprints)],{type:'text/csv;charset=utf-8'}));
    const anchor = document.createElement('a');anchor.href = url;
    anchor.download = `${String(project?.key || 'SprintFlow').replace(/[^a-z0-9_-]/gi,'_')}-work-items.csv`;
    anchor.click();setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  return <section className="explorer-page" aria-labelledby="explorer-title">
    <div className="view-header"><div><h2 className="view-title" id="explorer-title">Work items</h2><p className="view-subtitle">Search, filter and export the work in the selected scope.</p></div><button className="btn btn-primary" disabled={!visible.length} onClick={download}><SignalIcon name="export" size={15}/> Export visible rows</button></div>
    <div className="work-attention" aria-label="Attention filters">{[['all','All attention'],['blocked','Blocked'],['overdue','Overdue'],['dueToday','Due today']].map(([id,label])=><button key={id} aria-pressed={attention===id} onClick={()=>setAttention(id)}>{label}{id!=='all'&&` (${inScope.filter(task=>workSignals(task)[id]).length})`}</button>)}</div>
    <div className="table-tools" aria-label="Quick work views">{WORK_VIEWS.map(item => <button key={item.id} aria-pressed={view === item.id} onClick={()=>setView(item.id)}><SignalIcon name={item.icon} size={14}/>{item.label}<span>{applyWorkView(inScope,item.id,currentUser?.id,members).length}</span></button>)}</div>
    <div className="explorer-layout"><aside className="explorer-filter-sidebar" aria-label="Work item filters">
    <div className="saved-work-views"><h3>Saved views</h3><p>Private to this browser, account and project.</p>{saved.map(item=><div key={item.id}><button className="saved-view-open" onClick={()=>{setScope(item.scope);setView(item.view);setAttention(item.attention);setFilters(item.filters);setMessage(`Loaded ${item.name}`);}}>{item.name}</button><button aria-label={`Delete saved view ${item.name}`} onClick={()=>{if(persistViews(saved.filter(v=>v.id!==item.id)))setMessage('Saved view removed.');}}>×</button></div>)}<form onSubmit={e=>{e.preventDefault();try{const next=putSavedView(saved,viewName,{scope,view,attention,filters},crypto.randomUUID());if(persistViews(next)){setViewName('');setMessage('View saved in this browser.');}}catch(error){setMessage(error.message);}}}><label>View name<input className="form-input" maxLength={50} value={viewName} onChange={e=>setViewName(e.target.value)} placeholder="e.g. My high-priority work"/></label><button className="btn btn-secondary btn-sm" disabled={!viewName.trim()}>Save current view</button></form><p role="status">{message}</p></div>
    <div className="explorer-filters">
      <label className="explorer-search">Search work items<input className="form-input" value={filters.query} placeholder="Title, person or label…" onChange={e => update('query',e.target.value)} /></label>
      <label>Scope<select className="form-select" value={scope} onChange={e=>setScope(e.target.value)}><option value="sprint">Selected sprint</option><option value="project">Entire project</option><option value="backlog">Unscheduled backlog</option></select></label>
      <label>Status<select className="form-select" value={filters.status} onChange={e=>update('status',e.target.value)}><option value="all">All statuses</option>{TASK_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>Priority<select className="form-select" value={filters.priority} onChange={e=>update('priority',e.target.value)}><option value="all">All priorities</option>{TASK_PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <label>Assignee<select className="form-select" value={filters.assignee} onChange={e=>update('assignee',e.target.value)}><option value="all">Everyone</option><option value="unassigned">Unassigned</option>{TEAM_MEMBERS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label>Order<select className="form-select" value={filters.sort} onChange={e=>update('sort',e.target.value)}><option value="priority">Priority</option><option value="points">Points ↓</option><option value="title">Title A–Z</option><option value="due">Due date ↑</option><option value="oldest">Oldest first</option><option value="updated">Recently updated</option></select></label>
      <label>Due from (UTC)<input type="date" className="form-input" value={filters.dueFrom} onChange={e=>update('dueFrom',e.target.value)}/></label>
      <label>Due to (UTC)<input type="date" className="form-input" value={filters.dueTo} onChange={e=>update('dueTo',e.target.value)}/></label>
      <button className="btn btn-secondary" onClick={()=>{setView('all');setAttention('all');setScope('sprint');setFilters({...EMPTY_WORK_FILTERS});setMessage('Filters cleared.');}}>Clear filters</button>
    </div>
    </aside><div className="explorer-results">{invalidDueRange&&<p className="form-error" role="alert">Due from must be on or before Due to.</p>}<div className="explorer-summary" role="status"><span>{visible.length} / {inScope.length} WORK ITEMS</span><span>{points} POINTS IN VIEW</span><span>{scope === 'project' ? 'PROJECT SCOPE' : scope === 'backlog' ? 'UNSCHEDULED BACKLOG' : 'SPRINT SCOPE'} · {WORK_VIEWS.find(item=>item.id===view)?.label.toUpperCase()}</span></div>
    <div className="explorer-table-wrap"><table className="explorer-table"><caption className="sr-only">Filtered project work items. Open a title to preview its task, then choose Edit work item.</caption><thead><tr><th scope="col">Work item</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Owner</th><th scope="col">Points</th><th scope="col">Updated (UTC)</th></tr></thead><tbody>
      {visible.map(task=><tr key={task.id}><td><button className="task-title-link" onClick={()=>preview(task)}>{task.title}</button><WorkSignals task={task}/><small>{(task.labels || []).join(' · ') || 'No labels'}</small></td><td><StatusBadge status={task.status} /></td><td><PriorityBadge priority={task.priority} /></td><td>{task.assignee_name || 'Unassigned'}</td><td className="explorer-points">{task.story_points}</td><td className="task-ref">{Number.isFinite(Date.parse(task.updated_at)) ? new Date(task.updated_at).toISOString().slice(0,10) : "Not recorded"}</td></tr>)}
    </tbody></table>{!visible.length && <div className="empty-explorer"><h3>No work items match.</h3><p>Clear filters or switch to the entire project.</p></div>}</div>
    </div></div><TaskPreviewDrawer task={tasks.find(t=>t.id===previewId)} sprints={sprints} activities={activities} dialogRef={drawer} onClose={()=>setPreviewId(null)} onEdit={onOpenTask}/>
  </section>;
}
