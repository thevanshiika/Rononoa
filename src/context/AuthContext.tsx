import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { User, Project } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  isAdmin: boolean;
  isProjectManager: boolean;
  isTeamMember: boolean;
  isViewer: boolean;
  canManageProject: (project?: Project | null) => boolean;
  canModifyTask: (taskProject?: Project | { _id: string; manager?: any } | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('pm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pm_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('pm_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          localStorage.setItem('pm_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed, clearing auth cache.');
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('pm_token', receivedToken);
      localStorage.setItem('pm_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('pm_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';
  const isProjectManager = user?.role === 'project_manager';
  const isTeamMember = user?.role === 'team_member';
  const isViewer = user?.role === 'viewer';

  const canManageProject = (project?: Project | null): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!project) return false;
    const managerId =
      typeof project.manager === 'object' && project.manager
        ? project.manager.id || (project.manager as any)._id
        : project.manager;
    return user.id === managerId || (user as any)._id === managerId;
  };

  const canModifyTask = (_taskProject?: any): boolean => {
    if (!user) return false;
    if (isViewer) return false;
    return true; // Team member, PM, Admin can update permitted fields
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        isAdmin,
        isProjectManager,
        isTeamMember,
        isViewer,
        canManageProject,
        canModifyTask,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
