import { TEAM_MEMBERS } from '../utils/constants';
import { activateSessionCache } from './sessionCache';
import { getSupabaseConfig, getSupabase } from './supabaseClient';

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
    const verified = await verifyCloudSession();
    if (!verified || verified.id !== user.id) {
      try { await supabase.auth.signOut(); } catch (signOutError) {
        console.warn('Could not clear an unverified Supabase session:', signOutError);
      }
      throw new Error('The verified Supabase account could not be confirmed.');
    }
    activateSessionCache(verified.cloudCacheScope, verified.email);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    return verified;
  }

  // Local demo authentication remains available without cloud credentials.
  const member = findTeamMember(cleanEmail);
  if (!member) throw new Error('This account is not available in local demo mode.');
  if (String(password).trim().toUpperCase() !== member.usn) throw new Error('Incorrect email or password.');
  activateSessionCache('demo');
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
  const needsEmailConfirmation = !data?.session;
  const user = needsEmailConfirmation ? normalizeAuthUser(data?.user) : await verifyCloudSession();
  if (data?.session && !user) throw new Error('The new Supabase session could not be verified.');
  if (user?.cloudCacheScope) activateSessionCache(user.cloudCacheScope, user.email);
  return { user, needsEmailConfirmation };
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
  return { user: await verifyCloudSession(), isCloud: true };
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
  if (getSupabase()) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
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
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase sign-out failed; the local session was still ended:', err);
  }
}

export const SESSION_CHECK_TIMEOUT_MS = 10000;

// A failed cloud session check. `transient` is true when Supabase could not be reached
// (offline, timeout, 5xx, rate limit): the session may still be valid, so it must not
// sign the user out. It is false when Supabase rejected the session itself.
export class SessionCheckError extends Error {
  constructor(message, { transient }) {
    super(message);
    this.name = 'SessionCheckError';
    this.transient = transient;
  }
}

const TRANSIENT_STATUSES = new Set([0, 408, 429]);

// No session at all simply means "not signed in", not an error to show.
export function isSessionMissing(error) {
  return error?.name === 'AuthSessionMissingError' || /auth session missing/i.test(error?.message ?? '');
}

// Network-level failures and server errors are retried; anything else fails closed.
export function isTransientAuthError(error) {
  if (!error) return false;
  if (error.transient === true || error.name === 'AuthRetryableFetchError') return true;
  if (error.name === 'TypeError' && /fetch|network/i.test(error.message ?? '')) return true;
  const status = Number(error.status);
  return TRANSIENT_STATUSES.has(status) || status >= 500;
}

// What a failed check means for the person using the app. A verified user keeps working
// through a network blip (their open edits stay mounted) and the check is retried; only
// a rejected session signs them out.
export function sessionCheckFailure(error, hasVerifiedUser) {
  if (error?.transient) {
    return hasVerifiedUser
      ? { keepUser: true, retry: true, message: '' }
      : { keepUser: false, retry: true, message: 'Could not reach Supabase to confirm your session. SprintFlow will try again when the connection is back. Saved data is retained.' };
  }
  return { keepUser: false, retry: false, message: 'Your cloud session has ended. Sign in again. Saved data is retained.' };
}

// The browser marker is a display preference, never proof of a cloud identity.
export async function verifyCloudSession() {
  const client = getSupabase();
  const endpoint = getSupabaseConfig().url || 'injected';
  if (!client) return null;
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new SessionCheckError('Session verification timed out.', { transient: true })), SESSION_CHECK_TIMEOUT_MS);
    });
    let result;
    try {
      result = await Promise.race([client.auth.getUser(), timeout]);
    } catch (err) {
      if (err instanceof SessionCheckError) throw err;
      throw new SessionCheckError(err?.message || 'Session verification failed.', { transient: isTransientAuthError(err) });
    }
    const { data, error } = result;
    if (isSessionMissing(error)) return null;
    if (error) throw new SessionCheckError(error.message || 'Session verification failed.', { transient: isTransientAuthError(error) });
    const user = normalizeAuthUser(data?.user);
    return user ? { ...user, cloudCacheScope: `${endpoint}:${user.id || user.email}` } : null;
  } finally { clearTimeout(timer); }
}
