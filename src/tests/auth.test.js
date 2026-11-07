import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACCESS_ROLE_LABELS, can, findTeamMember, PERMISSIONS, requestPasswordReset, restoreSession, signIn, signOut, signUp, updatePassword } from '../services/authService';
import { setSupabaseClient } from '../services/supabaseClient';
import { TEAM_MEMBERS } from '../utils/constants';
import { AuthProvider } from '../context/AuthContext';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import SignInView from '../components/auth/SignInView';
import App from '../App';
import { isValidAccountPassword, validateAccountName, validateAccountPassword } from '../utils/authValidation';

const [lead, developer] = TEAM_MEMBERS;
const authSchema = readFileSync(new URL('../../database/migrations/20261106_auth_projects_rls.sql', import.meta.url), 'utf8');

const renderWithProviders = (element) => renderToStaticMarkup(React.createElement(AuthProvider, null,
  React.createElement(ProjectProvider, null, element)));

// Renders the real providers once and returns the project context, so tests call the
// same functions the screens use.
const renderProject = () => {
  let project;
  const Capture = () => { project = useProject(); return null; };
  renderWithProviders(React.createElement(Capture));
  return project;
};

const saveSupabaseConnection = (storage) => {
  storage.set('supabase_url', 'https://team11.supabase.co');
  storage.set('supabase_key', 'anon-key');
};

