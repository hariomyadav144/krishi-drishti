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

  // Safe watchdog: Never let isLoading remain true for more than 2.5 seconds
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Revalidate or restore user session
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const savedToken = localStorage.getItem('krishi_token');
      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      // If we don't have a cached user, only activate fallback if explicitly a demo session
      const cachedUser = safeParse('krishi_user');
      const isDemoSession = savedToken && (savedToken.startsWith('krishi_demo_jwt_token_') || !!localStorage.getItem('krishi_demo_role'));

      if (!cachedUser && isDemoSession) {
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
          setProfile(res.data.profile || null);
          setFarm(res.data.farm || null);
          setCurrentCrop(res.data.currentCrop || null);
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

  const clearSessionStorage = () => {
    localStorage.removeItem('krishi_demo_role');
    localStorage.removeItem('krishi_user');
    localStorage.removeItem('krishi_profile');
    localStorage.removeItem('krishi_farm');
    localStorage.removeItem('krishi_current_crop');
    localStorage.removeItem('krishi_dash_cache');
    localStorage.removeItem('krishi_active_field');
    localStorage.removeItem('farm_data');
    localStorage.removeItem('krishi_saved_fields');
    localStorage.removeItem('krishi_crop_health_cache');
    localStorage.removeItem('krishi_farm_coords');
    localStorage.removeItem('krishi_outbreak_cache');

    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('krishi_dash_cache_') || key.startsWith('farmer_profile_') || key.startsWith('farm_data_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
  };

  const login = async (phone, password) => {
    console.log('[AUTH:LOGIN] 1. Login attempt started for phone:', phone);
    try {
      console.log('[AUTH:LOGIN] 2. Sending authentication request to:', api.defaults.baseURL);
      const res = await api.post('/auth/login', { phone, password });
      console.log('[AUTH:LOGIN] 3. Authentication response received:', res.data?.success);

      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        console.log('[AUTH:LOGIN] 4. Authentication successful. UID:', newUser?.id || newUser?._id);
        
        // Purge previous user/demo cache before storing new identity
        clearSessionStorage();
        localStorage.setItem('krishi_token', newToken);
        setToken(newToken);
        setUser(newUser);
        
        console.log('[AUTH:LOGIN] 5. Loading user profile, farm, and crops for UID:', newUser?.id || newUser?._id);
        await refreshUser();
        console.log('[AUTH:LOGIN] 6. Dashboard initialized for UID:', newUser?.id || newUser?._id);
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
      console.error('[AUTH:LOGIN] ERROR during authentication:', error);
      let errMsg = '';
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
        if (errMsg.includes('bufferCommands') || errMsg.includes('findOne') || errMsg.includes('initial connection')) {
          errMsg = 'Unable to log in right now. Please try again in a few moments.';
        }
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errMsg = 'Server response timed out. The server may be waking up, please try again.';
      } else if (error.message?.includes('Network Error') || !error.response) {
        errMsg = 'Network error. Please check your internet connection.';
      } else {
        errMsg = error.message || 'Invalid mobile number or password.';
      }
      return {
        success: false,
        code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
        message: errMsg,
      };
    }
  };

  const register = async (formData) => {
    console.log('[AUTH:REGISTER] 1. Registration started for:', formData?.name, formData?.phone);
    try {
      console.log('[AUTH:REGISTER] 2. Sending registration request to backend...');
      const res = await api.post('/auth/register', formData);
      console.log('[AUTH:REGISTER] 3. Registration response received:', res.data?.success);

      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        console.log('[AUTH:REGISTER] 4. Account created successfully. UID:', newUser?.id || newUser?._id);
        
        // Purge previous user/demo cache before storing new identity
        clearSessionStorage();
        localStorage.setItem('krishi_token', newToken);
        setToken(newToken);
        setUser(newUser);
        
        console.log('[AUTH:REGISTER] 5. Initializing profile and farm for UID:', newUser?.id || newUser?._id);
        await refreshUser();
        console.log('[AUTH:REGISTER] 6. Registration completed successfully.');
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      console.error('[AUTH:REGISTER] ERROR during registration:', error);
      let errMsg = '';
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
        if (errMsg.includes('bufferCommands') || errMsg.includes('findOne') || errMsg.includes('initial connection')) {
          errMsg = 'Unable to create your account right now. Please try again.';
        }
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errMsg = 'Server response timed out. The server may be waking up, please try again.';
      } else if (error.message?.includes('Network Error') || !error.response) {
        errMsg = 'Network error. Please check your internet connection.';
      } else {
        errMsg = error.message || 'Registration failed. Please try again.';
      }
      return {
        success: false,
        code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
        message: errMsg,
      };
    }
  };

  const demoLogin = async (role = 'farmer') => {
    clearSessionStorage();

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
    clearSessionStorage();
    localStorage.removeItem('krishi_token');

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
        setUser,
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
