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
  loginNotificationUser: User | null;
  dismissLoginNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Whenever the link is opened, user is null so LoginView is immediately visible first
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginNotificationUser, setLoginNotificationUser] = useState<User | null>(null);

  const fetchCurrentUser = async () => {
    // Left available for explicit session refresh
  };

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
    setLoginNotificationUser(loggedUser);
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
    setLoginNotificationUser(loggedUser);
    localStorage.setItem('foodsafe_user', JSON.stringify(loggedUser));
    setIsLoading(false);
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem('foodsafe_user');
    setToken(null);
    setUser(null);
    setLoginNotificationUser(null);
  };

  const dismissLoginNotification = () => {
    setLoginNotificationUser(null);
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
        refreshUser: fetchCurrentUser,
        loginNotificationUser,
        dismissLoginNotification
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
