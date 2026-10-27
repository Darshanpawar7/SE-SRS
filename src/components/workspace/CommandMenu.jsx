import React, { useEffect, useRef, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { findCommands } from '../../utils/commands';
import './commandMenu.css';

export default function CommandMenu({ onNavigate, onNewTask, onOpenTask, onSettings, explorerEnabled = false }) {
  const { tasks, activeSprintId, sprints } = useProject();
  const dialog = useRef(null);
  const [query, setQuery] = useState('');
  const actions = [
    { id: 'dashboard', label: 'Go to overview', hint: 'Workspace' },
    { id: 'kanban', label: 'Go to board', hint: 'Workspace' },
    { id: 'sprints', label: 'Go to sprints', hint: 'Workspace' },
    { id: 'explorer', label: 'Go to task explorer', hint: 'Workspace' },
    { id: 'docs', label: 'Go to documentation', hint: 'Workspace' },
    { id: 'new', label: 'Create a task', hint: 'Action' },
    { id: 'settings', label: 'Open connections', hint: 'Action' },
  ].filter(action => action.id !== 'explorer' || explorerEnabled);
  const open = () => { setQuery(''); dialog.current?.showModal(); };
  useEffect(() => {
    const handler = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  const choose = command => {
    dialog.current.close();
    if (command.task) onOpenTask(command.task);
    else if (command.id === 'new') onNewTask();
    else if (command.id === 'settings') onSettings();
    else onNavigate(command.id);
  };
  const results = findCommands(query, tasks, actions);
  return <>
    <div className="workspace-console">
      <div><span className="console-dot" /> WORKSPACE / <strong>{sprints.find(s => s.id === activeSprintId)?.name || 'No sprint selected'}</strong></div>
      <button className="command-trigger" onClick={open}>Search & commands <kbd>⌘ / Ctrl K</kbd></button>
    </div>
    <dialog ref={dialog} className="command-dialog" aria-labelledby="command-title" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <header><div><span className="eyebrow">SPRINTFLOW / COMMAND CENTER</span><h2 id="command-title">Where to next?</h2></div><button className="btn btn-secondary" onClick={() => dialog.current.close()} aria-label="Close command menu">Esc</button></header>
      <label className="sr-label" htmlFor="command-query">Search actions and work items</label>
      <input id="command-query" autoFocus className="form-input" placeholder="Find a page, action or work item…" value={query} onChange={event => setQuery(event.target.value)}
        onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); dialog.current.querySelector('.command-result')?.focus(); } }} />
      <p className="command-count" aria-live="polite">{results.length} results · Search covers all project work items</p>
      <div className="command-results" onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        const buttons = [...dialog.current.querySelectorAll('.command-result')];
        const index = buttons.indexOf(document.activeElement);
        if (index < 0 || !buttons.length) return;
        event.preventDefault();
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
      }}>
        {results.map(command => <button key={command.id} className="command-result" onClick={() => choose(command)}><span>{command.label}</span><small>{command.hint}</small></button>)}
        {!results.length && <p className="empty-explorer">No matches. Try another title or action.</p>}
      </div>
      <footer><span>↑ ↓ navigate · Enter select</span><span>Esc close</span></footer>
    </dialog>
  </>;
}
