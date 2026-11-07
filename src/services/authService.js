import { TEAM_MEMBERS } from '../utils/constants';
import { getSupabase } from './supabaseClient';

const SESSION_KEY = 'sprintflow_session';
const LEGACY_PROFILE_KEY = 'sprintflow_user';

export const ACCESS_ROLE_LABELS = Object.freeze({
  lead: 'Team Lead',
  scrum_master: 'Scrum Master',
  developer: 'Developer',
  viewer: 'Viewer',
  contributor: 'Developer',
  owner: 'Team Lead'
});

export const PERMISSIONS = Object.freeze({
  EDIT_PROJECT: 'project:edit',
  RESET_DEMO_DATA: 'data:reset'
});

const ROLE_PERMISSIONS = {
  lead: [PERMISSIONS.EDIT_PROJECT, PERMISSIONS.RESET_DEMO_DATA],
  owner: [PERMISSIONS.EDIT_PROJECT, PERMISSIONS.RESET_DEMO_DATA],
  developer: [],
  scrum_master: [],
  viewer: [],
  contributor: []
};

const initialsFor = (name = '') => String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'U';

export function normalizeAuthUser(user) {
  if (!user?.id || !user.email) return null;
  const name = user.user_metadata?.full_name?.trim() || user.email.split('@')[0];
  return {
    id: user.id,
    authUserId: user.id,
    email: user.email,
    name,
    initials: initialsFor(name),
    color: '#1f6b4c',
    role: 'Project member',
    accessRole: 'developer',
    mode: 'supabase'
  };
}

export function can(member, permission) {
  return Boolean(member && ROLE_PERMISSIONS[member.accessRole]?.includes(permission));
}

export function findTeamMember(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  return TEAM_MEMBERS.find(member => member.email === normalized) ?? null;
}

export async function signIn(email, password) {
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Enter your email address.');
  if (!String(password ?? '').trim()) throw new Error('Enter your password.');

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw new Error(error.message || 'Sign-in failed.');
    const user = normalizeAuthUser(data?.user ?? data?.session?.user);
    if (!user) throw new Error('Supabase did not return a signed-in user.');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    return user;
  }

  // Local demo authentication remains available without cloud credentials.
  const member = findTeamMember(cleanEmail);
  if (!member) throw new Error('This account is not available in local demo mode.');
  if (String(password).trim().toUpperCase() !== member.usn) throw new Error('Incorrect email or password.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ memberId: member.id, email: member.email, mode: 'demo' }));
  localStorage.removeItem(LEGACY_PROFILE_KEY);
  return member;
}

export async function signUp(fullName, email, password) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Connect a Supabase project before creating an account.');
  const { data, error } = await supabase.auth.signUp({
    email: String(email).trim().toLowerCase(),
    password,
    options: { data: { full_name: String(fullName).trim() } }
  });
  if (error) throw new Error(error.message || 'Account creation failed.');
  return { user: normalizeAuthUser(data?.user), needsEmailConfirmation: !data?.session };
}

export async function requestPasswordReset(email) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Connect a Supabase project before resetting a password.');
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo });
  if (error) throw new Error(error.message || 'Password reset could not be requested.');
}

export async function updatePassword(password) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('A Supabase recovery session is required to update your password.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message || 'Password update failed.');
}

export async function getAuthSession() {
  const supabase = getSupabase();
  if (!supabase) return { user: restoreSession(), isCloud: false };
  if (!supabase.auth?.getSession) return { user: null, isCloud: true };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message || 'The current session could not be restored.');
  return { user: normalizeAuthUser(data?.session?.user), isCloud: true };
}

export function subscribeAuth(callback) {
  const supabase = getSupabase();
  if (!supabase?.auth?.onAuthStateChange) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, user: normalizeAuthUser(session?.user) });
  });
  return () => data?.subscription?.unsubscribe?.();
}

export function restoreSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const member = session && session.mode === 'demo'
      && TEAM_MEMBERS.find(person => person.id === session.memberId && person.email === session.email);
    if (member) return member;
  } catch (err) {
    console.warn('Discarding unreadable local demo session:', err);
  }
  localStorage.removeItem(SESSION_KEY);
  return null;
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || 'Sign-out failed.');
}
