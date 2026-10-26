import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { clearSupabaseConfig } from '../../services/supabaseClient';

// Shown until a team member signs in, so the app cannot be used anonymously.
export default function SignInView() {
  const { teamMembers, signIn } = useAuth();
  const { supabaseConfig, refreshConfig } = useProject();
  const [memberId, setMemberId] = useState(teamMembers[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = teamMembers.find(member => member.id === memberId);
  const cloudMode = supabaseConfig.isConfigured;
  // A Supabase connection saved in this browser can be removed here, so a team without
  // Supabase Auth accounts is not locked out. One built into the deployment cannot.
  const canUseDemoMode = cloudMode && !supabaseConfig.isBuiltIn;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(selected.email, password);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const handleUseDemoMode = () => {
    clearSupabaseConfig();
    setError('');
    setPassword('');
    refreshConfig();
  };

  return (
    <div className="signin-page">
      <form className="signin-card" onSubmit={handleSubmit}>
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

        <h2 className="view-title">Sign in</h2>
        <p className="view-subtitle">Choose your Team 11 profile and confirm with your password.</p>

        <fieldset className="profile-options">
          <legend className="form-label">Team profile</legend>
          {teamMembers.map(member => (
            <label key={member.id} className={`profile-option ${member.id === memberId ? 'selected' : ''}`}>
              <input
                type="radio"
                name="profile"
                value={member.id}
                checked={member.id === memberId}
                onChange={() => { setMemberId(member.id); setError(''); }}
              />
              <span className="user-avatar-sm" style={{ backgroundColor: member.color }}>{member.initials}</span>
              <span className="item-text">
                <span className="item-title">{member.name}</span>
                <span className="item-sub">{member.role}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="form-group">
          <label className="form-label" htmlFor="signin-email">Email</label>
          <input id="signin-email" className="form-input" value={selected.email} readOnly />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signin-password">Password</label>
          <input
            id="signin-password"
            type="password"
            className="form-input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="card-subtitle">
            {cloudMode
              ? 'Use the password of your Supabase account.'
              : 'Demo mode: sign in with your USN as the password.'}
          </p>
        </div>

        {error && <p role="alert" className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        {canUseDemoMode && (
          <>
            <button type="button" className="btn btn-secondary" onClick={handleUseDemoMode} disabled={busy}>
              Use local demo mode instead
            </button>
            <p className="card-subtitle">
              No Supabase account yet? This removes the Supabase connection saved in this browser.
              You can connect again later in Database Settings.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
