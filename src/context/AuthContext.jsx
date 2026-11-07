import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  can,
  getAuthSession,
  requestPasswordReset,
  restoreSession,
  signIn as signInWithPassword,
  signOut as endSession,
  signUp as createAccount,
  subscribeAuth,
  updatePassword as saveNewPassword
} from '../services/authService';
import { getSupabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [initialCloudSession] = useState(() => Boolean(getSupabase()));
  const [currentUser, setCurrentUser] = useState(() => initialCloudSession ? null : restoreSession());
  const [authReady, setAuthReady] = useState(() => !initialCloudSession);
  const [authError, setAuthError] = useState('');
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [sessionKind, setSessionKind] = useState(() => initialCloudSession ? 'none' : (restoreSession() ? 'demo' : 'none'));

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAuth(({ event, user }) => {
      if (!active) return;
      setCurrentUser(user);
      setSessionKind(user ? 'supabase' : 'none');
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
      setAuthReady(true);
    });
    getAuthSession().then(({ user, isCloud }) => {
      if (!active) return;
      setCurrentUser(user);
      setSessionKind(user ? (isCloud ? 'supabase' : 'demo') : 'none');
      setAuthReady(true);
    }).catch(error => {
      if (!active) return;
      setCurrentUser(null);
      setAuthError(error.message);
      setAuthReady(true);
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    setAuthError('');
    const user = await signInWithPassword(email, password);
    setCurrentUser(user);
    setSessionKind(user.mode === 'supabase' ? 'supabase' : 'demo');
    setPasswordRecovery(false);
    return user;
  };

  const signUp = async (name, email, password) => {
    setAuthError('');
    const result = await createAccount(name, email, password);
    if (result.user && !result.needsEmailConfirmation) {
      setCurrentUser(result.user);
      setSessionKind('supabase');
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
    await endSession();
    setCurrentUser(null);
    setSessionKind('none');
    setPasswordRecovery(false);
  };

  const value = useMemo(() => ({
    currentUser,
    authReady,
    authError,
    sessionKind,
    passwordRecovery,
    signIn,
    signUp,
    requestPasswordReset: requestReset,
    updatePassword,
    signOut,
    can: permission => can(currentUser, permission)
  }), [currentUser, authReady, authError, sessionKind, passwordRecovery]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
