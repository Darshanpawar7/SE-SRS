import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { activateSessionCache } from '../services/sessionCache';
import { getSupabase } from '../services/supabaseClient';
import { TEAM_MEMBERS } from '../utils/constants';
import {
  can,
  requestPasswordReset,
  restoreSession,
  sessionCheckFailure,
  signIn as signInWithPassword,
  signOut as endSession,
  signUp as createAccount,
  updatePassword as saveNewPassword,
  verifyCloudSession
} from '../services/authService';

const AuthContext = createContext(null);
const SESSION_RETRY_MS = 30000;

export function AuthProvider({ children }) {
  const [initialCloudSession] = useState(() => Boolean(getSupabase()));
  const [currentUser, setCurrentUser] = useState(() => initialCloudSession ? null : restoreSession());
  const [authReady, setAuthReady] = useState(() => !initialCloudSession);
  const [cloudVerified, setCloudVerified] = useState(false);
  const [authError, setAuthError] = useState('');
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [sessionKind, setSessionKind] = useState(() => initialCloudSession ? 'none' : (restoreSession() ? 'demo' : 'none'));
  const generation = useRef(0);
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
        const user = await verifyCloudSession();
        if (stopped || version !== generation.current) return;
        if (user) activateSessionCache(user.cloudCacheScope, user.email);
        hasVerifiedUser.current = Boolean(user);
        setCurrentUser(user);
        setCloudVerified(Boolean(user));
        setSessionKind(user ? 'supabase' : 'none');
        setAuthError('');
        setAuthReady(true);
      } catch (error) {
        if (stopped || version !== generation.current) return;
        const outcome = sessionCheckFailure(error, hasVerifiedUser.current);
        if (!outcome.keepUser) {
          hasVerifiedUser.current = false;
          setCurrentUser(null);
          setCloudVerified(false);
          setSessionKind('none');
        }
        setAuthError(outcome.message);
        setAuthReady(true);
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
      if (!client) {
        generation.current++;
        activateSessionCache('demo');
        const demoUser = restoreSession();
        setCurrentUser(demoUser);
        setSessionKind(demoUser ? 'demo' : 'none');
        setCloudVerified(false);
        setAuthError('');
        setAuthReady(true);
        return;
      }

      generation.current++;
      setCurrentUser(null);
      setSessionKind('none');
      setCloudVerified(false);
      setAuthReady(false);
      verify();
      subscription = client.auth.onAuthStateChange?.((event) => {
        // Supabase auth callbacks are synchronous; defer all follow-up Auth calls.
        clearTimeout(timer);
        if (event === 'SIGNED_OUT') {
          clearTimeout(retryTimer);
          generation.current++;
          hasVerifiedUser.current = false;
          setCurrentUser(null);
          setSessionKind('none');
          setCloudVerified(false);
          setPasswordRecovery(false);
          setAuthReady(true);
        } else {
          if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
          timer = setTimeout(verify, 0);
        }
      })?.data?.subscription;
    };

    timer = setTimeout(connect, 0);
    window.addEventListener('sprintflow:connection-change', connect);
    window.addEventListener('online', retryWhenOnline);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(retryTimer);
      subscription?.unsubscribe();
      window.removeEventListener('sprintflow:connection-change', connect);
      window.removeEventListener('online', retryWhenOnline);
    };
  }, []);

  const signIn = async (email, password) => {
    setAuthError('');
    const user = await signInWithPassword(email, password);
    generation.current++;
    hasVerifiedUser.current = user.mode === 'supabase';
    setCurrentUser(user);
    setSessionKind(user.mode === 'supabase' ? 'supabase' : 'demo');
    setCloudVerified(user.mode === 'supabase');
    setPasswordRecovery(false);
    setAuthReady(true);
    return user;
  };

  const signUp = async (name, email, password) => {
    setAuthError('');
    const result = await createAccount(name, email, password);
    if (result.user && !result.needsEmailConfirmation) {
      generation.current++;
      const verified = Boolean(result.user.cloudCacheScope);
      hasVerifiedUser.current = verified;
      setCurrentUser(result.user);
      setSessionKind('supabase');
      setCloudVerified(verified);
      setAuthReady(true);
    }
    return result;
  };

  const requestReset = async email => {
    setAuthError('');
    return requestPasswordReset(email);
  };

  const updatePassword = async password => {
    setAuthError('');
    await saveNewPassword(password);
    setPasswordRecovery(false);
  };

  const signOut = async () => {
    generation.current++;
    hasVerifiedUser.current = false;
    setCurrentUser(null);
    setSessionKind('none');
    setCloudVerified(false);
    setAuthReady(true);
    setPasswordRecovery(false);
    await endSession();
  };

  const value = useMemo(() => ({
    currentUser,
    authReady,
    cloudVerified,
    authError,
    passwordRecovery,
    sessionKind,
    teamMembers: TEAM_MEMBERS,
    signIn,
    signUp,
    requestPasswordReset: requestReset,
    updatePassword,
    signOut,
    can: permission => can(currentUser, permission)
  }), [currentUser, authReady, cloudVerified, authError, passwordRecovery, sessionKind]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
