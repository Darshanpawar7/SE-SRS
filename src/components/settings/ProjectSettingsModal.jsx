import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../services/authService';
import { sanitizeUserText } from '../../utils/userText';
import { validateProjectDateRange } from '../../utils/projectDates';

// Mounted only while open, so it always starts from the saved project values.
export default function ProjectSettingsModal({ onClose }) {
  const { project, updateProject, projectRole } = useProject();
  const { currentUser, can, sessionKind } = useAuth();
  const canEdit = sessionKind === 'supabase'
    ? projectRole === 'lead' || projectRole === 'owner'
    : can(PERMISSIONS.EDIT_PROJECT);

  const [values, setValues] = useState(() => ({
    key: project?.key ?? '',
    name: project?.name ?? '',
    description: project?.description ?? '',
    start_date: project?.start_date ?? '',
    target_date: project?.target_date ?? ''
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dateValidation = validateProjectDateRange(values.start_date, values.target_date);

  const setField = (field, options = {}) => (e) => {
    const value = options.maxLength
      ? sanitizeUserText(e.target.value, { field: options.label, maxLength: options.maxLength, allowNewlines: options.allowNewlines, trim: options.trim })
      : e.target.value;
    setValues(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProject(values, currentUser);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="project-settings-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" id="project-settings-title">Project Details</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close project details dialog">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {!canEdit && <p className="card-subtitle">Only the team lead can edit project details.</p>}
          {error && <p role="alert" className="form-error">{error}</p>}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="project-key">Project Key *</label>
              <input
                id="project-key"
                className="form-input"
                value={values.key}
                onChange={setField('key')}
                maxLength={10}
                readOnly={!canEdit}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-name">Project Name *</label>
              <input
                id="project-name"
                className="form-input"
                value={values.name}
                onChange={setField('name', { label: 'Project name', maxLength: 80, allowNewlines: false, trim: false })}
                maxLength={80}
                readOnly={!canEdit}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-description">Project Description</label>
            <textarea
              id="project-description"
              className="form-textarea"
              rows={3}
              maxLength={2000}
              value={values.description}
              onChange={setField('description', { label: 'Project description', maxLength: 2000, trim: false })}
              readOnly={!canEdit}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="project-start">Start Date *</label>
              <input
                id="project-start"
                type="date"
                className="form-input"
                value={values.start_date}
                onChange={setField('start_date')}
                readOnly={!canEdit}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-end">End Date *</label>
              <input
                id="project-end"
                type="date"
                className="form-input"
                value={values.target_date}
                onChange={setField('target_date')}
                min={values.start_date || undefined}
                readOnly={!canEdit}
                aria-invalid={!dateValidation.valid}
                aria-describedby={!dateValidation.valid ? 'project-date-error' : undefined}
              />
            </div>
          </div>
          {!dateValidation.valid && <p id="project-date-error" className="form-error" role="alert">{dateValidation.error}</p>}

          <div className="modal-footer">
            <div className="footer-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button type="submit" className="btn btn-primary" disabled={saving || !dateValidation.valid}>
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