describe('PMS-F-001 team sign-in and profile switching', () => {
  let storage;

  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Keep these tests isolated from a developer's local Vite environment.
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    setSupabaseClient(null);
  });

  afterEach(() => {
    setSupabaseClient(undefined);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('TC-AUTH-01: signs in a team account and keeps the session after a reload', async () => {
    expect(restoreSession()).toBeNull();

    const member = await signIn('  Darshan@PES.edu ', 'pes2ug24cs143');

    expect(member).toMatchObject({ id: lead.id, name: lead.name, role: lead.role });
    expect(restoreSession()).toMatchObject({ id: lead.id });
  });

  it('rejects a wrong password, an empty password and accounts outside the team', async () => {
    await expect(signIn(lead.email, 'PES2UG24CS158')).rejects.toThrow('Incorrect email or password');
    await expect(signIn(lead.email, '   ')).rejects.toThrow('Enter your password');
    await expect(signIn('intruder@example.com', 'anything')).rejects.toThrow('not available in local demo mode');
    expect(restoreSession()).toBeNull();
  });

  it('switches profile by signing out and signing in as another member', async () => {
    await signIn(lead.email, lead.usn);
    await signOut();
    expect(restoreSession()).toBeNull();

    await signIn(developer.email, developer.usn);
    expect(restoreSession()).toMatchObject({ id: developer.id });
  });

  it('discards a stored session that was edited or corrupted', () => {
    storage.set('sprintflow_session', JSON.stringify({ memberId: lead.id, email: developer.email }));
    expect(restoreSession()).toBeNull();
    expect(storage.has('sprintflow_session')).toBe(false);

    storage.set('sprintflow_session', '{not json');
    expect(restoreSession()).toBeNull();

    // The old "simulate a teammate" profile no longer grants access.
    storage.set('sprintflow_user', JSON.stringify(lead));
    expect(restoreSession()).toBeNull();
  });

  it('authenticates any valid cloud identity through Supabase instead of a team allowlist', async () => {
    const user = { id: 'auth-user-9', email: 'new.person@example.com', user_metadata: { full_name: 'New Person' } };
    const signInWithPassword = vi.fn(async () => ({ data: { user }, error: null }));
    setSupabaseClient({ auth: { signInWithPassword } });

    expect(await signIn(' New.Person@Example.com ', 'cloud-password')).toMatchObject({
      id: user.id, email: user.email, name: 'New Person', mode: 'supabase'
    });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: user.email, password: 'cloud-password' });
  });

  it('only lets the team lead use lead-only actions', () => {
    expect(can(lead, PERMISSIONS.EDIT_PROJECT)).toBe(true);
    expect(can(lead, PERMISSIONS.RESET_DEMO_DATA)).toBe(true);
    expect(can(developer, PERMISSIONS.EDIT_PROJECT)).toBe(false);
    expect(can(developer, PERMISSIONS.RESET_DEMO_DATA)).toBe(false);
    expect(can(null, PERMISSIONS.EDIT_PROJECT)).toBe(false);
    expect(findTeamMember('ESHWAR@pes.edu')).toMatchObject({ usn: 'PES2UG24CS173' });
    expect(ACCESS_ROLE_LABELS[lead.accessRole]).toBe('Team Lead');
    expect(ACCESS_ROLE_LABELS[developer.accessRole]).toBe('Developer');
  });

  it('renders email sign-in and account links without listing fixed team identities', () => {
    const html = renderWithProviders(React.createElement(SignInView));
    TEAM_MEMBERS.forEach(member => expect(html).not.toContain(member.name));
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('Forgot password?');
    expect(html).toContain('Create an account');
    expect(html).not.toContain('Use local demo mode instead');
  });

  it('renders account-creation fields and explicit password visibility controls', () => {
    const html = renderWithProviders(React.createElement(SignInView, { initialView: 'signup' }));
    expect(html).toContain('id="signup-name"');
    expect(html).toContain('id="auth-email"');
    expect(html).toContain('id="auth-password"');
    expect(html).toContain('id="auth-confirm-password"');
    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain('verify your email');
  });

  it('applies the documented account name and password requirements', () => {
    expect(validateAccountName('  New User  ')).toBe('New User');
    expect(() => validateAccountName(' '.repeat(2))).toThrow('name of 1 to 100 characters');
    expect(() => validateAccountName('N'.repeat(101))).toThrow('name of 1 to 100 characters');
    expect(isValidAccountPassword('StrongPass1')).toBe(true);
    expect(isValidAccountPassword('weakpass1')).toBe(false);
    expect(() => validateAccountPassword('short')).toThrow('8–128 characters');
  });

  it('shows only the sign-in view until a member signs in, then the application', async () => {
    const signedOut = renderWithProviders(React.createElement(App));
    expect(signedOut).toContain('Use your SprintFlow account to continue.');
    expect(signedOut).not.toContain('New Task');

    await signIn(developer.email, developer.usn);
    const signedIn = renderWithProviders(React.createElement(App));
    expect(signedIn).not.toContain('Use your SprintFlow account to continue.');
    expect(signedIn).toContain('Loading your workspace…');
  });

  it('does not expose a demo-mode escape when a Supabase connection is configured', () => {
    saveSupabaseConnection(storage);
    const saved = renderWithProviders(React.createElement(SignInView));
    expect(saved).toContain('SprintFlow account to continue');
    expect(saved).not.toContain('Use local demo mode instead');

    // A connection built into the deployment cannot be removed from the sign-in view.
    vi.stubEnv('VITE_SUPABASE_URL', 'https://team11.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    const builtIn = renderWithProviders(React.createElement(SignInView));
    expect(builtIn).toContain('SprintFlow account to continue');
    expect(builtIn).not.toContain('Use local demo mode instead');
  });

  it('creates an account with a full-name profile attribute and supports recovery actions', async () => {
    const auth = {
      signUp: vi.fn(async () => ({ data: { user: { id: 'auth-new', email: 'new@example.com', user_metadata: { full_name: 'New User' } }, session: null }, error: null })),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
      updateUser: vi.fn(async () => ({ error: null }))
    };
    setSupabaseClient({ auth });
    vi.stubGlobal('window', { location: { origin: 'https://app.example', pathname: '/' } });

    await expect(signUp('New User', ' New@Example.com ', 'StrongPass1')).resolves.toMatchObject({
      needsEmailConfirmation: true, user: { id: 'auth-new', name: 'New User' }
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com', password: 'StrongPass1', options: { data: { full_name: 'New User' } }
    });
    await requestPasswordReset('new@example.com');
    await updatePassword('NewStrongPass2');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('new@example.com', expect.objectContaining({ redirectTo: expect.any(String) }));
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'NewStrongPass2' });
  });

  it('lets only the team lead reset the demo data, and only while Supabase is not connected', async () => {
    const project = renderProject();
    await expect(project.resetData(developer)).rejects.toThrow('Only the team lead can reset the demo data.');

    saveSupabaseConnection(storage);
    const before = Object.fromEntries(storage);
    await expect(project.resetData(lead)).rejects.toThrow('Disconnect Supabase to reset');
    expect(Object.fromEntries(storage)).toEqual(before);

    storage.delete('supabase_url');
    storage.delete('supabase_key');
    await project.resetData(lead);
    expect(JSON.parse(storage.get('sprintflow_activity'))[0]).toMatchObject({ actor: lead.name, action: 'reset demo data for' });
  });
});

// The cloud auth flow is moving from a hard-coded team allowlist to Supabase
// Auth identities. Keep the existing offline demo tests above intact; these
// contract checks cover the database-side verified identity and invitation
// guarantees until the Supabase-backed UI flow lands in its own stage.
describe('Supabase Auth identity and invitation contract', () => {
  it('uses verified auth.uid identity and never accepts a client email when claiming invitations', () => {
    expect(authSchema).toMatch(/WHERE u\.id = auth\.uid\(\) AND u\.email_confirmed_at IS NOT NULL/i);
    expect(authSchema).toMatch(/FUNCTION public\.claim_project_invitations\(\)/i);
    expect(authSchema).not.toMatch(/FUNCTION public\.claim_project_invitations\([^)]/i);
  });

  it('returns the same invitation response for existing and new addresses', () => {
    expect(authSchema).toMatch(/response is intentionally invariant/i);
    expect(authSchema).toMatch(/RETURN 'invited'/i);
    expect(authSchema).not.toMatch(/RETURN\s+CASE[\s\S]{0,80}added/i);
  });
});
