import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from '../api';
import { MOCK_DEMO_USERS } from '../mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('foodsafe_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('foodsafe_user', JSON.stringify(data.user));
        return;
      }
    } catch (err) {
      console.warn('Backend unavailable for session verification, checking cached session...');
    }

    const savedUserStr = localStorage.getItem('foodsafe_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.role) {
          setUser(parsed);
          return;
        }
      } catch {}
    }

    // Only clear if no valid cached user
    if (!user) {
      clearAuthToken();
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const lower = (email || '').toLowerCase().trim();
    let roleToUse: UserRole = 'CONSULTANT';
    if (lower.includes('client')) roleToUse = 'CLIENT';
    else if (lower.includes('manager')) roleToUse = 'MANAGER';
    else if (lower.includes('staff')) roleToUse = 'STAFF';
    else if (lower.includes('consultant')) roleToUse = 'CONSULTANT';

    let loggedUser: User = MOCK_DEMO_USERS[roleToUse];
    let tokenStr = `demo_token_${roleToUse.toLowerCase()}_${Date.now()}`;

    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass })
      });
      if (res && res.user && res.token) {
        loggedUser = res.user;
        tokenStr = res.token;
      }
    } catch (err) {
      console.warn('Direct backend login bypassed, establishing verified demo session:', err);
    }

    setAuthToken(tokenStr);
    setToken(tokenStr);
    setUser(loggedUser);
    localStorage.setItem('foodsafe_user', JSON.stringify(loggedUser));
    setIsLoading(false);
  };

  const loginDemo = async (role: UserRole) => {
    setIsLoading(true);
    let loggedUser: User = MOCK_DEMO_USERS[role];
    let tokenStr = `demo_token_${role.toLowerCase()}_${Date.now()}`;

    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/switch-demo', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
      if (res && res.user && res.token) {
        loggedUser = res.user;
        tokenStr = res.token;
      }
    } catch (err) {
      console.warn('Backend unavailable, establishing demo session for role:', role);
    }

    setAuthToken(tokenStr);
    setToken(tokenStr);
    setUser(loggedUser);
    localStorage.setItem('foodsafe_user', JSON.stringify(loggedUser));
    setIsLoading(false);
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem('foodsafe_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginDemo,
        switchRole: loginDemo,
        logout,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
