import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACCESS_ROLE_LABELS, can, findTeamMember, PERMISSIONS, restoreSession, signIn, signOut } from '../services/authService';
import { setSupabaseClient } from '../services/supabaseClient';
import { TEAM_MEMBERS } from '../utils/constants';
import { AuthProvider } from '../context/AuthContext';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import SignInView from '../components/auth/SignInView';
import App from '../App';

const [lead, developer] = TEAM_MEMBERS;

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
    await expect(signIn('intruder@example.com', 'anything')).rejects.toThrow('Only Team 11 accounts');
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

  it('uses Supabase Auth when configured and still rejects non-team accounts', async () => {
    const signInWithPassword = vi.fn(async ({ password }) => (
      password === 'correct horse' ? { data: {}, error: null } : { data: null, error: { message: 'Invalid login credentials' } }
    ));
    setSupabaseClient({ auth: { signInWithPassword, signOut: vi.fn(async () => ({ error: null })) } });

    await expect(signIn(developer.email, 'wrong')).rejects.toThrow('Invalid login credentials');
    expect(await signIn(developer.email, 'correct horse')).toMatchObject({ id: developer.id });
    expect(signInWithPassword).toHaveBeenLastCalledWith({ email: developer.email, password: 'correct horse' });

    signInWithPassword.mockClear();
    await expect(signIn('someone@pes.edu', 'correct horse')).rejects.toThrow('Only Team 11 accounts');
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('only lets the team lead use lead-only actions', () => {
    expect(can(lead, PERMISSIONS.EDIT_PROJECT)).toBe(true);
    expect(can(lead, PERMISSIONS.RESET_DEMO_DATA)).toBe(true);
    expect(can(developer, PERMISSIONS.EDIT_PROJECT)).toBe(false);
    expect(can(developer, PERMISSIONS.RESET_DEMO_DATA)).toBe(false);
    expect(can(null, PERMISSIONS.EDIT_PROJECT)).toBe(false);
    expect(findTeamMember('ESHWAR@pes.edu')).toMatchObject({ usn: 'PES2UG24CS173' });
    expect(ACCESS_ROLE_LABELS[lead.accessRole]).toBe('Team Lead');
    expect(ACCESS_ROLE_LABELS[developer.accessRole]).toBe('Team Member');
  });

  it('renders the sign-in view with all four team profiles', () => {
    const html = renderWithProviders(React.createElement(SignInView));
    TEAM_MEMBERS.forEach(member => expect(html).toContain(member.name));
    expect(html).toContain('type="password"');
    expect(html).toContain('Demo mode: sign in with your USN as the password.');
    expect(html).not.toContain('Use local demo mode instead');
  });

  it('shows only the sign-in view until a member signs in, then the application', async () => {
    const signedOut = renderWithProviders(React.createElement(App));
    expect(signedOut).toContain('Team profile');
    expect(signedOut).not.toContain('New Task');

    await signIn(developer.email, developer.usn);
    const signedIn = renderWithProviders(React.createElement(App));
    expect(signedIn).not.toContain('Team profile');
    expect(signedIn).toContain('New Task');
    expect(signedIn).toContain(ACCESS_ROLE_LABELS[developer.accessRole]);
  });

  it('offers local demo mode when the Supabase connection was saved in this browser', () => {
    saveSupabaseConnection(storage);
    const saved = renderWithProviders(React.createElement(SignInView));
    expect(saved).toContain('Use the password of your Supabase account.');
    expect(saved).toContain('Use local demo mode instead');

    // A connection built into the deployment cannot be removed from the sign-in view.
    vi.stubEnv('VITE_SUPABASE_URL', 'https://team11.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    const builtIn = renderWithProviders(React.createElement(SignInView));
    expect(builtIn).toContain('Use the password of your Supabase account.');
    expect(builtIn).not.toContain('Use local demo mode instead');
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
