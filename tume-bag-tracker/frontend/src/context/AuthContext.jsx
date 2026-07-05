import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { setAccessToken, getAccessToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent session restore on app mount
  const checkAuth = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/refresh');
      const { accessToken, user: userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
    } catch (err) {
      console.log('No active session / expired refresh token');
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      const response = await axiosInstance.put('/api/users/change-password', { oldPassword, newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Error updating password';
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePassword, isAuthenticated: !!user }}>
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
