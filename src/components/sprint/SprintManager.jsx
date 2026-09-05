import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { calculateSprintMetrics } from '../../utils/estimation';

export default function SprintManager() {
  const { sprints, tasks, addSprint, updateSprintStatus } = useProject();
  const { currentUser } = useAuth();

  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreateSprint = (e) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    addSprint({
      name: sprintName.trim(),
      goal: sprintGoal.trim(),
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    });

    setSprintName('');
    setSprintGoal('');
    setShowNewSprintModal(false);
  };

  return (
    <div className="sprint-page">
      <div className="view-header">
        <div>
          <h2 className="view-title">Sprint Management & Agile Planning</h2>
          <p className="view-subtitle">Plan iterations, track velocity, and monitor burndown milestones</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewSprintModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Create Sprint</span>
        </button>
      </div>

      {/* Sprints List */}
      <div className="sprints-grid">
        {sprints.map(sprint => {
          const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
          const metrics = calculateSprintMetrics(sprintTasks);

          return (
            <div key={sprint.id} className="sprint-card">
              <div className="sprint-card-header">
                <div>
                  <div className="sprint-status-badge">
                    <span className={`status-pill-badge ${sprint.status}`}>{sprint.status.toUpperCase()}</span>
                    <span className="date-range">{sprint.start_date} → {sprint.end_date}</span>
                  </div>
                  <h3 className="sprint-title">{sprint.name}</h3>
                </div>

                <div className="sprint-actions">
                  {sprint.status === 'planned' && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => updateSprintStatus(sprint.id, 'active')}
                    >
                      Start Sprint
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => updateSprintStatus(sprint.id, 'completed')}
                    >
                      Complete Sprint
                    </button>
                  )}
                </div>
              </div>

              {sprint.goal && (
                <p className="sprint-goal">
                  <strong>Sprint Goal:</strong> {sprint.goal}
                </p>
              )}

              {/* Progress & Metrics */}
              <div className="sprint-metrics-row">
                <div className="metric-box">
                  <span className="box-val">{metrics.totalStoryPoints}</span>
                  <span className="box-lbl">Planned Points</span>
                </div>
                <div className="metric-box">
                  <span className="box-val text-emerald">{metrics.completedStoryPoints}</span>
                  <span className="box-lbl">Completed</span>
                </div>
                <div className="metric-box">
                  <span className="box-val text-amber">{metrics.remainingStoryPoints}</span>
                  <span className="box-lbl">Remaining</span>
                </div>
                <div className="metric-box">
                  <span className="box-val text-indigo">{metrics.progressPercentage}%</span>
                  <span className="box-lbl">Completion Rate</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="sprint-progress-track">
                <div 
                  className="sprint-progress-fill" 
                  style={{ width: `${metrics.progressPercentage}%` }}
                ></div>
              </div>

              {/* Task Preview in this sprint */}
              <div className="sprint-tasks-preview">
                <div className="preview-header">
                  <span>Sprint Backlog ({sprintTasks.length} tasks)</span>
                </div>
                <div className="tasks-mini-list">
                  {sprintTasks.slice(0, 4).map(t => (
                    <div key={t.id} className="mini-task-item">
                      <span className="mini-task-status-dot" style={{ backgroundColor: t.status === 'done' ? '#10b981' : '#6366f1' }}></span>
                      <span className="mini-task-title">{t.title}</span>
                      <span className="mini-task-pts">{t.story_points} SP</span>
                    </div>
                  ))}
                  {sprintTasks.length > 4 && (
                    <div className="more-tasks-note">+ {sprintTasks.length - 4} more items</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Sprint Modal */}
      {showNewSprintModal && (
        <div className="modal-backdrop" onClick={() => setShowNewSprintModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Plan New Sprint</h3>
              <button className="close-btn" onClick={() => setShowNewSprintModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSprint} className="modal-form">
              <div className="form-group">
                <label className="form-label">Sprint Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 3: Advanced CI/CD & Testing"
                  className="form-input"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sprint Goal</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="What is the key deliverable or business value of this iteration?"
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewSprintModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
