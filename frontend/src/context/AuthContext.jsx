import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api, { normalizeToE164, to10DigitPhone, DEFAULT_PRODUCTION_API_URL } from '../services/api';
import { fetchSavedFields } from '../services/fieldService';
import {
  MOCK_FARMER_USER,
  MOCK_EXPERT_USER,
  MOCK_ADMIN_USER,
  MOCK_PROFILE,
  MOCK_FARM,
  MOCK_CURRENT_CROP,
} from '../services/mockFallback';
import { FeatureRecoveryStrategy, RecoveryManager, LogLevel } from '../selfHealing/index.js';

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

/**
 * Normalizes any Indian mobile number into strict 10 digits
 */
const sanitize10DigitPhone = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
};

/**
 * 1. Checks and restores permanent session from localStorage ('fasal_user_session' or legacy 'krishi_*')
 * Auto-login on app launch with NO auto-expiration TTL.
 */
const loadInitialSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Primary permanent session
    const rawFasal = localStorage.getItem('fasal_user_session');
    if (rawFasal) {
      const parsed = JSON.parse(rawFasal);
      if (parsed && (parsed.token || parsed.user || parsed.refreshToken)) {
        const uid = parsed.user?.id || parsed.user?._id;
        const isDemo = parsed.user?.phone === '9876543210' || parsed.user?.id === 'usr_farmer_demo_01';
        let userFarm = parsed.farm;
        if (!userFarm && uid) {
          const userFarms = safeParse(`farms_data_usr_${uid}`) || [];
          if (userFarms.length > 0) userFarm = userFarms[0];
          else if (isDemo) userFarm = safeParse('krishi_farm');
        }
        return {
          ...parsed,
          farm: userFarm || null,
          profile: parsed.profile || (uid ? safeParse(`krishi_profile_${uid}`) : null) || (isDemo ? safeParse('krishi_profile') : null),
          currentCrop: parsed.currentCrop || (userFarm?.crop ? { name: userFarm.crop, cropName: userFarm.crop } : null),
        };
      }
    }
  } catch (e) {
    console.warn('[AuthContext] Error reading fasal_user_session:', e);
  }

  // 2. Legacy fallback
  try {
    const legacyToken = localStorage.getItem('krishi_token');
    const legacyRefresh = localStorage.getItem('fasal_refresh_token');
    const legacyUser = safeParse('krishi_user');
    if (legacyToken || legacyUser || legacyRefresh) {
      const uid = legacyUser?.id || legacyUser?._id;
      const isDemo = legacyUser?.phone === '9876543210' || legacyUser?.id === 'usr_farmer_demo_01';
      let userFarm = null;
      if (uid) {
        const userFarms = safeParse(`farms_data_usr_${uid}`) || [];
        if (userFarms.length > 0) userFarm = userFarms[0];
        else if (isDemo) userFarm = safeParse('krishi_farm');
      }
      return {
        token: legacyToken || null,
        refreshToken: legacyRefresh || null,
        user: legacyUser || null,
        profile: uid ? safeParse(`krishi_profile_${uid}`) : (isDemo ? safeParse('krishi_profile') : null),
        farm: userFarm || null,
        currentCrop: userFarm?.crop ? { name: userFarm.crop, cropName: userFarm.crop } : null,
      };
    }
  } catch (_) {}

  return null;
};

/**
 * 2. Save session permanently with strict user isolation
 * Clearing authentication credentials removes shared cache keys while preserving all user-scoped farms
 */
