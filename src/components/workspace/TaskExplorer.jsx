import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TASK_STATUSES, TASK_PRIORITIES, TEAM_MEMBERS } from '../../utils/constants';
import { exploreTasks, tasksToCsv } from '../../utils/taskExplorer';
import './taskExplorer.css';
import { PriorityBadge, StatusBadge } from './TaskSignals';
export default function TaskExplorer({ onOpenTask }) {
  const { tasks, sprints, activeSprintId, project } = useProject();
  const [scope, setScope] = useState('sprint');
  const [filters, setFilters] = useState({ query:'',status:'all',priority:'all',assignee:'all',sort:'priority' });
  const update = (key, value) => setFilters(old => ({...old,[key]:value}));
  const inScope = scope === 'project' ? tasks : tasks.filter(task => task.sprint_id === activeSprintId);
  const visible = exploreTasks(inScope, filters);
  const points = visible.reduce((sum,task) => sum + Number(task.story_points || 0),0);
  const download = () => {
    const url = URL.createObjectURL(new Blob([tasksToCsv(visible,sprints)],{type:'text/csv;charset=utf-8'}));
    const anchor = document.createElement('a');anchor.href = url;
    anchor.download = `${String(project?.key || 'SprintFlow').replace(/[^a-z0-9_-]/gi,'_')}-work-items.csv`;
    anchor.click();setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  return <section className="explorer-page" aria-labelledby="explorer-title">
    <div className="view-header"><div><span className="eyebrow">PROJECT INTELLIGENCE</span><h2 className="view-title" id="explorer-title">Every detail. In focus.</h2><p className="view-subtitle">A precise view of the work. Search, prioritise and take it with you.</p></div><button className="btn btn-primary" disabled={!visible.length} onClick={download}>Export visible rows ↗</button></div>
    <div className="explorer-filters">
      <label className="explorer-search">Search work items<input className="form-input" value={filters.query} placeholder="Title, person or label…" onChange={e => update('query',e.target.value)} /></label>
      <label>Scope<select className="form-select" value={scope} onChange={e=>setScope(e.target.value)}><option value="sprint">Selected sprint</option><option value="project">Entire project</option></select></label>
      <label>Status<select className="form-select" value={filters.status} onChange={e=>update('status',e.target.value)}><option value="all">All statuses</option>{TASK_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>Priority<select className="form-select" value={filters.priority} onChange={e=>update('priority',e.target.value)}><option value="all">All priorities</option>{TASK_PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <label>Assignee<select className="form-select" value={filters.assignee} onChange={e=>update('assignee',e.target.value)}><option value="all">Everyone</option>{TEAM_MEMBERS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label>Order<select className="form-select" value={filters.sort} onChange={e=>update('sort',e.target.value)}><option value="priority">Priority</option><option value="points">Points ↓</option><option value="title">Title A–Z</option></select></label>
      <button className="btn btn-secondary" onClick={()=>setFilters({query:'',status:'all',priority:'all',assignee:'all',sort:'priority'})}>Clear filters</button>
    </div>
    <div className="explorer-summary" role="status"><span>{visible.length} / {inScope.length} WORK ITEMS</span><span>{points} POINTS IN VIEW</span><span>{scope === 'project' ? 'PROJECT SCOPE' : 'SPRINT SCOPE'}</span></div>
    <div className="explorer-table-wrap"><table className="explorer-table"><caption className="sr-only">Filtered project work items. Open a title to edit its task.</caption><thead><tr><th scope="col">Work item</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Owner</th><th scope="col">Points</th></tr></thead><tbody>
      {visible.map(task=><tr key={task.id}><td><button className="task-title-link" onClick={()=>onOpenTask(task)}>{task.title}</button><small>{(task.labels || []).join(' · ') || 'No labels'}</small></td><td><StatusBadge status={task.status} /></td><td><PriorityBadge priority={task.priority} /></td><td>{task.assignee_name || 'Unassigned'}</td><td className="explorer-points">{task.story_points}</td></tr>)}
    </tbody></table>{!visible.length && <div className="empty-explorer"><h3>No work items match.</h3><p>Clear filters or switch to the entire project.</p></div>}</div>
  </section>;
}
