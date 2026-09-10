import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  MOCK_FARMER_USER,
  MOCK_EXPERT_USER,
  MOCK_ADMIN_USER,
  MOCK_PROFILE,
  MOCK_FARM,
  MOCK_CURRENT_CROP,
} from '../services/mockFallback';

const AuthContext = createContext();

const safeParse = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const safeSet = (key, val) => {
  if (typeof window === 'undefined') return;
  try {
    if (val === null || val === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (_) {}
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('krishi_token') || null;
  });
  const [user, setUserState] = useState(() => safeParse('krishi_user'));
  const [profile, setProfileState] = useState(() => safeParse('krishi_profile'));
  const [farm, setFarmState] = useState(() => safeParse('krishi_farm'));
  const [currentCrop, setCurrentCropState] = useState(() => safeParse('krishi_current_crop'));

  // If token and user are already cached, or if there is no token, NO blocking loading screen!
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedToken = localStorage.getItem('krishi_token');
    const cachedUser = safeParse('krishi_user');
    return Boolean(savedToken && !cachedUser);
  });

  const setUser = (u) => {
    setUserState(u);
    safeSet('krishi_user', u);
  };

  const setProfile = (p) => {
    setProfileState(p);
    safeSet('krishi_profile', p);
  };

  const setFarm = (f) => {
    setFarmState(f);
    safeSet('krishi_farm', f);
  };

  const setCurrentCrop = (c) => {
    setCurrentCropState(c);
    safeSet('krishi_current_crop', c);
  };

  // Revalidate or restore user session
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const savedToken = localStorage.getItem('krishi_token');
      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      // If we don't have a cached user, activate safe fallback while backend checks
      const cachedUser = safeParse('krishi_user');
      if (!cachedUser) {
        const role = localStorage.getItem('krishi_demo_role') || 'farmer';
        const fallbackUser = role === 'admin' ? MOCK_ADMIN_USER : (role === 'expert' ? MOCK_EXPERT_USER : MOCK_FARMER_USER);
        if (isMounted) {
          setUser(fallbackUser);
          setProfile(MOCK_PROFILE);
          setFarm(MOCK_FARM);
          setCurrentCrop(MOCK_CURRENT_CROP);
          setIsLoading(false);
        }
      }

      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.success) {
          if (res.data.user) setUser(res.data.user);
          if (res.data.profile) setProfile(res.data.profile);
          if (res.data.farm) setFarm(res.data.farm);
          if (res.data.currentCrop) setCurrentCrop(res.data.currentCrop);
        }
      } catch (error) {
        console.warn('Silent user session refresh:', error.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (phone, password) => {
    try {
      const res = await api.post('/auth/login', { phone, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('krishi_token', newToken);
        setToken(newToken);
        setUser(newUser);
        await refreshUser();
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Login failed' };
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
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('krishi_token', newToken);
        setToken(newToken);
        setUser(newUser);
        await refreshUser();
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  const demoLogin = async (role = 'farmer') => {
    // 1. Instant local session hydration for 0ms lag
    let demoUser = MOCK_FARMER_USER;
    if (role === 'expert') demoUser = MOCK_EXPERT_USER;
    if (role === 'admin') demoUser = MOCK_ADMIN_USER;

    const demoToken = `krishi_demo_jwt_token_${role}_2026`;
    localStorage.setItem('krishi_token', demoToken);
    localStorage.setItem('krishi_demo_role', role);

    setToken(demoToken);
    setUser(demoUser);
    setProfile(MOCK_PROFILE);
    setFarm(MOCK_FARM);
    setCurrentCrop(MOCK_CURRENT_CROP);
    setIsLoading(false);

    // 2. Asynchronously notify backend without blocking UI navigation
    try {
      api.post('/auth/demo-login', { role }).then((res) => {
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
        }
      }).catch(() => {});
    } catch (_) {}

    return { success: true, user: demoUser };
  };

  const logout = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_demo_role');
    safeSet('krishi_user', null);
    safeSet('krishi_profile', null);
    safeSet('krishi_farm', null);
    safeSet('krishi_current_crop', null);

    setToken(null);
    setUserState(null);
    setProfileState(null);
    setFarmState(null);
    setCurrentCropState(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        if (res.data.user) setUser(res.data.user);
        if (res.data.profile) setProfile(res.data.profile);
        if (res.data.farm) setFarm(res.data.farm);
        if (res.data.currentCrop) setCurrentCrop(res.data.currentCrop);
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
