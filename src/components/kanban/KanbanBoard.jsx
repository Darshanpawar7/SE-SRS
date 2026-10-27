import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { TASK_PRIORITIES, TEAM_MEMBERS } from '../../utils/constants';
import { getKanbanColumns } from '../../utils/kanban';
import { getTaskAfterStatusDrop } from '../../utils/taskUpdates';
import { advanceTaskByOneStage, getNextTaskStatus } from '../../utils/workflow';
import LabelPills from './LabelPills';
import { PriorityBadge } from '../workspace/TaskSignals';
import SignalIcon from '../workspace/SignalIcon';

export default function KanbanBoard({ onOpenTaskModal }) {
  const { 
    activeSprintTasks, 
    updateTask, 
    filterAssignee, 
    setFilterAssignee, 
    filterPriority, 
    setFilterPriority, 
    searchQuery, 
    setSearchQuery 
  } = useProject();
  const { currentUser } = useAuth();
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [boardError, setBoardError] = useState('');

  // Board moves report a failed save on the board instead of failing silently.
  const saveTask = (task, authorName) => updateTask(task, authorName)
    .then(() => setBoardError(''))
    .catch(err => setBoardError(err.message));

  // Filter tasks
  const filteredTasks = activeSprintTasks.filter(task => {
    if (filterAssignee !== 'all' && task.assignee_id !== filterAssignee) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchAssignee = (task.assignee_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });
  const kanbanColumns = getKanbanColumns(filteredTasks);

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;
    const task = getTaskAfterStatusDrop(activeSprintTasks, taskId, targetStatus);
    if (task) saveTask(task, currentUser.name);
    setDraggedTaskId(null);
  };

  return (
    <div className="kanban-page">
      {/* Kanban Filters & Search Header */}
      <div className="kanban-toolbar">
        <div className="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search tasks, descriptions, assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="filters-row">
          {/* Assignee Filter */}
          <select 
            value={filterAssignee} 
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Assignees</option>
            {TEAM_MEMBERS.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.usn})</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            {TASK_PRIORITIES.map(p => (
              <option key={p.id} value={p.id}>{p.label} Priority</option>
            ))}
          </select>

          {/* Quick Clear */}
          {(filterAssignee !== 'all' || filterPriority !== 'all') && (
            <button 
              className="btn btn-text"
              onClick={() => {
                setFilterAssignee('all');
                setFilterPriority('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {boardError && <p role="alert" className="form-error">{boardError}</p>}

      {/* Kanban 5-Column Board */}
      <div className="kanban-board-grid">
        {kanbanColumns.map(col => {
          const colTasks = col.tasks;
          const colPoints = colTasks.reduce((sum, t) => sum + (Number(t.story_points) || 0), 0);

          return (
            <div 
              key={col.id} 
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="column-header" style={{ borderTopColor: col.color }}>
                <div className="column-title-wrap">
                  <span className="column-dot" style={{ backgroundColor: col.color }}></span>
                  <h3 className="column-name">{col.label}</h3>
                  <span className="column-count">{col.count}</span>
                </div>
                <span className="column-points" title="Total Story Points">{colPoints} pts</span>
              </div>

              {/* Tasks Droppable Area */}
              <div className="tasks-container">
                {colTasks.length === 0 ? (
                  <div className="empty-column-drop">
                    <p>Drop tasks here</p>
                  </div>
                ) : (
                  colTasks.map(task => {

                    const assignee = TEAM_MEMBERS.find(m => m.id === task.assignee_id);
                    const nextStatus = getNextTaskStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onOpenTaskModal(task)}
                      >
                        <div className="card-top-row">
                          <PriorityBadge priority={task.priority} />

                          <span className="points-badge" title="Agile Fibonacci Estimation">
                            {task.story_points || 3} SP
                          </span>
                        </div>

                        <h4 className="task-title"><button onClick={e => { e.stopPropagation(); onOpenTaskModal(task); }}>{task.title}</button></h4>
                        {task.description && (
                          <p className="task-desc">{task.description}</p>
                        )}

                        {/* Labels */}
                        <LabelPills labels={task.labels} />

                        {/* Card Footer */}
                        <div className="card-footer-row">
                          <div className="assignee-badge">
                            <div 
                              className="assignee-avatar-sm" 
                              style={{ backgroundColor: assignee?.color || 'var(--text-dim)' }}
                            >
                              {assignee ? assignee.initials : 'UN'}
                            </div>
                            <span className="assignee-name-sm">
                              {task.assignee_name ? task.assignee_name.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>

                          <div className="quick-move-btns">
                            <button 
                              title={nextStatus ? `Advance to ${nextStatus}` : "Task is complete"}
                              aria-label={nextStatus ? `Advance ${task.title} to ${nextStatus}` : `${task.title} is complete`}
                              onClick={(e) => {
                                e.stopPropagation();
                                advanceTaskByOneStage(task, saveTask, currentUser.name);
                              }}
                              className="step-btn"
                              disabled={!nextStatus}
                            >
                              <SignalIcon name="medium" size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
