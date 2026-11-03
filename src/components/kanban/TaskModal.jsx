import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { TASK_STATUSES, TASK_PRIORITIES, STORY_POINTS, TEAM_MEMBERS } from '../../utils/constants';
import { buildTaskPayload, getTaskFormValues, mergeTaskPayload, sanitizeTaskText, TASK_TITLE_MAX_LENGTH, TASK_DESCRIPTION_MAX_LENGTH, validateTaskForm } from '../../utils/taskForm';
import { addLabels, getDistinctLabels, removeLabel } from '../../utils/labels';
import { sanitizeUserText } from '../../utils/userText';

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
      try {
        setLabels(addLabels(labels, labelInput));
        setLabelInput('');
        setError('');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRemoveLabel = (lbl) => {
    setLabels(removeLabel(labels, lbl));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let formValues;
    try {
      formValues = sanitizeTaskText({
      title,
      description,
      status,
      priority,
      storyPoints,
      assigneeId,
      sprintId,
      // A label still in the input when the task is saved is kept, not dropped.
      labels: addLabels(labels, labelInput)
      });
    } catch (err) {
      setError(err.message);
      return;
    }
    if (!validateTaskForm(formValues)) {
      setError('Enter a task title and choose a valid priority.');
      return;
    }

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
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" id="task-modal-title">
            {isEditing ? 'Edit Work Item' : 'Create New Agile Task'}
          </h3>
          <button type="button" className="close-btn" aria-label="Close task dialog" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p id="task-form-error" role="alert" className="form-error">{error}</p>}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              required
              className="form-input"
              aria-describedby={error ? 'task-form-error' : undefined}
              aria-invalid={error === 'Enter a task title and choose a valid priority.'}
              autoFocus
              placeholder="e.g. Implement user login with JWT"
              value={title}
              maxLength={TASK_TITLE_MAX_LENGTH}
              onChange={(e) => setTitle(sanitizeUserText(e.target.value, { field: 'Task title', maxLength: TASK_TITLE_MAX_LENGTH, allowNewlines: false, trim: false }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-description">Description & Acceptance Criteria</label>
            <textarea
              id="task-description"
              className="form-textarea"
              rows={3}
              placeholder="Provide user story context and technical specifications..."
              value={description}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              onChange={(e) => setDescription(sanitizeUserText(e.target.value, { field: 'Task description', maxLength: TASK_DESCRIPTION_MAX_LENGTH, trim: false }))}
            />
          </div>

          {/* Grid of Agile Selectors */}
          <div className="form-grid-3">
            {/* Status */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Workflow Status</label>
              <select 
                id="task-status"
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
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select 
                id="task-priority"
                className="form-select"
                required
                aria-describedby={error ? 'task-form-error' : undefined}
                aria-invalid={error === 'Enter a task title and choose a valid priority.'}
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
              <label className="form-label" htmlFor="task-sprint">Sprint</label>
              <select 
                id="task-sprint"
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
            <span className="form-label" id="story-points-label">
              Agile Story Points (Fibonacci Estimation)
            </span>
            <div className="story-points-selector" role="group" aria-labelledby="story-points-label">
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
            <label className="form-label" htmlFor="task-assignee">Assignee (Team 11 Member)</label>
            <select 
              id="task-assignee"
              className="form-select"
              value={assigneeId} 
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.usn}) — {m.role}
                </option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-label-input">Labels (Press Enter or comma to add)</label>
            <div className="labels-input-wrap">
              {labels.map(lbl => (
                <span key={lbl} className="label-pill">
                  #{lbl}
                  <button type="button" aria-label={`Remove label ${lbl}`} onClick={() => handleRemoveLabel(lbl)}>×</button>
                </span>
              ))}
              <input
                id="task-label-input"
                type="text"
                className="label-sub-input"
                placeholder="Add tag..."
                aria-label="Add label"
                maxLength={200}
                value={labelInput}
                onChange={(e) => setLabelInput(sanitizeUserText(e.target.value, { field: 'Tag', maxLength: 200, allowNewlines: false, trim: false }))}
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
