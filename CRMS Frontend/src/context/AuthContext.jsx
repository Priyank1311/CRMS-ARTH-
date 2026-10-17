import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [demoUsers, setDemoUsers] = useState([]);

  const fetchDemoUsers = async () => {
    try {
      const res = await api.get('/auth/quick/');
      if (res.data?.users) {
        setDemoUsers(res.data.users);
      }
    } catch (err) {
      console.warn('Could not fetch demo users list:', err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me/');
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.warn('Failed to fetch user profile, purging stale tokens:', err);
      localStorage.removeItem('cmrs_access_token');
      localStorage.removeItem('cmrs_refresh_token');
      setUser(null);
      // Auto-fallback to default active role on fresh database reset
      await switchRole('COLLECTION_AGENT');
      return null;
    }
  };

  const switchRole = async (target) => {
    setLoading(true);
    try {
      localStorage.removeItem('cmrs_access_token');
      localStorage.removeItem('cmrs_refresh_token');
      const KNOWN_ROLES = ['COLLECTION_AGENT', 'BRANCH_MANAGER', 'FINANCE_ADMIN'];
      const payload = typeof target === 'string'
        ? (KNOWN_ROLES.includes(target) ? { role: target } : { username: target })
        : typeof target === 'object'
        ? target
        : { role: target };

      const res = await api.post('/auth/quick/', payload);
      localStorage.setItem('cmrs_access_token', res.data.access);
      localStorage.setItem('cmrs_refresh_token', res.data.refresh);
      setUser(res.data.user);
      // Fetch full profile with balances
      const profileRes = await api.get('/auth/me/');
      setUser(profileRes.data);
    } catch (err) {
      console.error('Role/User switch failed:', err);
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
    fetchDemoUsers();
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
        demoUsers,
        fetchDemoUsers,
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
