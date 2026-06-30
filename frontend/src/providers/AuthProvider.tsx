import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { AuthContext, User, AuthContextType } from '../hooks/useAuth';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user';

const normalizeUser = (userData: any): User => ({
  id: String(userData.id),
  email: userData.email,
  roles: Array.isArray(userData.roles) ? userData.roles : [],
  permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
  name: `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim(),
  first_name: userData.firstName || userData.first_name,
  last_name: userData.lastName || userData.last_name,
  is_active: userData.isActive ?? userData.is_active,
  is_email_verified: userData.isEmailVerified ?? userData.is_email_verified
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? normalizeUser(JSON.parse(savedUser)) : null;
  });
  
  const [loading, setLoading] = useState(false);

  const clearLocalSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Keep Authorization header in sync with local token.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (user && !token) {
      logout();
    }

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !user?.id) {
      return;
    }

    const syncPermissions = async () => {
      try {
        const response = await api.get('/auth/permissions');
        const nextPermissions = Array.isArray(response.data?.permissions) ? response.data.permissions : [];

        setUser((prevUser) => {
          if (!prevUser) {
            return prevUser;
          }

          const sameLength = prevUser.permissions.length === nextPermissions.length;
          const sameValues = sameLength && prevUser.permissions.every((p, idx) => p === nextPermissions[idx]);
          if (sameValues) {
            return prevUser;
          }

          const nextUser: User = {
            ...prevUser,
            permissions: nextPermissions
          };
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
          return nextUser;
        });
      } catch (error) {
        console.error('❌ Error syncing permissions:', error);
      }
    };

    syncPermissions();
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', 
        { email, password },
        { withCredentials: true }
      );
      
      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        console.error('❌ Invalid response data:', { token: !!token, userData: !!userData });
        throw new Error('Date invalide primite de la server');
      }

      localStorage.setItem(TOKEN_KEY, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const userFormatted: User = normalizeUser(userData);
      setUser(userFormatted);
      localStorage.setItem(USER_KEY, JSON.stringify(userFormatted));
      return userFormatted;
    } catch (error) {
      console.error('❌ AuthProvider login error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ Axios error response:', error.response);
        throw new Error(error.response.data.message || 'Eroare la autentificare');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      clearLocalSession();
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 