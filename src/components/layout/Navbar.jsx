import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

export default function Navbar({ onOpenSettings, onOpenNewTask }) {
  const { currentUser, switchUser, teamMembers } = useAuth();
  const { project, supabaseConfig, sprints, activeSprintId, setActiveSprintId } = useProject();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <div className="brand-logo">
          <div className="logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">SprintFlow</h1>
            <span className="brand-subtitle">PESU SE Team 11</span>
          </div>
        </div>

        <div className="project-badge">
          <span className="badge-key">{project?.key || 'PMS'}</span>
          <span className="badge-name">{project?.name || 'Project Management'}</span>
        </div>

        {/* Sprint Selector */}
        <div className="sprint-selector-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <select 
            value={activeSprintId || ''} 
            onChange={(e) => setActiveSprintId(e.target.value)}
            className="sprint-select"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="navbar-right">
        {/* Supabase Status Indicator */}
        <button 
          onClick={onOpenSettings}
          className={`status-pill ${supabaseConfig.isConfigured ? 'connected' : 'offline'}`}
          title="Click to configure Supabase Connection"
        >
          <span className="status-dot"></span>
          <span>{supabaseConfig.isConfigured ? 'Supabase Connected' : 'Local / Demo Mode'}</span>
        </button>

        {/* New Task Button */}
        <button className="btn btn-primary" onClick={onOpenNewTask}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>New Task</span>
        </button>

        {/* User Switcher Dropdown */}
        <div className="user-dropdown-container">
          <button 
            className="user-profile-btn"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            <div className="user-avatar" style={{ backgroundColor: currentUser.color }}>
              {currentUser.initials}
            </div>
            <div className="user-meta">
              <span className="user-name">{currentUser.name.split(' ')[0]}</span>
              <span className="user-role-tag">{currentUser.usn}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {userDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <strong>Switch Teammate View</strong>
                <p>Simulate actions as any team member</p>
              </div>
              {teamMembers.map(m => (
                <button
                  key={m.id}
                  className={`dropdown-item ${m.id === currentUser.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(m.id);
                    setUserDropdownOpen(false);
                  }}
                >
                  <div className="user-avatar-sm" style={{ backgroundColor: m.color }}>
                    {m.initials}
                  </div>
                  <div className="item-text">
                    <span className="item-title">{m.name}</span>
                    <span className="item-sub">{m.usn} • {m.role}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
