import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { TASK_STATUSES, TASK_PRIORITIES, STORY_POINTS, TEAM_MEMBERS } from '../../utils/constants';
import { buildTaskPayload, getTaskFormValues, mergeTaskPayload, validateTaskForm } from '../../utils/taskForm';
import { addLabels, getDistinctLabels, removeLabel } from '../../utils/labels';

export default function TaskModal({ task, isOpen, onClose }) {
  const { updateTask, addTask, deleteTask, activeSprintId, sprints } = useProject();
  const { currentUser } = useAuth();

  if (!isOpen) return null;
  // Closing unmounts the editor; switching task, sprint or member starts a new draft.
  return <TaskForm key={`${task?.id ?? 'new'}:${activeSprintId ?? ''}:${currentUser?.id ?? ''}`}
    task={task} onClose={onClose} updateTask={updateTask} addTask={addTask}
    deleteTask={deleteTask} activeSprintId={activeSprintId} sprints={sprints} currentUser={currentUser} />;
}

function TaskForm({ task, onClose, updateTask, addTask, deleteTask, activeSprintId, sprints, currentUser }) {
  const isEditing = Boolean(task?.id);
  const [initial] = useState(() => getTaskFormValues(task, activeSprintId, currentUser));
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [priority, setPriority] = useState(initial.priority);
  const [storyPoints, setStoryPoints] = useState(initial.storyPoints);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId);
  const [sprintId, setSprintId] = useState(initial.sprintId);
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState(() => getDistinctLabels(initial.labels));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddLabel = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && labelInput.trim()) {
      e.preventDefault();
      setLabels(addLabels(labels, labelInput));
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (lbl) => {
    setLabels(removeLabel(labels, lbl));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formValues = {
      title,
      description,
      status,
      priority,
      storyPoints,
      assigneeId,
      sprintId,
      // A label still in the input when the task is saved is kept, not dropped.
      labels: addLabels(labels, labelInput)
    };
    if (!validateTaskForm(formValues)) return;

    const taskPayload = buildTaskPayload(formValues, currentUser, TEAM_MEMBERS);

    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await updateTask(mergeTaskPayload(task, taskPayload), currentUser.name);
      } else {
        await addTask(taskPayload, currentUser.name);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      deleteTask(task.id, currentUser.name);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? 'Edit Work Item' : 'Create New Agile Task'}
          </h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p role="alert">{error}</p>}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Implement user login with JWT"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description & Acceptance Criteria</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide user story context and technical specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Grid of Agile Selectors */}
          <div className="form-grid-3">
            {/* Status */}
            <div className="form-group">
              <label className="form-label">Workflow Status</label>
              <select 
                className="form-select"
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                {TASK_STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select 
                className="form-select"
                required
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Sprint */}
            <div className="form-group">
              <label className="form-label">Sprint</label>
              <select 
                className="form-select"
                value={sprintId} 
                onChange={(e) => setSprintId(e.target.value)}
              >
                <option value="">Backlog (No Sprint)</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Points (Agile Fibonacci Scale) */}
          <div className="form-group">
            <label className="form-label">
              Agile Story Points (Fibonacci Estimation)
            </label>
            <div className="story-points-selector">
              {STORY_POINTS.map(pt => (
                <button
                  type="button"
                  key={pt}
                  aria-pressed={storyPoints === pt}
                  className={`pt-pill ${storyPoints === pt ? 'selected' : ''}`}
                  onClick={() => setStoryPoints(pt)}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="form-group">
            <label className="form-label">Assignee (Team 11 Member)</label>
            <select 
              className="form-select"
              value={assigneeId} 
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              {TEAM_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.usn}) — {m.role}
                </option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <div className="form-group">
            <label className="form-label">Labels (Press Enter or comma to add)</label>
            <div className="labels-input-wrap">
              {labels.map(lbl => (
                <span key={lbl} className="label-pill">
                  #{lbl}
                  <button type="button" aria-label={`Remove label ${lbl}`} onClick={() => handleRemoveLabel(lbl)}>×</button>
                </span>
              ))}
              <input
                type="text"
                className="label-sub-input"
                placeholder="Add tag..."
                aria-label="Add label"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleAddLabel}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            {isEditing && (
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDelete}
              >
                Delete Task
              </button>
            )}
            <div className="footer-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

