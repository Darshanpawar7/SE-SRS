import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { TASK_PRIORITIES, TASK_STATUSES, TEAM_MEMBERS } from '../../utils/constants';
import { getKanbanColumns } from '../../utils/kanban';
import { getTaskAfterStatusDrop } from '../../utils/taskUpdates';
import { sanitizeUserText } from '../../utils/userText';
import { filterTasks, resetTaskFilters } from '../../utils/taskFilters';
import { advanceTaskByOneStage, getNextTaskStatus } from '../../utils/workflow';
import { activateCardFromKeyDown } from '../../utils/accessibility';
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

  const filteredTasks = filterTasks(activeSprintTasks, { filterAssignee, filterPriority, searchQuery });
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
            aria-label="Search tasks, descriptions, or assignees"
            placeholder="Search tasks, descriptions, assignees..."
            maxLength={200}
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitizeUserText(e.target.value, { field: 'Search', maxLength: 200, allowNewlines: false, trim: false }))}
            className="search-input"
          />
          {searchQuery && (
            <button type="button" className="clear-btn" aria-label="Clear search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="filters-row">
          {/* Assignee Filter */}
          <select 
            aria-label="Filter by assignee"
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
            aria-label="Filter by priority"
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
          {(filterAssignee !== 'all' || filterPriority !== 'all' || searchQuery.trim()) && (
            <button 
              className="btn btn-text"
              onClick={() => {
                resetTaskFilters({ setFilterAssignee, setFilterPriority, setSearchQuery });
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

          {boardError && <p role="alert" aria-live="assertive" className="form-error">{boardError}</p>}

      {/* Kanban 5-Column Board */}
      <div className="kanban-board-grid" role="region" aria-label="Kanban task board">
        {kanbanColumns.map(col => {
          const colTasks = col.tasks;
          const colPoints = colTasks.reduce((sum, t) => sum + (Number(t.story_points) || 0), 0);

          return (
            <div 
              key={col.id} 
              className="kanban-column"
              role="group"
              aria-label={`${col.label} tasks`}
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
                    const nextStatusLabel = TASK_STATUSES.find(status => status.id === nextStatus)?.label;

                    return (
                      <div key={task.id} className="task-card-wrap">
                        <div
                          className="task-card"
                          role="button"
                          tabIndex={0}
                          aria-label={`Open task: ${task.title}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => onOpenTaskModal(task)}
                          onKeyDown={(event) => activateCardFromKeyDown(event, () => onOpenTaskModal(task))}
                        >
                        <div className="card-top-row">
                          <PriorityBadge priority={task.priority} />

                          <span className="points-badge" title="Agile Fibonacci Estimation">
                            {task.story_points || 3} SP
                          </span>
                        </div>

                        <h4 className="task-title">{task.title}</h4>
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
                        </div>
                      </div>
                        <div className="quick-move-btns">
                          <button
                            type="button"
                            title={nextStatus ? `Advance to ${nextStatus}` : 'Task is complete'}
                            aria-label={nextStatus ? `Advance ${task.title} to ${nextStatusLabel}` : `${task.title} is in the final stage`}
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
