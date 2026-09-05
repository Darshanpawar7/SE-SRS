import React, { createContext, useContext, useState, useEffect } from 'react';
import { TEAM_MEMBERS } from '../utils/constants';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Default to Darshan (Team Lead) for instant demo
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sprintflow_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return TEAM_MEMBERS[0];
  });

  const switchUser = (memberId) => {
    const member = TEAM_MEMBERS.find(m => m.id === memberId) || TEAM_MEMBERS[0];
    setCurrentUser(member);
    localStorage.setItem('sprintflow_user', JSON.stringify(member));
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, teamMembers: TEAM_MEMBERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
