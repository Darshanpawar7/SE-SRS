import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { activateSessionCache } from '../services/sessionCache';
import { getSupabase } from '../services/supabaseClient';
import { TEAM_MEMBERS } from '../utils/constants';
import { can, restoreSession, sessionCheckFailure, verifyCloudSession, signIn as signInWithPassword, signOut as endSession } from '../services/authService';

const AuthContext = createContext();
// How long to wait before re-checking a session that could not be confirmed.
const SESSION_RETRY_MS = 30000;

export function AuthProvider({ children }) {
  // The session survives reloads; without one the app shows the sign-in view.
  const [currentUser, setCurrentUser] = useState(() => restoreSession());

  const [cloudVerified, setCloudVerified] = useState(false);
  const [authError, setAuthError] = useState('');
  const generation = useRef(0);
  // True while a Supabase-verified member is using the app. A network blip must not
  // unmount their workspace (and any task draft that is open).
  const hasVerifiedUser = useRef(false);
  useEffect(() => {
    let stopped = false;
    let subscription;
    let timer;
    let retryTimer;
    const verify = async () => {
      const version = ++generation.current;
      clearTimeout(retryTimer);
      try {
        const member = await verifyCloudSession();
        if (!stopped && version === generation.current) {
          if (member) activateSessionCache(member.cloudCacheScope, member.email);
          hasVerifiedUser.current = Boolean(member);
          setCurrentUser(member); setCloudVerified(Boolean(member)); setAuthError('');
        }
      } catch (err) {
        if (stopped || version !== generation.current) return;
        const outcome = sessionCheckFailure(err, hasVerifiedUser.current);
        if (!outcome.keepUser) {
          hasVerifiedUser.current = false;
          setCurrentUser(null); setCloudVerified(false);
        }
        setAuthError(outcome.message);
        // Check again later; the 'online' listener below also retries sooner.
        if (outcome.retry) retryTimer = setTimeout(verify, SESSION_RETRY_MS);
      }
    };
    const retryWhenOnline = () => {
      if (!getSupabase()) return;
      clearTimeout(timer);
      timer = setTimeout(verify, 0);
    };
    const connect = () => {
      subscription?.unsubscribe();
      clearTimeout(retryTimer);
      hasVerifiedUser.current = false;
      const client = getSupabase();
      if (!client) { activateSessionCache('demo'); generation.current++; setCloudVerified(false); setCurrentUser(restoreSession()); return; }
      generation.current++; setCurrentUser(null); setCloudVerified(false);
      verify();
      subscription = client.auth.onAuthStateChange?.((event) => {
        // Never await an Auth call inside Supabase's synchronous auth callback.
        clearTimeout(timer);
        if (event === 'SIGNED_OUT') {
          clearTimeout(retryTimer);
          hasVerifiedUser.current = false;
          generation.current++; setCurrentUser(null); setCloudVerified(false);
        } else { timer = setTimeout(verify, 0); }
      })?.data?.subscription;
    };
    // Async callbacks update state; initial render remains side-effect free.
    timer = setTimeout(connect, 0);
    window.addEventListener('sprintflow:connection-change', connect);
    window.addEventListener('online', retryWhenOnline);
    return () => {
      stopped = true; clearTimeout(timer); clearTimeout(retryTimer); subscription?.unsubscribe();
      window.removeEventListener('sprintflow:connection-change', connect);
      window.removeEventListener('online', retryWhenOnline);
    };
  }, []);

  const signIn = async (email, password) => {
    const member = await signInWithPassword(email, password);
    generation.current++;
    hasVerifiedUser.current = Boolean(getSupabase());
    setCloudVerified(Boolean(getSupabase())); setAuthError('');
    setCurrentUser(member);
    return member;
  };

  // Switching profile means signing out and signing in as another team member.
  const signOut = async () => {
    generation.current++;
    hasVerifiedUser.current = false;
    setCurrentUser(null); setCloudVerified(false);
    await endSession();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      cloudVerified,
      authError,
      teamMembers: TEAM_MEMBERS,
      signIn,
      signOut,
      can: (permission) => can(currentUser, permission)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
