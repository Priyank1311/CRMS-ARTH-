import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me/');
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
      setUser(null);
      return null;
    }
  };

  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/quick/', { role: targetRole });
      localStorage.setItem('cmrs_access_token', res.data.access);
      localStorage.setItem('cmrs_refresh_token', res.data.refresh);
      setUser(res.data.user);
      // Fetch full profile with balances
      await fetchCurrentUser();
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/token/', { username, password });
      localStorage.setItem('cmrs_access_token', res.data.access);
      localStorage.setItem('cmrs_refresh_token', res.data.refresh);
      const profile = await fetchCurrentUser();
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cmrs_access_token');
    localStorage.removeItem('cmrs_refresh_token');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('cmrs_access_token');
    if (token) {
      fetchCurrentUser().finally(() => setLoading(false));
    } else {
      // Default to Agent for immediate demo readiness
      switchRole('COLLECTION_AGENT');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        loading,
        switchRole,
        login,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
