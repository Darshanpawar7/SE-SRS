import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../services/authService';

// Mounted only while open, so it always starts from the saved project values.
export default function ProjectSettingsModal({ onClose }) {
  const { project, updateProject } = useProject();
  const { currentUser, can } = useAuth();
  const canEdit = can(PERMISSIONS.EDIT_PROJECT);

  const [values, setValues] = useState(() => ({
    key: project?.key ?? '',
    name: project?.name ?? '',
    start_date: project?.start_date ?? '',
    target_date: project?.target_date ?? ''
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => setValues(current => ({ ...current, [field]: e.target.value }));

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
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Project Details</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
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
                onChange={setField('name')}
                maxLength={80}
                readOnly={!canEdit}
              />
            </div>
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
                readOnly={!canEdit}
              />
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
