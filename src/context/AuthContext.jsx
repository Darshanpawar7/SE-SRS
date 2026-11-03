import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { activateSessionCache } from '../services/sessionCache';
import { getSupabase } from '../services/supabaseClient';
import { TEAM_MEMBERS } from '../utils/constants';
import { can, restoreSession, verifyCloudSession, signIn as signInWithPassword, signOut as endSession } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // The session survives reloads; without one the app shows the sign-in view.
  const [currentUser, setCurrentUser] = useState(() => restoreSession());

  const [cloudVerified, setCloudVerified] = useState(false);
  const [authError, setAuthError] = useState('');
  const generation = useRef(0);
  useEffect(() => {
    let stopped = false;
    let subscription;
    let timer;
    const verify = async () => {
      const version = ++generation.current;
      try {
        const member = await verifyCloudSession();
        if (!stopped && version === generation.current) {
          if (member) activateSessionCache(member.cloudCacheScope);
          setCurrentUser(member); setCloudVerified(Boolean(member)); setAuthError('');
        }
      } catch {
        if (!stopped && version === generation.current) {
          setCurrentUser(null); setCloudVerified(false);
          setAuthError('Cloud session could not be verified. Check your connection and sign in again. Saved data is retained.');
        }
      }
    };
    const connect = () => {
      subscription?.unsubscribe();
      const client = getSupabase();
      if (!client) { activateSessionCache('demo'); generation.current++; setCloudVerified(false); setCurrentUser(restoreSession()); return; }
      generation.current++; setCurrentUser(null); setCloudVerified(false);
      verify();
      subscription = client.auth.onAuthStateChange?.((event) => {
        // Never await an Auth call inside Supabase's synchronous auth callback.
        clearTimeout(timer);
        if (event === 'SIGNED_OUT') {
          generation.current++; setCurrentUser(null); setCloudVerified(false);
        } else { timer = setTimeout(verify, 0); }
      })?.data?.subscription;
    };
    // Async callbacks update state; initial render remains side-effect free.
    timer = setTimeout(connect, 0);
    window.addEventListener('sprintflow:connection-change', connect);
    return () => { stopped = true; clearTimeout(timer); subscription?.unsubscribe(); window.removeEventListener('sprintflow:connection-change', connect); };
  }, []);

  const signIn = async (email, password) => {
    const member = await signInWithPassword(email, password);
    generation.current++;
    setCloudVerified(Boolean(getSupabase())); setAuthError('');
    setCurrentUser(member);
    return member;
  };

  // Switching profile means signing out and signing in as another team member.
  const signOut = async () => {
    generation.current++;
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
