import { TEAM_MEMBERS } from '../utils/constants';
import { activateSessionCache } from './sessionCache';
import { getSupabaseConfig, getSupabase } from './supabaseClient';

// Team sign-in (PMS-F-001). With Supabase configured, Supabase Auth checks the
// password. In local demo mode each member signs in with their USN as the password.
// Either way only the four Team 11 accounts can sign in.
const SESSION_KEY = 'sprintflow_session';
// Profile chosen by the earlier "simulate a teammate" switcher; no longer trusted.
const LEGACY_PROFILE_KEY = 'sprintflow_user';

// Short role names for the navbar; the full team role is shown in the profile menu.
export const ACCESS_ROLE_LABELS = Object.freeze({
  lead: 'Team Lead',
  developer: 'Team Member'
});

export const PERMISSIONS = Object.freeze({
  EDIT_PROJECT: 'project:edit',
  RESET_DEMO_DATA: 'data:reset'
});

// Only the team lead may change project details or replace the demo board.
const ROLE_PERMISSIONS = {
  lead: [PERMISSIONS.EDIT_PROJECT, PERMISSIONS.RESET_DEMO_DATA],
  developer: []
};

export function can(member, permission) {
  return Boolean(member && ROLE_PERMISSIONS[member.accessRole]?.includes(permission));
}

export function findTeamMember(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  return TEAM_MEMBERS.find(member => member.email === normalized) ?? null;
}

export async function signIn(email, password) {
  const member = findTeamMember(email);
  if (!member) throw new Error('Only Team 11 accounts can sign in to SprintFlow.');
  if (!String(password ?? '').trim()) throw new Error('Enter your password.');

  let mode = 'demo';
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email: member.email, password });
    if (error) throw new Error(`Sign-in failed: ${error.message}`);
    const verified = await verifyCloudSession();
    if (!verified || verified.id !== member.id) {
      await supabase.auth.signOut();
      throw new Error('The verified Supabase account does not match the selected team profile.');
    }
    activateSessionCache(verified.cloudCacheScope, verified.email);
    mode = 'supabase';
  } else if (String(password).trim().toUpperCase() !== member.usn) {
    throw new Error('Incorrect email or password.');
  }

  if (mode === 'demo') activateSessionCache('demo');
  const session = { memberId: member.id, email: member.email, mode, signedInAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_PROFILE_KEY);
  return member;
}

// Returns the signed-in team member, or null. A stored session that does not match
// a team member (edited, corrupt or stale) is discarded, so it cannot grant access.
export function restoreSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const member = session && TEAM_MEMBERS.find(m => m.id === session.memberId && m.email === session.email);
    if (member && !getSupabase() && (!session.mode || session.mode === 'demo')) return member;
    if (member) return null;
  } catch (err) {
    console.warn('Discarding unreadable session:', err);
  }
  localStorage.removeItem(SESSION_KEY);
  return null;
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
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
    const member = findTeamMember(data?.user?.email);
    return member ? { ...member, cloudCacheScope: `${endpoint}:${data.user.id || data.user.email}` } : null;
  } finally { clearTimeout(timer); }
}
