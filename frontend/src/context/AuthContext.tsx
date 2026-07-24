import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const login = (user: User) => {
    setUser(user);
    setIsAnonymous(false);
  };

  const loginAsAnonymous = () => {
    setUser({
      id: `anon-${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Anonymous User',
      isAnonymous: true,
    });
    setIsAnonymous(true);
  };

  const logout = () => {
    setUser(null);
    setIsAnonymous(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAnonymous, login, loginAsAnonymous, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
