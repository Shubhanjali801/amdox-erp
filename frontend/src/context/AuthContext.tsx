import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType { isAuthenticated: boolean; user: any | null; login: (user: any) => void; logout: () => void; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const login  = (u: any) => setUser(u);
  const logout = () => { setUser(null); localStorage.removeItem('accessToken'); };
  return <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuthContext outside AuthProvider'); return ctx; };
