import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { TASK_STATUSES, TASK_PRIORITIES, TEAM_MEMBERS } from '../../utils/constants';

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
    const task = activeSprintTasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      updateTask({ ...task, status: targetStatus }, currentUser.name);
    }
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

      {/* Kanban 5-Column Board */}
      <div className="kanban-board-grid">
        {TASK_STATUSES.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
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
                  <span className="column-count">{colTasks.length}</span>
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
                    const priorityObj = TASK_PRIORITIES.find(p => p.id === task.priority) || TASK_PRIORITIES[1];
                    const assignee = TEAM_MEMBERS.find(m => m.id === task.assignee_id);

                    return (
                      <div
                        key={task.id}
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onOpenTaskModal(task)}
                      >
                        <div className="card-top-row">
                          <span 
                            className="priority-pill" 
                            style={{ color: priorityObj.color, borderColor: priorityObj.color + '40' }}
                          >
                            <span className="priority-symbol">{priorityObj.icon}</span>
                            <span>{priorityObj.label}</span>
                          </span>

                          <span className="points-badge" title="Agile Fibonacci Estimation">
                            {task.story_points || 3} SP
                          </span>
                        </div>

                        <h4 className="task-title">{task.title}</h4>
                        {task.description && (
                          <p className="task-desc">{task.description}</p>
                        )}

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="task-labels">
                            {task.labels.map((lbl, idx) => (
                              <span key={idx} className="label-tag">#{lbl}</span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="card-footer-row">
                          <div className="assignee-badge">
                            <div 
                              className="assignee-avatar-sm" 
                              style={{ backgroundColor: assignee?.color || '#6366f1' }}
                            >
                              {assignee ? assignee.initials : 'UN'}
                            </div>
                            <span className="assignee-name-sm">
                              {task.assignee_name ? task.assignee_name.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>

                          <div className="quick-move-btns">
                            <button 
                              title="Quick advance"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = TASK_STATUSES.findIndex(s => s.id === col.id);
                                if (currentIndex < TASK_STATUSES.length - 1) {
                                  updateTask({ ...task, status: TASK_STATUSES[currentIndex + 1].id }, currentUser.name);
                                }
                              }}
                              className="step-btn"
                              disabled={col.id === 'done'}
                            >
                              →
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
