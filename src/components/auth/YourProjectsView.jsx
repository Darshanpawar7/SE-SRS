import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { validateProjectDateRange } from '../../utils/projectDates';
import { PROJECT_ROLE_LABELS } from '../../utils/projectDashboard';

const today = () => new Date().toISOString().slice(0, 10);
const inThirtyDays = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

export default function YourProjectsView() {
  const { currentUser, signOut } = useAuth();
  const { projects, projectError, selectProject, createProject, invitations, respondToProjectInvitation, refreshInvitations } = useProject();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [targetDate, setTargetDate] = useState(inThirtyDays());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dateValidation = validateProjectDateRange(startDate, targetDate);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createProject({ name, key, description, start_date: startDate, target_date: targetDate });
    } catch (createError) {
      setError(createError.message || 'The project could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="projects-page">
      <header className="projects-header">
        <div className="brand-logo">
          <div className="logo-badge" aria-hidden="true">SF</div>
          <div><h1 className="brand-title">SprintFlow</h1><span className="brand-subtitle">Your projects</span></div>
        </div>
        <div className="projects-account">
          <span>{currentUser?.name || currentUser?.email}</span>
          <button type="button" className="btn btn-secondary" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className="projects-content" aria-labelledby="projects-title">
        <div className="projects-heading-row">
          <div><p className="eyebrow">WORKSPACE</p><h2 id="projects-title">Your projects</h2>
            <p className="view-subtitle">Open a project you belong to or create a new one.</p></div>
          <button type="button" className="btn btn-primary" onClick={() => { setShowForm(value => !value); setError(''); }}>
            {showForm ? 'Cancel' : 'Create project'}
          </button>
        </div>

        {(projectError || error) && <p className="form-error" role="alert">{error || projectError}</p>}

        {showForm && <form className="project-create-card" onSubmit={submit}>
          <h3>New project</h3>
          <div className="form-group"><label className="form-label" htmlFor="new-project-name">Project name</label>
            <input id="new-project-name" className="form-input" value={name} maxLength={80} required
              onChange={event => setName(event.target.value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor="new-project-key">Project key</label>
            <input id="new-project-key" className="form-input" value={key} maxLength={10} required
              placeholder="e.g. PMS" onChange={event => setKey(event.target.value.toUpperCase())} /></div>
          <div className="form-group"><label className="form-label" htmlFor="new-project-description">Description</label>
            <textarea id="new-project-description" className="form-input" value={description} maxLength={2000}
              onChange={event => setDescription(event.target.value)} rows={3} /></div>
          <div className="projects-date-row">
            <div className="form-group"><label className="form-label" htmlFor="new-project-start">Start date</label>
              <input id="new-project-start" className="form-input" type="date" value={startDate} required
                onChange={event => setStartDate(event.target.value)} /></div>
            <div className="form-group"><label className="form-label" htmlFor="new-project-target">Target date</label>
              <input id="new-project-target" className="form-input" type="date" value={targetDate} min={startDate || undefined} required aria-invalid={!dateValidation.valid} aria-describedby={!dateValidation.valid ? 'new-project-date-error' : undefined}
                onChange={event => setTargetDate(event.target.value)} /></div>
          </div>
          {!dateValidation.valid && <p id="new-project-date-error" role="alert" className="form-error">{dateValidation.error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || !dateValidation.valid}>{busy ? 'Creating…' : 'Create project'}</button>
        </form>}

        {invitations.length > 0 && <section className="card incoming-invitations" aria-labelledby="incoming-invitations-title"><h3 id="incoming-invitations-title">Project invitations</h3>{invitations.map(invitation => <article className="member-row" key={invitation.invitation_id}><div className="member-main"><strong>You’ve been invited to {invitation.project_name} as {PROJECT_ROLE_LABELS[invitation.role] || invitation.role}</strong><span>Invitation pending</span></div><button type="button" className="btn btn-primary" onClick={async () => { await respondToProjectInvitation(invitation.invitation_id, true); await refreshInvitations(null); }}>Accept</button><button type="button" className="btn btn-secondary" onClick={async () => { await respondToProjectInvitation(invitation.invitation_id, false); await refreshInvitations(null); }}>Decline</button></article>)}</section>}

        {projects.length ? <ul className="project-list" aria-label="Projects you can access">
          {projects.map(item => <li key={item.id}>
            <button type="button" className="project-list-item" onClick={() => selectProject(item.id)}>
              <span className="project-key">{item.key}</span>
              <span className="project-item-copy"><strong>{item.name}</strong><span>{item.description || 'No description yet.'}</span></span>
              <span aria-hidden="true">Open&nbsp;›</span>
            </button>
          </li>)}
        </ul> : <div className="projects-empty" role="status">
          <h3>No projects yet</h3><p>Create one now, or ask a project lead to invite you.</p>
        </div>}
      </section>
    </main>
  );
}
