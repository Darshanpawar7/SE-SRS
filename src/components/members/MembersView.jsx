import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PROJECT_ROLE_LABELS } from '../../utils/projectDashboard';
import { canManageMembers } from '../../utils/projectAccess';

const EDITABLE_ROLES = ['lead', 'scrum_master', 'developer', 'viewer'];

export default function MembersView() {
  const { project, members, invitations, projectRole, currentMember, inviteProjectMember, changeProjectMemberRole, removeProjectMember, manageProjectInvitation } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const isLead = canManageMembers(projectRole);
  const run = async action => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); }
    catch (cause) { setError(cause.message || 'The member action failed.'); }
    finally { setBusy(false); }
  };
  const submitInvite = event => {
    event.preventDefault();
    run(async () => {
      await inviteProjectMember(email, role);
      setEmail('');
      setNotice('Invitation sent');
    });
  };
  return <section className="members-page" aria-labelledby="members-title">
    <div className="view-header"><div><p className="eyebrow">{project?.key}</p><h2 id="members-title" className="view-title">Members</h2><p className="view-subtitle">People and pending invitations for {project?.name}.</p></div></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {isLead && <form className="card member-invite-form" onSubmit={submitInvite}>
      <h3>Invite a teammate</h3>
      <label className="form-label" htmlFor="member-invite-email">Email address<input id="member-invite-email" className="form-input" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label className="form-label" htmlFor="member-invite-role">Project role<select id="member-invite-role" className="form-select" value={role} onChange={event => setRole(event.target.value)}>{EDITABLE_ROLES.map(item => <option key={item} value={item}>{PROJECT_ROLE_LABELS[item]}</option>)}</select></label>
      <button className="btn btn-primary" disabled={busy}>Send invitation</button>
    </form>}
    <div className="card"><h3>Project members</h3>
      {members.length ? <div className="members-list">{members.map(member => <article className="member-row" key={member.member_id}>
        <div className="member-avatar" aria-hidden="true">{String(member.member_name || '?').trim().split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</div>
        <div className="member-main"><strong>{member.member_name}</strong><span>{member.email || 'Email unavailable'}</span></div>
        {isLead && member.member_id !== currentMember?.member_id ? <>
          <label className="sr-only" htmlFor={`member-role-${member.member_id}`}>Role for {member.member_name}</label>
          <select id={`member-role-${member.member_id}`} className="form-select" value={member.role} disabled={busy} onChange={event => run(() => changeProjectMemberRole(member.member_id, event.target.value))}>{member.role === 'owner' && <option value="owner">Lead</option>}{EDITABLE_ROLES.map(item => <option key={item} value={item}>{PROJECT_ROLE_LABELS[item]}</option>)}</select>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => run(() => removeProjectMember(member.member_id))}>Remove</button>
        </> : <span className="member-role-label">{PROJECT_ROLE_LABELS[member.role] || member.role}</span>}
      </article>)}</div> : <p>No members are available for this project.</p>}
    </div>
    <div className="card"><h3>Pending invitations</h3>
      {invitations.length ? invitations.map(invitation => <article className="member-row" key={invitation.invitation_id}>
        <div className="member-main"><strong>{invitation.email}</strong><span>{PROJECT_ROLE_LABELS[invitation.role] || invitation.role} · Pending</span></div>
        {isLead && <><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => run(async () => { await manageProjectInvitation(invitation.invitation_id, 'resend'); setNotice('Invitation sent'); })}>Resend</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => run(() => manageProjectInvitation(invitation.invitation_id, 'cancel'))}>Cancel</button></>}
      </article>) : <p>No pending invitations.</p>}
    </div>
  </section>;
}
