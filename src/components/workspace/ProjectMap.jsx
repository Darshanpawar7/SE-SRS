import React, { useMemo, useRef, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PERMISSIONS } from '../../services/authService';
import { buildProjectMap, clampMapZoom } from '../../utils/projectMap';
import { PriorityBadge, StatusBadge } from './TaskSignals';
import SignalIcon from './SignalIcon';
import './projectMap.css';

export default function ProjectMap({ onOpenTask, onOpenProject, onNavigateBoard }) {
  const { project, tasks, sprints, setActiveSprintId, canProject } = useProject();
  const viewport = useRef(null);
  const drag = useRef(null);
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(.85);
  const [selected, setSelected] = useState('project');
  const [mode, setMode] = useState('map');
  const graph = useMemo(() => buildProjectMap(project, sprints, tasks, query), [project, sprints, tasks, query]);
  const node = graph.nodes.find(item => item.key === selected);

  const pick = item => {
    if (!item) return;
    setSelected(item.key);
    viewport.current?.scrollTo({ left: Math.max(0, item.x * zoom - 50), top: Math.max(0, item.y * zoom - 60) });
  };

  const changeZoom = next => {
    const panel = viewport.current;
    const center = panel ? {
      x: (panel.scrollLeft + panel.clientWidth / 2) / zoom,
      y: (panel.scrollTop + panel.clientHeight / 2) / zoom
    } : null;
    const value = clampMapZoom(next);
    setZoom(value);
    if (center) requestAnimationFrame(() => panel.scrollTo({
      left: Math.max(0, center.x * value - panel.clientWidth / 2),
      top: Math.max(0, center.y * value - panel.clientHeight / 2)
    }));
  };

  const fit = () => {
    const panel = viewport.current;
    if (!panel) return;
    setZoom(clampMapZoom(Math.min(1, (panel.clientWidth - 30) / graph.width, (panel.clientHeight - 30) / graph.height)));
    panel.scrollTo({ left: 0, top: 0 });
  };

  return (
    <section className="project-map-page" aria-labelledby="project-map-title">
      <div className="view-header">
        <div><span className="eyebrow">WORKSPACE RELATIONSHIPS</span><h2 id="project-map-title" className="view-title">Project map</h2>
          <p className="view-subtitle">Explore actual project, sprint and task relationships.</p></div>
        <div className="map-mode" aria-label="Relationship view">
          <button className="btn btn-secondary" aria-pressed={mode === 'map'} onClick={() => setMode('map')}>Map</button>
          <button className="btn btn-secondary" aria-pressed={mode === 'table'} onClick={() => setMode('table')}>Relationship table</button>
        </div>
      </div>
      <div className="map-workspace">
        <aside className="map-sidebar" aria-label="Project map explorer">
          <label>Search relationships<input className="form-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Task, sprint, owner or label…" /></label>
          <p className="map-count">{graph.matches.length} / {graph.total} project work items</p>
          <button className="map-tree-root" onClick={() => pick(graph.nodes[0])}><SignalIcon name="layers" size={15} />{project?.key || 'Project'}</button>
          {graph.groups.map(group => <button className="map-tree-group" key={group.id} onClick={() => pick(graph.nodes.find(item => item.key === `group:${group.id}`))}>
            <SignalIcon name="backlog" size={14} /><span>{group.name}</span><b>{group.tasks.length}</b>
          </button>)}
          <p className="map-caption">Lines show membership. Select a card to inspect it, then use its editor action.</p>
          <section className="map-inspector" aria-label="Selected relationship">
            {node ? <>
              <span className="eyebrow">{node.kind === 'task' ? 'WORK ITEM' : node.kind.toUpperCase()}</span><h3>{node.label}</h3>
              {node.kind === 'task' ? <><StatusBadge status={node.data.status} /><p>{node.data.assignee_name || 'Unassigned'} · {node.data.story_points} points</p>
                <button className="btn btn-primary btn-sm" onClick={() => onOpenTask(node.data)}>Open task editor</button></>
                : node.kind === 'project' ? <><p>{project?.description || 'No project description.'}</p>
                  <button className="btn btn-secondary btn-sm" disabled={!canProject(PERMISSIONS.EDIT_PROJECT)} onClick={onOpenProject}>Edit project details</button>
                  {!canProject(PERMISSIONS.EDIT_PROJECT) && <p>Project details are editable by the team lead.</p>}</>
                  : node.kind === 'sprint' ? <><p>{node.data.goal || 'No sprint goal.'}</p><p>{node.data.start_date || 'No start date'} → {node.data.end_date || 'No end date'}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setActiveSprintId(node.data.id); onNavigateBoard(); }}>Open sprint board</button></>
                    : <p>{node.kind === 'unlinked' ? 'These items reference a sprint absent from this project. Open their task editor to choose a valid sprint.' : 'These work items have no sprint assigned.'}</p>}
            </> : <p>Select a visible relationship to inspect it.</p>}
          </section>
        </aside>
        <div className="map-main">
          {mode === 'map' ? <>
            <div className="map-toolbar"><div className="map-zoom" aria-label="Map zoom">
              <button onClick={() => changeZoom(zoom - .1)} aria-label="Zoom out" disabled={zoom <= .1}>−</button><output aria-live="polite">{Math.round(zoom * 100)}%</output>
              <button onClick={() => changeZoom(zoom + .1)} aria-label="Zoom in" disabled={zoom >= 1.6}>+</button><button onClick={fit}>Fit</button><button onClick={() => changeZoom(1)}>100%</button>
            </div><span>Drag empty space to pan · scroll or use arrow keys</span></div>
            <div ref={viewport} className="map-viewport" tabIndex={0} aria-label="Scrollable project relationship map"
              onPointerDown={event => { if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('button')) return; drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={event => { if (drag.current) { event.currentTarget.scrollLeft = drag.current.left + drag.current.x - event.clientX; event.currentTarget.scrollTop = drag.current.top + drag.current.y - event.clientY; } }}
              onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={() => { drag.current = null; }}>
              <div className="map-scaled-space" style={{ width: graph.width * zoom, height: graph.height * zoom }}>
                <div className="map-scene" style={{ width: graph.width, height: graph.height, transform: `scale(${zoom})` }}>
                  <svg className="map-edges" width={graph.width} height={graph.height} aria-hidden="true">{graph.edges.map(edge => <path className="map-link" key={edge.key} d={edge.path} />)}</svg>
                  {graph.nodes.map(item => <div className={`map-node map-node-${item.kind}`} key={item.key} style={{ left: item.x, top: item.y, width: item.w, minHeight: item.h }}>
                    <button aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}>
                      <span className="map-node-kind">{item.kind === 'task' ? 'WORK ITEM' : item.kind === 'project' ? project?.key : item.kind === 'unlinked' ? 'MISSING SPRINT' : item.kind.toUpperCase()}</span>
                      <strong>{item.label}</strong>
                      {item.kind === 'task' ? <span className="map-task-meta"><span>{(item.data.status || 'unknown').replaceAll('_', ' ')}</span><span>{item.data.story_points} pt</span></span>
                        : item.kind !== 'project' ? <span>{item.data.shown} shown / {item.data.tasks.length} work items</span> : <span>{graph.total} project work items</span>}
                    </button>
                  </div>)}
                </div>
              </div>
            </div>
            {graph.shown < graph.matches.length && <p className="map-caption">The canvas shows {graph.shown} of {graph.matches.length} matching items, up to 20 per group and 80 total. Narrow the search or use the relationship table to see every match.</p>}
          </> : <div className="map-table"><table><caption>All matching work items and their actual sprint memberships</caption>
            <thead><tr><th>Work item</th><th>Sprint</th><th>Status</th><th>Priority</th><th>Owner</th></tr></thead>
            <tbody>{graph.matches.map(task => <tr key={task.id}><td><button className="task-title-link" onClick={() => onOpenTask(task)}>{task.title}</button></td>
              <td>{!task.sprint_id ? 'Unscheduled backlog' : graph.taskGroups.get(task.id) || 'Unlinked sprint'}</td><td><StatusBadge status={task.status} /></td><td><PriorityBadge priority={task.priority} /></td><td>{task.assignee_name || 'Unassigned'}</td></tr>)}</tbody>
          </table>{!graph.matches.length && <p className="empty-explorer">No matching work items.</p>}</div>}
        </div>
      </div>
    </section>
  );
}
