import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RoleCode } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoSwitch: (roleCode: RoleCode, email?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Failed to restore session:', err);
          clearAuthToken();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.tokens.access);
      setToken(res.tokens.access);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const demoSwitch = async (roleCode: RoleCode, email?: string) => {
    setIsLoading(true);
    try {
      const res = await api.demoSwitch(roleCode, email);
      setAuthToken(res.tokens.access);
      setToken(res.tokens.access);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permCode: string): boolean => {
    if (!user) return false;
    if (user.role_code === 'super_admin' || user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permCode) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoSwitch,
        logout,
        hasPermission,
      }}
    >
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