const persistSession = (token, user, profile, farm, currentCrop, refreshToken = null) => {
  if (typeof window === 'undefined') return;
  try {
    if (!token && !user) {
      // Clear ONLY authentication credentials and temporary active keys
      localStorage.removeItem('fasal_user_session');
      localStorage.removeItem('krishi_token');
      localStorage.removeItem('fasal_refresh_token');
      localStorage.removeItem('krishi_user');
      localStorage.removeItem('krishi_demo_role');
      localStorage.removeItem('krishi_active_field');
      localStorage.removeItem('active_farm_id');
      localStorage.removeItem('farm_data');
      localStorage.removeItem('krishi_farm');
      localStorage.removeItem('krishi_current_crop');
      localStorage.removeItem('krishi_crop_health_cache');
      localStorage.removeItem('krishi_dash_cache');
      localStorage.removeItem('krishi_farm_coords');
      return;
    }

    const uid = user?.id || user?._id;
    const isDemo = user?.phone === '9876543210' || user?.id === 'usr_farmer_demo_01';
    if (!isDemo) {
      localStorage.removeItem('krishi_demo_role');
      localStorage.removeItem('krishi_farm');
      localStorage.removeItem('krishi_current_crop');
      localStorage.removeItem('krishi_active_field');
      localStorage.removeItem('farm_data');
    }

    const existingSession = safeParse('fasal_user_session') || {};
    const effectiveRefreshToken = refreshToken !== null ? refreshToken : (localStorage.getItem('fasal_refresh_token') || existingSession.refreshToken || null);

    const payload = {
      token: token || null,
      refreshToken: effectiveRefreshToken,
      user: user || null,
      profile: profile || null,
      farm: farm || null,
      currentCrop: currentCrop || null,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem('fasal_user_session', JSON.stringify(payload));
    if (token) localStorage.setItem('krishi_token', token);
    if (effectiveRefreshToken) localStorage.setItem('fasal_refresh_token', effectiveRefreshToken);
    if (user) safeSet('krishi_user', user);
    if (profile && uid) safeSet(`krishi_profile_${uid}`, profile);
    if (farm && uid) safeSet(`krishi_farm_${uid}`, farm);
    if (currentCrop && uid) safeSet(`krishi_current_crop_${uid}`, currentCrop);
    if (isDemo) {
      if (profile) safeSet('krishi_profile', profile);
      if (farm) safeSet('krishi_farm', farm);
      if (currentCrop) safeSet('krishi_current_crop', currentCrop);
    }
  } catch (err) {
    console.warn('[AuthContext] Error persisting session:', err);
  }
};

/**
 * 3. Permanent Client-Side Registered Users Registry
 * Ensures registered users are NEVER lost even across server restarts or reloads.
 */
const saveRegisteredUserLocally = (userData, token = '') => {
  if (typeof window === 'undefined' || !userData) return;
  try {
    const cleanPhone = sanitize10DigitPhone(userData.phone);
    if (!cleanPhone || cleanPhone.length !== 10) return;
    const raw = localStorage.getItem('fasal_registered_users');
    let users = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(users)) users = [];
    const idx = users.findIndex(u => sanitize10DigitPhone(u.phone) === cleanPhone);
    const entry = {
      ...userData,
      phone: cleanPhone,
      token: token || userData.token || '',
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...entry };
    } else {
      users.push(entry);
    }
    localStorage.setItem('fasal_registered_users', JSON.stringify(users));
  } catch (e) {
    console.warn('[AuthContext] Failed to save registered user locally:', e);
  }
};

