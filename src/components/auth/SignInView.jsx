import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { validateAccountName, validateAccountPassword } from '../../utils/authValidation';

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="auth-password-control">
        <input id={id} className="form-input" type={visible ? 'text' : 'password'}
          autoComplete={autoComplete} value={value} onChange={onChange} required />
        <button className="btn btn-secondary auth-password-toggle" type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible} onClick={() => setVisible(current => !current)}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export default function SignInView({ initialView = 'signin' }) {
  const { signIn, signUp, requestPasswordReset, updatePassword, passwordRecovery } = useAuth();
  const { supabaseConfig } = useProject();
  const [view, setView] = useState(initialView);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const activeView = passwordRecovery ? 'reset' : view;

  const moveTo = next => {
    setView(next);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmation('');
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (activeView === 'signin') {
        await signIn(email, password);
      } else if (activeView === 'signup') {
        const cleanName = validateAccountName(fullName);
        validateAccountPassword(password);
        if (password !== confirmation) throw new Error('The passwords do not match.');
        const result = await signUp(cleanName, email, password);
        if (result.needsEmailConfirmation) {
          setNotice('Account created. Verify your email using the link we sent before signing in.');
          moveTo('signin');
          setNotice('Account created. Verify your email using the link we sent before signing in.');
        }
      } else if (activeView === 'forgot') {
        await requestPasswordReset(email);
        setNotice('If an account matches that email, password reset instructions will arrive shortly.');
      } else {
        validateAccountPassword(password);
        if (password !== confirmation) throw new Error('The passwords do not match.');
        await updatePassword(password);
        moveTo('signin');
        setNotice('Password updated. Sign in with your new password.');
      }
    } catch (submitError) {
      setError(submitError.message || 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const heading = {
    signin: 'Sign in',
    signup: 'Create account',
    forgot: 'Reset password',
    reset: 'Choose a new password'
  }[activeView];

  return (
    <div className="signin-page">
      <form className="signin-card" onSubmit={submit}>
        <div className="brand-logo">
          <div className="logo-badge" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div><h1 className="brand-title">SprintFlow</h1><span className="brand-subtitle">Project workspace</span></div>
        </div>

        <h2 className="view-title">{heading}</h2>
        <p className="view-subtitle">
          {activeView === 'signin' ? 'Use your SprintFlow account to continue.'
            : activeView === 'signup' ? 'Create an account and verify your email to get started.'
              : activeView === 'forgot' ? 'Enter your account email and we will send reset instructions.'
                : 'Set a new password for your account.'}
        </p>

        {activeView === 'signup' && (
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full name</label>
            <input id="signup-name" className="form-input" autoComplete="name" maxLength={100}
              value={fullName} onChange={event => setFullName(event.target.value)} required />
          </div>
        )}

        {activeView !== 'reset' && (
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input id="auth-email" className="form-input" type="email" autoComplete="email"
              value={email} onChange={event => setEmail(event.target.value)} required />
          </div>
        )}

        {(activeView === 'signin' || activeView === 'signup' || activeView === 'reset') && (
          <PasswordField id={activeView === 'reset' ? 'reset-password' : 'auth-password'}
            label={activeView === 'reset' ? 'New password' : 'Password'} value={password}
            autoComplete={activeView === 'signin' ? 'current-password' : 'new-password'}
            onChange={event => setPassword(event.target.value)} />
        )}
        {(activeView === 'signup' || activeView === 'reset') && (
          <PasswordField id="auth-confirm-password" label="Confirm password" value={confirmation}
            autoComplete="new-password" onChange={event => setConfirmation(event.target.value)} />
        )}

        {activeView === 'signup' && <p className="card-subtitle">Password: 8–128 characters, including lowercase, uppercase and a number.</p>}
        {activeView === 'signin' && !supabaseConfig.isConfigured && (
          <p className="card-subtitle">Local demo mode is available without a Supabase connection.</p>
        )}
        {error && <p role="alert" className="form-error">{error}</p>}
        {notice && <p role="status" className="auth-notice">{notice}</p>}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Please wait…' : activeView === 'signin' ? 'Sign in' : activeView === 'signup' ? 'Create account' : activeView === 'forgot' ? 'Send reset link' : 'Update password'}
        </button>

        {activeView === 'signin' && <div className="auth-links">
          <button type="button" className="auth-link" onClick={() => moveTo('forgot')}>Forgot password?</button>
          <button type="button" className="auth-link" onClick={() => moveTo('signup')}>Create an account</button>
        </div>}
        {(activeView === 'forgot' || activeView === 'signup' || activeView === 'reset') && (
          <button type="button" className="auth-link" onClick={() => moveTo('signin')}>Back to sign in</button>
        )}
      </form>
    </div>
  );
}
