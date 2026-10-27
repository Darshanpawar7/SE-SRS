import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TASK_STATUSES, TASK_PRIORITIES, TEAM_MEMBERS } from '../../utils/constants';
import { exploreTasks, tasksToCsv } from '../../utils/taskExplorer';
import './taskExplorer.css';
import { PriorityBadge, StatusBadge } from './TaskSignals';
import { useAuth } from '../../context/AuthContext';
import { selectSprintTasks } from '../../utils/estimation';
import { applyWorkView, WORK_VIEWS } from '../../utils/workViews';
import SignalIcon from './SignalIcon';
export default function TaskExplorer({ onOpenTask }) {
  const { tasks, sprints, activeSprintId, project } = useProject();
  const { currentUser } = useAuth();
  const [view, setView] = useState('all');
  const [scope, setScope] = useState('sprint');
  const [filters, setFilters] = useState({ query:'',status:'all',priority:'all',assignee:'all',sort:'priority' });
  const update = (key, value) => setFilters(old => ({...old,[key]:value}));
  const inScope = scope === 'project' ? tasks : scope === 'backlog' ? tasks.filter(task => !task.sprint_id) : selectSprintTasks(tasks, activeSprintId);
  const members = TEAM_MEMBERS.map(member => member.id);
  const visible = exploreTasks(applyWorkView(inScope, view, currentUser?.id, members), filters);
  const points = visible.reduce((sum,task) => sum + Number(task.story_points || 0),0);
  const download = () => {
    const url = URL.createObjectURL(new Blob([tasksToCsv(visible,sprints)],{type:'text/csv;charset=utf-8'}));
    const anchor = document.createElement('a');anchor.href = url;
    anchor.download = `${String(project?.key || 'SprintFlow').replace(/[^a-z0-9_-]/gi,'_')}-work-items.csv`;
    anchor.click();setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  return <section className="explorer-page" aria-labelledby="explorer-title">
    <div className="view-header"><div><h2 className="view-title" id="explorer-title">Work items</h2><p className="view-subtitle">Search, filter and export the work in the selected scope.</p></div><button className="btn btn-primary" disabled={!visible.length} onClick={download}><SignalIcon name="export" size={15}/> Export visible rows</button></div>
    <div className="table-tools" aria-label="Quick work views">{WORK_VIEWS.map(item => <button key={item.id} aria-pressed={view === item.id} onClick={()=>setView(item.id)}><SignalIcon name={item.icon} size={14}/>{item.label}<span>{applyWorkView(inScope,item.id,currentUser?.id,members).length}</span></button>)}</div>
    <div className="explorer-filters">
      <label className="explorer-search">Search work items<input className="form-input" value={filters.query} placeholder="Title, person or label…" onChange={e => update('query',e.target.value)} /></label>
      <label>Scope<select className="form-select" value={scope} onChange={e=>setScope(e.target.value)}><option value="sprint">Selected sprint</option><option value="project">Entire project</option><option value="backlog">Unscheduled backlog</option></select></label>
      <label>Status<select className="form-select" value={filters.status} onChange={e=>update('status',e.target.value)}><option value="all">All statuses</option>{TASK_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>Priority<select className="form-select" value={filters.priority} onChange={e=>update('priority',e.target.value)}><option value="all">All priorities</option>{TASK_PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <label>Assignee<select className="form-select" value={filters.assignee} onChange={e=>update('assignee',e.target.value)}><option value="all">Everyone</option>{TEAM_MEMBERS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label>Order<select className="form-select" value={filters.sort} onChange={e=>update('sort',e.target.value)}><option value="priority">Priority</option><option value="points">Points ↓</option><option value="title">Title A–Z</option></select></label>
      <button className="btn btn-secondary" onClick={()=>{setView('all');setFilters({query:'',status:'all',priority:'all',assignee:'all',sort:'priority'});}}>Clear filters</button>
    </div>
    <div className="explorer-summary" role="status"><span>{visible.length} / {inScope.length} WORK ITEMS</span><span>{points} POINTS IN VIEW</span><span>{scope === 'project' ? 'PROJECT SCOPE' : scope === 'backlog' ? 'UNSCHEDULED BACKLOG' : 'SPRINT SCOPE'} · {WORK_VIEWS.find(item=>item.id===view)?.label.toUpperCase()}</span></div>
    <div className="explorer-table-wrap"><table className="explorer-table"><caption className="sr-only">Filtered project work items. Open a title to edit its task.</caption><thead><tr><th scope="col">Work item</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Owner</th><th scope="col">Points</th><th scope="col">Updated (UTC)</th></tr></thead><tbody>
      {visible.map(task=><tr key={task.id}><td><button className="task-title-link" onClick={()=>onOpenTask(task)}>{task.title}</button><small>{(task.labels || []).join(' · ') || 'No labels'}</small></td><td><StatusBadge status={task.status} /></td><td><PriorityBadge priority={task.priority} /></td><td>{task.assignee_name || 'Unassigned'}</td><td className="explorer-points">{task.story_points}</td><td className="task-ref">{Number.isFinite(Date.parse(task.updated_at)) ? new Date(task.updated_at).toISOString().slice(0,10) : "Not recorded"}</td></tr>)}
    </tbody></table>{!visible.length && <div className="empty-explorer"><h3>No work items match.</h3><p>Clear filters or switch to the entire project.</p></div>}</div>
  </section>;
}
