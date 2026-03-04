import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { authStore } from '@store/auth.store';
import { authService } from '@services/auth.service';
import { User, UserRole } from '@types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; redirectPath: string }>;
  register: (username: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, setLoading, login: storeLogin, logout: storeLogout } = authStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authStore.getState().accessToken;
      if (token && !user) {
        try {
          setLoading(true);
          const userData = await authService.getCurrentUser();
          storeLogin(userData, authStore.getState().accessToken!, authStore.getState().refreshToken!);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          storeLogout();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  const getRedirectPath = (role: UserRole) => {
    switch (role) {
      case UserRole.WORKER:
        return '/worker/dashboard';
      case UserRole.EMPLOYER:
        return '/employer/dashboard';
      case UserRole.ADMIN:
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      storeLogin(response.user, response.access_token, response.refresh_token);
      return { user: response.user, redirectPath: getRedirectPath(response.user.role) };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      await authService.register({ username, email, password, role });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      storeLogout();
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};