import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('krishi_token') || null);
  const [profile, setProfile] = useState(null);
  const [farm, setFarm] = useState(null);
  const [currentCrop, setCurrentCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('krishi_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);
            setFarm(res.data.farm);
            setCurrentCrop(res.data.currentCrop);
          }
        } catch (error) {
          console.error('Failed to load user session:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (phone, password) => {
    try {
      const res = await api.post('/auth/login', { phone, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('krishi_token', token);
        setToken(token);
        setUser(user);
        await refreshUser();
        return { success: true, user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('krishi_token', token);
        setToken(token);
        setUser(user);
        await refreshUser();
        return { success: true, user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  const demoLogin = async (role = 'farmer') => {
    try {
      const res = await api.post('/auth/demo-login', { role });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('krishi_token', token);
        setToken(token);
        setUser(user);
        await refreshUser();
        return { success: true, user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Demo login failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('krishi_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setFarm(null);
    setCurrentCrop(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setFarm(res.data.farm);
        setCurrentCrop(res.data.currentCrop);
      }
    } catch (e) {
      console.warn('Error refreshing user details:', e.message);
    }
  };

  const updateCurrentCrop = (crop) => {
    setCurrentCrop(crop);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        farm,
        currentCrop,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        updateCurrentCrop,
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
