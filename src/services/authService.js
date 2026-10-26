import { TEAM_MEMBERS } from '../utils/constants';
import { getSupabase } from './supabaseClient';

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
    mode = 'supabase';
  } else if (String(password).trim().toUpperCase() !== member.usn) {
    throw new Error('Incorrect email or password.');
  }

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
    if (member) return member;
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
