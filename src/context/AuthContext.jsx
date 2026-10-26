import React, { createContext, useContext, useState } from 'react';
import { TEAM_MEMBERS } from '../utils/constants';
import { can, restoreSession, signIn as signInWithPassword, signOut as endSession } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // The session survives reloads; without one the app shows the sign-in view.
  const [currentUser, setCurrentUser] = useState(() => restoreSession());

  const signIn = async (email, password) => {
    const member = await signInWithPassword(email, password);
    setCurrentUser(member);
    return member;
  };

  // Switching profile means signing out and signing in as another team member.
  const signOut = async () => {
    await endSession();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
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