const findRegisteredUserLocally = (phone) => {
  if (typeof window === 'undefined' || !phone) return null;
  try {
    const cleanPhone = sanitize10DigitPhone(phone);
    const raw = localStorage.getItem('fasal_registered_users');
    if (!raw) return null;
    const users = JSON.parse(raw);
    if (!Array.isArray(users)) return null;
    return users.find(u => sanitize10DigitPhone(u.phone) === cleanPhone) || null;
  } catch (_) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const initialSession = loadInitialSession();

  const [token, setToken] = useState(() => initialSession?.token || null);
  const [user, setUserState] = useState(() => initialSession?.user || null);
  const [profile, setProfileState] = useState(() => initialSession?.profile || null);
  const [farm, setFarmState] = useState(() => initialSession?.farm || null);
  const [currentCrop, setCurrentCropState] = useState(() => initialSession?.currentCrop || null);

  // If initial session exists, immediately boot to dashboard without blocking loading screen!
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (initialSession && initialSession.user) return false;
    const savedToken = localStorage.getItem('krishi_token') || safeParse('fasal_user_session')?.token;
    const savedRefresh = localStorage.getItem('fasal_refresh_token') || safeParse('fasal_user_session')?.refreshToken;
    const cachedUser = safeParse('krishi_user');
    return Boolean((savedToken || savedRefresh) && !cachedUser);
  });

  const setUser = (u) => {
    setUserState(u);
    persistSession(token, u, profile, farm, currentCrop);
  };

  const setProfile = (p) => {
    setProfileState(p);
    persistSession(token, user, p, farm, currentCrop);
  };

  const setFarm = (f) => {
    setFarmState(f);
    persistSession(token, user, profile, f, currentCrop);
  };

  const setCurrentCrop = (c) => {
    setCurrentCropState(c);
    persistSession(token, user, profile, farm, c);
  };

  // Safe watchdog: Never let isLoading remain true for more than 2 seconds
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Revalidate or restore user session in background
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const activeToken = token || localStorage.getItem('krishi_token');
      const activeRefresh = localStorage.getItem('fasal_refresh_token') || safeParse('fasal_user_session')?.refreshToken;
      if (!activeToken && !activeRefresh) {
        if (isMounted) setIsLoading(false);
        return;
      }

      const cachedUser = user || safeParse('krishi_user');
      const isDemoSession = activeToken && (activeToken.startsWith('krishi_demo_jwt_token_') || !!localStorage.getItem('krishi_demo_role'));

      if (!cachedUser && isDemoSession) {
        const role = localStorage.getItem('krishi_demo_role') || 'farmer';
        const fallbackUser = role === 'admin' ? MOCK_ADMIN_USER : (role === 'expert' ? MOCK_EXPERT_USER : MOCK_FARMER_USER);
        if (isMounted) {
          setUserState(fallbackUser);
          setProfileState(MOCK_PROFILE);
          setFarmState(MOCK_FARM);
          setCurrentCropState(MOCK_CURRENT_CROP);
          persistSession(activeToken, fallbackUser, MOCK_PROFILE, MOCK_FARM, MOCK_CURRENT_CROP);
          setIsLoading(false);
        }
      }

      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.success) {
          const freshToken = localStorage.getItem('krishi_token') || activeToken;
          if (res.data.user) {
            setUserState(res.data.user);
            const uid = res.data.user.id || res.data.user._id;
            fetchSavedFields(uid).catch(() => {});
          }
          if (res.data.profile) setProfileState(res.data.profile);
          if (res.data.farm) setFarmState(res.data.farm);
          if (res.data.currentCrop) setCurrentCropState(res.data.currentCrop);

          persistSession(
            freshToken,
            res.data.user || user,
            res.data.profile || profile,
            res.data.farm || farm,
            res.data.currentCrop || currentCrop
          );
        }
      } catch (error) {
        // PERMANENT LOGIN RULE:
        // Do NOT automatically log out the farmer on network error or background 401.
        // The farmer session stays active indefinitely until explicit logout.
        console.warn('[AuthContext] Background session check note:', error.message);
        RecoveryManager.logDiagnostic({
          level: LogLevel.WARNING,
          module: 'Authentication',
          errorType: 'SESSION_BACKGROUND_CHECK',
          message: error.message || 'Background session note',
          status: 'PRESERVED_OFFLINE',
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (phone, password, rememberMe = true) => {
    const cleanPhone = sanitize10DigitPhone(phone);
    console.log('[AUTH:LOGIN] 1. Login attempt started for phone:', cleanPhone);
    try {
      console.log('[AUTH:LOGIN] 2. Sending authentication request to:', api.defaults.baseURL);
      let res;
      try {
        res = await api.post('/auth/login', { phone: cleanPhone, password, rememberMe });
      } catch (primaryErr) {
        // If primary backend fails, try candidate backend
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isPrimaryLocal = (api.defaults.baseURL || '').includes('localhost');
        const candidateUrl = isPrimaryLocal ? DEFAULT_PRODUCTION_API_URL : (isHttps ? DEFAULT_PRODUCTION_API_URL : 'http://localhost:5000/api');
        
        console.warn(`[AUTH:LOGIN] Primary attempt to ${api.defaults.baseURL} failed (${primaryErr.response?.status || primaryErr.code}). Trying candidate: ${candidateUrl}`);
        try {
          const candidateAxios = axios.create({ timeout: 12000, headers: { 'Content-Type': 'application/json' } });
          const altRes = await candidateAxios.post(`${candidateUrl}/auth/login`, { phone: cleanPhone, password, rememberMe });
          if (altRes.data?.success) {
            console.log('[AUTH:LOGIN] Candidate backend succeeded! Updating active baseURL to:', candidateUrl);
            api.defaults.baseURL = candidateUrl;
            if (typeof window !== 'undefined') {
              localStorage.setItem('krishi_backend_url', candidateUrl);
            }
            res = altRes;
          } else {
            throw primaryErr;
          }
        } catch (_) {
          throw primaryErr;
        }
      }

      console.log('[AUTH:LOGIN] 3. Authentication response received:', res.data?.success);

      if (res.data.success) {
        const newToken = res.data.accessToken || res.data.token;
        const newRefreshToken = res.data.refreshToken || null;
        const newUser = res.data.user;
        const uid = newUser?.id || newUser?._id;
        console.log('[AUTH:LOGIN] 4. Authentication successful. UID:', uid);

        let restoredProfile = res.data.profile || null;
        let restoredFarm = res.data.farm || null;
        let restoredCrop = res.data.currentCrop || null;

        // Clear previous in-memory state and global cached keys first
        setFarmState(null);
        setCurrentCropState(null);
        setProfileState(null);
        localStorage.removeItem('krishi_demo_role');
        localStorage.removeItem('krishi_active_field');
        localStorage.removeItem('active_farm_id');
        localStorage.removeItem('farm_data');
        localStorage.removeItem('krishi_farm');
        localStorage.removeItem('krishi_current_crop');
        localStorage.removeItem('krishi_crop_health_cache');
        localStorage.removeItem('krishi_dash_cache');
        localStorage.removeItem('krishi_farm_coords');

        setToken(newToken);
        setUserState(newUser);
        if (restoredProfile) setProfileState(restoredProfile);
        if (restoredCrop) setCurrentCropState(restoredCrop);
        saveRegisteredUserLocally(newUser, newToken);

        // Restore user's permanent farms and profile from backend
        console.log('[AUTH:LOGIN] 5. Restoring permanent farm mapping and profile for UID:', uid);
        try {
          const userFields = await fetchSavedFields(uid);
          if (Array.isArray(userFields) && userFields.length > 0) {
            const activeId = getActiveFarmId(uid);
            const targetFarm = (activeId && userFields.find(f => f.id === activeId || f._id === activeId)) || userFields[0];
            activateFarm(targetFarm.id, uid);
            restoredFarm = targetFarm;
            if (targetFarm.crop) {
              restoredCrop = { name: targetFarm.crop, cropName: targetFarm.crop };
              setCurrentCropState(restoredCrop);
            }
          } else {
            restoredFarm = null;
            restoredCrop = null;
            setCurrentCropState(null);
          }
        } catch (err) {
          console.warn('[AUTH:LOGIN] Field fetch note:', err.message);
        }

        setFarmState(restoredFarm);

        persistSession(newToken, newUser, restoredProfile, restoredFarm, restoredCrop, newRefreshToken);
        refreshUser().catch(err => console.warn('[AUTH:LOGIN] Background hydration:', err.message));
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
      console.error('[AUTH:LOGIN] ERROR during authentication:', error);

      // Check if user was registered on this device in persistent fallback
      const localUser = findRegisteredUserLocally(cleanPhone);
      if (localUser && (error.code === 'ECONNABORTED' || error.message?.includes('Network Error') || !error.response)) {
        console.log('[AUTH:LOGIN] Offline/Network fallback: Restoring registered local session for:', cleanPhone);
        const fallbackToken = localUser.token || `krishi_persistent_token_${Date.now()}`;
        setToken(fallbackToken);
        setUserState(localUser);
        persistSession(fallbackToken, localUser, profile, farm, currentCrop);
        return { success: true, user: localUser };
      }

      let errMsg = '';
      const respCode = error.response?.data?.code || error.code || 'UNKNOWN_ERROR';
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
        errMsg = 'Phone number or password is incorrect.';
      }
      return {
        success: false,
        code: respCode,
        message: errMsg,
      };
    }
  };

  const register = async (formData) => {
    const cleanPhone = sanitize10DigitPhone(formData?.phone);
    console.log('[AUTH:REGISTER] 1. Registration started for:', formData?.name, cleanPhone);
    const regPayload = { ...formData, phone: cleanPhone };

    try {
      console.log('[AUTH:REGISTER] 2. Sending registration request to backend:', api.defaults.baseURL);
      let res;
      try {
        res = await api.post('/auth/register', regPayload);
      } catch (primaryErr) {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isPrimaryLocal = (api.defaults.baseURL || '').includes('localhost');
        const altUrl = isPrimaryLocal ? DEFAULT_PRODUCTION_API_URL : (isHttps ? DEFAULT_PRODUCTION_API_URL : 'http://localhost:5000/api');
        try {
          const candidateAxios = axios.create({ timeout: 12000, headers: { 'Content-Type': 'application/json' } });
          const altRes = await candidateAxios.post(`${altUrl}/auth/register`, regPayload);
          if (altRes.data?.success) {
            api.defaults.baseURL = altUrl;
            if (typeof window !== 'undefined') {
              localStorage.setItem('krishi_backend_url', altUrl);
            }
            res = altRes;
          } else {
            throw primaryErr;
          }
        } catch (_) {
          throw primaryErr;
        }
      }

      console.log('[AUTH:REGISTER] 3. Registration response received:', res.data?.success);

      if (res.data.success) {
        const newToken = res.data.accessToken || res.data.token;
        const newRefreshToken = res.data.refreshToken || null;
        const newUser = res.data.user;
        const uid = newUser?.id || newUser?._id;
        console.log('[AUTH:REGISTER] 4. Account created successfully. UID:', uid);

        // Fresh clean state for new registrant - explicitly clear any previous caches
        setFarmState(null);
        setCurrentCropState(null);
        setProfileState(null);
        localStorage.removeItem('krishi_demo_role');
        localStorage.removeItem('krishi_active_field');
        localStorage.removeItem('active_farm_id');
        localStorage.removeItem('farm_data');
        localStorage.removeItem('krishi_farm');
        localStorage.removeItem('krishi_current_crop');
        localStorage.removeItem('krishi_crop_health_cache');
        localStorage.removeItem('krishi_dash_cache');
        localStorage.removeItem('krishi_farm_coords');

        setToken(newToken);
        setUserState(newUser);
        let restoredProfile = res.data.profile || null;
        let restoredFarm = null;
        let restoredCrop = null;
        if (restoredProfile) setProfileState(restoredProfile);
        saveRegisteredUserLocally(newUser, newToken);

        // Background mirror to alternate server if reachable so account exists everywhere
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isPrimaryLocal = (api.defaults.baseURL || '').includes('localhost');
        const altUrl = isPrimaryLocal ? DEFAULT_PRODUCTION_API_URL : (isHttps ? DEFAULT_PRODUCTION_API_URL : 'http://localhost:5000/api');
        axios.post(`${altUrl}/auth/register`, regPayload, { timeout: 8000 }).catch(() => {});

        try {
          const userFields = await fetchSavedFields(uid);
          if (Array.isArray(userFields) && userFields.length > 0) {
            const targetFarm = userFields[0];
            activateFarm(targetFarm.id, uid);
            restoredFarm = targetFarm;
            if (targetFarm.crop) {
              restoredCrop = { name: targetFarm.crop, cropName: targetFarm.crop };
              setCurrentCropState(restoredCrop);
            }
          } else {
            restoredFarm = null;
            restoredCrop = null;
            setCurrentCropState(null);
          }
        } catch (err) {
          console.warn('[AUTH:REGISTER] Field fetch note:', err.message);
        }

        setFarmState(restoredFarm);
        setCurrentCropState(restoredCrop);

        persistSession(newToken, newUser, restoredProfile, restoredFarm, restoredCrop, newRefreshToken);
        refreshUser().catch(err => console.warn('[AUTH:REGISTER] Background hydration:', err.message));
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      console.error('[AUTH:REGISTER] ERROR during registration:', error);
      let errMsg = '';
      const respCode = error.response?.data?.code || error.code || 'UNKNOWN_ERROR';
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
        code: respCode,
        message: errMsg,
      };
    }
  };

  const demoLogin = async (role = 'farmer') => {
    // 1. Instant local session hydration for 0ms lag
    let demoUser = MOCK_FARMER_USER;
    if (role === 'expert') demoUser = MOCK_EXPERT_USER;
    if (role === 'admin') demoUser = MOCK_ADMIN_USER;

    const demoToken = `krishi_demo_jwt_token_${role}_2026`;
    localStorage.setItem('krishi_demo_role', role);

    setToken(demoToken);
    setUserState(demoUser);
    setProfileState(MOCK_PROFILE);
    setFarmState(MOCK_FARM);
    setCurrentCropState(MOCK_CURRENT_CROP);
    setIsLoading(false);

    persistSession(demoToken, demoUser, MOCK_PROFILE, MOCK_FARM, MOCK_CURRENT_CROP);

    // 2. Asynchronously notify backend without blocking UI navigation
    try {
      api.post('/auth/demo-login', { role }).then((res) => {
        if (res.data?.success && res.data.user) {
          setUserState(res.data.user);
          persistSession(demoToken, res.data.user, MOCK_PROFILE, MOCK_FARM, MOCK_CURRENT_CROP);
        }
      }).catch(() => {});
    } catch (_) {}

    return { success: true, user: demoUser };
  };

  /**
   * Explicit Logout: Only triggered when the farmer explicitly taps the "Logout" button.
   * Clears session credentials on server and client, but NEVER deletes user accounts or farm data!
   */
  const logout = async () => {
    console.log('[AuthContext] Explicit logout requested by user');
    const refreshToken = localStorage.getItem('fasal_refresh_token') || safeParse('fasal_user_session')?.refreshToken;
    try {
      if (refreshToken) {
        const activeBase = normalizeBackendApiUrl(api.defaults.baseURL || DEFAULT_PRODUCTION_API_URL);
        await axios.post(
          `${activeBase}/auth/logout`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 6000 }
        );
      }
    } catch (e) {
      console.warn('[AuthContext] Backend logout notification note:', e.message);
    }

    persistSession(null, null, null, null, null, null);

    setToken(null);
    setUserState(null);
    setProfileState(null);
    setFarmState(null);
    setCurrentCropState(null);

    // Clear user-specific cached dashboard, health, and active field so next user sees a clean state
    try {
      const keysToRemove = [
        'krishi_active_field',
        'active_farm_id',
        'farm_data',
        'krishi_farm',
        'krishi_current_crop',
        'krishi_profile',
        'krishi_crop_health_cache',
        'krishi_dash_cache',
        'krishi_outbreak_cache',
        'krishi_recent_scans'
      ];
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch (_) {}
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        if (res.data.user) setUserState(res.data.user);
        if (res.data.profile) setProfileState(res.data.profile);
        if (res.data.farm) setFarmState(res.data.farm);
        if (res.data.currentCrop) setCurrentCropState(res.data.currentCrop);

        const currentToken = localStorage.getItem('krishi_token') || token;
        persistSession(
          currentToken,
          res.data.user || user,
          res.data.profile || profile,
          res.data.farm || farm,
          res.data.currentCrop || currentCrop
        );
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
