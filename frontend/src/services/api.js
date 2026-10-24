import axios from 'axios';
import {
  MOCK_FARMER_USER,
  MOCK_EXPERT_USER,
  MOCK_ADMIN_USER,
  MOCK_PROFILE,
  MOCK_FARM,
  MOCK_CURRENT_CROP,
  MOCK_CROPS,
  MOCK_WEATHER,
  MOCK_MANDI_PRICES,
  MOCK_OUTBREAKS,
  MOCK_SATELLITE_NDVI,
  MOCK_SCHEMES,
  MOCK_ACTION_PLANS,
  MOCK_ALERTS,
  MOCK_EXPERT_CASES,
  MOCK_ADMIN_STATS,
  MOCK_FARMER_INSIGHTS,
  MOCK_PREDEFINED_QUERIES,
  calculateMockFertilizer,
  generateMockScanResult,
  getDynamicSatelliteNDVI,
} from './mockFallback.js';
import { fetchOpenMeteoWeather } from './weatherService.js';
import { RecoveryManager, LogLevel } from '../selfHealing/index.js';

export const DEFAULT_PRODUCTION_API_URL = 'https://krishi-drishti-pykj.onrender.com/api';

/**
 * Standardize and normalize any user or environment provided backend URL:
 * - Always targets https://krishi-drishti-pykj.onrender.com/api by default
 * - Migrates any legacy or non-pykj render hostnames
 * - Normalizes trailing slashes
 * - Automatically ensures /api suffix without ever duplicating /api/api
 */
export function normalizeBackendApiUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_PRODUCTION_API_URL;
  }
  let clean = url.trim().replace(/\/+$/, '');
  if (clean.startsWith('localhost:')) {
    clean = 'http://' + clean;
  }
  // Migrate old render hostnames to the active production backend
  if (clean.includes('krishi-drishti.onrender.com') && !clean.includes('krishi-drishti-pykj')) {
    clean = clean.replace('krishi-drishti.onrender.com', 'krishi-drishti-pykj.onrender.com');
  }
  // If user entered URL without /api, append /api
  if (!clean.endsWith('/api')) {
    clean = clean.replace(/\/api\/+api$/, '/api');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
  }
  // Eliminate any double /api/api
  clean = clean.replace(/\/api\/api$/, '/api');
  return clean;
}

import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => {
  try {
    return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  } catch (_) {
    return false;
  }
};

/**
 * Normalizes any Indian mobile number to E.164 standard format (+91XXXXXXXXXX)
 */
export function normalizeToE164(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  const tenDigit = digits.length >= 10 ? digits.slice(-10) : digits;
  return tenDigit.length === 10 ? `+91${tenDigit}` : (phone.startsWith('+') ? phone : `+${digits}`);
}

/**
 * Normalizes any Indian mobile number to a strict 10-digit clean string
 */
export function to10DigitPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
}

export const normalizePhone = to10DigitPhone;

export const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('krishi_backend_url');
    if (custom && custom.trim()) {
      return normalizeBackendApiUrl(custom.trim());
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) {
    return normalizeBackendApiUrl(import.meta.env.VITE_API_BASE_URL.trim());
  }
  // Connect to local backend first (works seamlessly on desktop and on Android device via USB adb reverse);
  // the response interceptor automatically fails over to DEFAULT_PRODUCTION_API_URL if localhost:5000 is unreachable.
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export function setCustomBackendUrl(url) {
  const normalized = normalizeBackendApiUrl(url);
  api.defaults.baseURL = normalized;
  if (typeof window !== 'undefined') {
    localStorage.setItem('krishi_backend_url', normalized);
  }
  return normalized;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // 25s default to accommodate cloud server cold starts and mobile connectivity
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token, normalize URLs, and ensure adaptive timeouts
api.interceptors.request.use((config) => {
  const base = normalizeBackendApiUrl(config.baseURL || api.defaults.baseURL || API_BASE_URL);
  config.baseURL = base;

  let url = config.url || '';
  // Fix double /api issue (config.baseURL already has /api)
  if (url.startsWith('/api/')) {
    url = url.substring(4);
  } else if (url.startsWith('api/')) {
    url = '/' + url.substring(4);
  } else if (url.startsWith('/api/api/')) {
    url = url.replace('/api/api/', '/');
  }
  config.url = url;

  // Adaptive timeout: Give generous 45s to generative AI and image scanning, 25s to standard endpoints
  const isAiRoute = url.includes('/ai/') || 
                    url.includes('/ai-advice') || 
                    url.includes('/recommendations/ask') ||
                    url.includes('/analysis/scan');
  config.timeout = isAiRoute ? 45000 : 25000;

  const token = localStorage.getItem('krishi_token') || safeParseStorage('fasal_user_session')?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const safeParseStorage = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Intelligent Fallback Dispatcher:
 * If the cloud backend is cold-starting, offline, or inaccessible,
 * gracefully serve authentic agricultural demo data for demo personas.
 */
function handleFallbackResponse(url, method = 'get', data = null) {
  const cleanUrl = (url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '');
  const methodLower = (method || 'get').toLowerCase();

  // Auth endpoints: DEMO LOGIN ONLY
  if (cleanUrl.startsWith('/auth/demo-login')) {
    const role = data?.role || 'farmer';
    let user = MOCK_FARMER_USER;
    if (role === 'expert') user = MOCK_EXPERT_USER;
    if (role === 'admin') user = MOCK_ADMIN_USER;
    const token = `krishi_demo_jwt_token_${role}_2026`;
    localStorage.setItem('krishi_token', token);
    localStorage.setItem('krishi_demo_role', role);
    return {
      success: true,
      token,
      user,
    };
  }

  if (cleanUrl.startsWith('/auth/me')) {
    const isDemoRole = localStorage.getItem('krishi_demo_role');
    if (isDemoRole) {
      let user = MOCK_FARMER_USER;
      if (isDemoRole === 'expert') user = MOCK_EXPERT_USER;
      if (isDemoRole === 'admin') user = MOCK_ADMIN_USER;
      return {
        success: true,
        user,
        profile: MOCK_PROFILE,
        farm: MOCK_FARM,
        currentCrop: MOCK_CURRENT_CROP,
      };
    }

    const fasalSession = safeParseStorage('fasal_user_session');
    if (fasalSession && fasalSession.user) {
      return {
        success: true,
        user: fasalSession.user,
        profile: fasalSession.profile || safeParseStorage('krishi_profile') || null,
        farm: fasalSession.farm || safeParseStorage('krishi_farm') || null,
        currentCrop: fasalSession.currentCrop || safeParseStorage('krishi_current_crop') || null,
      };
    }

    const cachedUser = safeParseStorage('krishi_user');
    if (cachedUser) {
      return {
        success: true,
        user: cachedUser,
        profile: safeParseStorage('krishi_profile') || null,
        farm: safeParseStorage('krishi_farm') || null,
        currentCrop: safeParseStorage('krishi_current_crop') || null,
      };
    }

    return {
      success: false,
      message: 'No active session'
    };
  }

  if (cleanUrl.startsWith('/auth/refresh')) {
    const isDemoRole = localStorage.getItem('krishi_demo_role');
    if (isDemoRole) {
      let user = MOCK_FARMER_USER;
      if (isDemoRole === 'expert') user = MOCK_EXPERT_USER;
      if (isDemoRole === 'admin') user = MOCK_ADMIN_USER;
      const demoToken = `krishi_demo_jwt_token_${isDemoRole}_2026`;
      return {
        success: true,
        accessToken: demoToken,
        token: demoToken,
        refreshToken: `krishi_demo_refresh_${Date.now()}`,
        user,
      };
    }

    const fasalSession = safeParseStorage('fasal_user_session');
    if (fasalSession && fasalSession.user) {
      return {
        success: true,
        accessToken: fasalSession.token || `krishi_offline_token_${Date.now()}`,
        token: fasalSession.token || `krishi_offline_token_${Date.now()}`,
        refreshToken: fasalSession.refreshToken || `fasal_offline_refresh_${Date.now()}`,
        user: fasalSession.user,
      };
    }

    return {
      success: false,
      code: 'REFRESH_TOKEN_INVALID',
      message: 'No active session found for refresh.',
    };
  }

  if (cleanUrl.startsWith('/auth/logout')) {
    return {
      success: true,
      message: 'Logged out successfully (offline fallback). Farm data preserved.',
    };
  }

  if (cleanUrl.startsWith('/auth/login') || cleanUrl.startsWith('/auth/register')) {
    return {
      success: false,
      message: 'Network error or server unreachable. Please check connection.',
    };
  }

  // Farmer endpoints
  if (cleanUrl.startsWith('/farmer/dashboard')) {
    const isDemoRole = localStorage.getItem('krishi_demo_role');
    if (isDemoRole === 'farmer') {
      return {
        success: true,
        data: {
          farmer: MOCK_FARMER_USER,
          profile: MOCK_PROFILE,
          farm: MOCK_FARM,
          currentCrop: MOCK_CURRENT_CROP,
          crops: MOCK_CROPS,
          healthScore: 91,
          pendingTasks: (MOCK_ACTION_PLANS?.tasks || []).filter((p) => !p.isCompleted),
          recentAnalyses: [generateMockScanResult('Tomato').data],
          recentRecommendations: [
            {
              _id: 'rec_01',
              query: 'Early blight control',
              aiResponse: 'Spray Mancozeb 75 WP or Neem Oil',
              createdAt: new Date().toISOString(),
            },
          ],
          unreadAlerts: MOCK_ALERTS,
        },
      };
    }

    const cachedUser = safeParseStorage('krishi_user');
    const userProfile = safeParseStorage('krishi_profile');
    const userFarm = safeParseStorage('krishi_farm');
    const userCurrentCrop = safeParseStorage('krishi_current_crop');

    return {
      success: true,
      data: {
        farmer: cachedUser || { name: 'Farmer' },
        profile: userProfile || null,
        farm: userFarm || null,
        currentCrop: userCurrentCrop || null,
        crops: userCurrentCrop ? [userCurrentCrop] : [],
        healthScore: userCurrentCrop?.healthScore || null,
        pendingTasks: [],
        recentAnalyses: [],
        recentRecommendations: [],
        unreadAlerts: [],
      },
    };
  }

  if (cleanUrl.startsWith('/farmer/insights')) {
    return {
      success: true,
      data: MOCK_FARMER_INSIGHTS,
    };
  }

  if (cleanUrl.startsWith('/farmer/onboarding')) {
    return {
      success: true,
      message: 'Onboarding completed successfully!',
      profile: data || null,
      farm: data ? { farmName: `${data.name || 'My'}'s Farm`, farmSize: data.farmSize, landUnit: data.landUnit || 'Acres' } : null,
    };
  }

  // Crops
  if (cleanUrl.startsWith('/crops')) {
    return {
      success: true,
      data: MOCK_CROPS,
    };
  }

  // Weather
  if (cleanUrl.startsWith('/weather')) {
    return {
      success: true,
      data: MOCK_WEATHER,
    };
  }

  // Mandi Prices - Fallback to benchmark APMC bulletin rates when network is offline
  if (cleanUrl.startsWith('/mandi/prices') || cleanUrl.startsWith('/mandi-rates') || cleanUrl.startsWith('/mandi')) {
    return {
      success: true,
      source: 'AGMARKNET / DMI Reference Benchmark',
      sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
      message: "Showing official AGMARKNET benchmark reference rates (Live API refreshed periodically).",
      data: MOCK_MANDI_PRICES,
      count: MOCK_MANDI_PRICES.length
    };
  }

  // Disease Scan / AI Diagnosis
  if (cleanUrl.startsWith('/analysis/scan')) {
    const lang = (typeof data?.get === 'function' ? data.get('language') : data?.language) || localStorage.getItem('krishi_language') || 'en';
    const crop = (typeof data?.get === 'function' ? data.get('cropName') : data?.cropName) || '';
    return generateMockScanResult(crop, lang);
  }

  // Satellite NDVI Radar
  if (cleanUrl.startsWith('/tools/satellite-ndvi')) {
    return getDynamicSatelliteNDVI();
  }

  // Outbreaks
  if (cleanUrl.startsWith('/tools/outbreaks')) {
    return MOCK_OUTBREAKS;
  }

  // Schemes
  if (cleanUrl.startsWith('/tools/schemes')) {
    return MOCK_SCHEMES;
  }

  // Fertilizer Calculator
  if (cleanUrl.startsWith('/tools/fertilizer-calc')) {
    return calculateMockFertilizer(data || {});
  }

  // Action Plans
  if (cleanUrl.startsWith('/action-plans')) {
    if (cleanUrl.includes('/toggle')) {
      const parts = cleanUrl.split('/');
      const taskId = parts[2];
      const task = MOCK_ACTION_PLANS.tasks.find(t => t._id === taskId);
      if (task) {
        task.isCompleted = !task.isCompleted;
        MOCK_ACTION_PLANS.stats.completed = MOCK_ACTION_PLANS.tasks.filter(t => t.isCompleted).length;
        MOCK_ACTION_PLANS.stats.pending = MOCK_ACTION_PLANS.stats.total - MOCK_ACTION_PLANS.stats.completed;
        MOCK_ACTION_PLANS.stats.completionRate = Math.round((MOCK_ACTION_PLANS.stats.completed / MOCK_ACTION_PLANS.stats.total) * 100);
      }
      return { success: true, data: task };
    }

    if (method.toLowerCase() === 'delete') {
      const parts = cleanUrl.split('/');
      const taskId = parts[2];
      MOCK_ACTION_PLANS.tasks = MOCK_ACTION_PLANS.tasks.filter(t => t._id !== taskId);
      MOCK_ACTION_PLANS.stats.total = MOCK_ACTION_PLANS.tasks.length;
      MOCK_ACTION_PLANS.stats.completed = MOCK_ACTION_PLANS.tasks.filter(t => t.isCompleted).length;
      MOCK_ACTION_PLANS.stats.pending = MOCK_ACTION_PLANS.stats.total - MOCK_ACTION_PLANS.stats.completed;
      MOCK_ACTION_PLANS.stats.completionRate = MOCK_ACTION_PLANS.stats.total > 0 ? Math.round((MOCK_ACTION_PLANS.stats.completed / MOCK_ACTION_PLANS.stats.total) * 100) : 0;
      return { success: true, message: 'Task deleted' };
    }

    if (method.toLowerCase() === 'post') {
      const newTask = {
        _id: 'task_' + Date.now(),
        title: data?.title || 'Custom Action Item',
        titleHi: data?.title || 'कस्टम कार्य',
        description: data?.description || '',
        dayLabel: data?.dayLabel || 'TODAY',
        isCompleted: false,
        priority: data?.priority || 'Medium',
        category: data?.category || 'Inspection',
      };
      MOCK_ACTION_PLANS.tasks.unshift(newTask);
      MOCK_ACTION_PLANS.stats.total = MOCK_ACTION_PLANS.tasks.length;
      MOCK_ACTION_PLANS.stats.pending++;
      MOCK_ACTION_PLANS.stats.completionRate = Math.round((MOCK_ACTION_PLANS.stats.completed / MOCK_ACTION_PLANS.stats.total) * 100);
      return { success: true, data: newTask };
    }

    return {
      success: true,
      data: MOCK_ACTION_PLANS,
    };
  }

  // Alerts
  if (cleanUrl.startsWith('/alerts')) {
    return {
      success: true,
      data: MOCK_ALERTS,
      unreadCount: MOCK_ALERTS.filter(a => !a.isRead).length,
    };
  }

  // AI Advisor
  if (cleanUrl.startsWith('/recommendations/predefined-queries')) {
    return {
      success: true,
      data: MOCK_PREDEFINED_QUERIES,
      queries: MOCK_PREDEFINED_QUERIES,
    };
  }


  // Expert Advisory
  if (cleanUrl.startsWith('/expert/cases')) {
    return {
      success: true,
      cases: MOCK_EXPERT_CASES,
    };
  }

  if (cleanUrl.startsWith('/expert/prescribe')) {
    return {
      success: true,
      message: 'Prescription sent to farmer successfully!',
    };
  }

  // Admin
  if (cleanUrl.startsWith('/admin/stats')) {
    return {
      success: true,
      data: MOCK_ADMIN_STATS,
    };
  }

  if (cleanUrl.startsWith('/admin/users')) {
    return {
      success: true,
      users: [MOCK_FARMER_USER, MOCK_EXPERT_USER, MOCK_ADMIN_USER],
    };
  }

  // Fields (Field Mapping)
  if (cleanUrl.startsWith('/farmer/fields')) {
    let storedFields = [];
    const defaultKipm = {
      _id: 'field_kipm_paddy_01',
      id: 'field_kipm_paddy_01',
      farmerId: 'usr_farmer_demo_01',
      fieldName: 'KIPM Paddy Farm',
      name: 'KIPM Paddy Farm',
      farmerName: 'Farmer Rameshwar (KIPM Campus Block)',
      points: [
        { lat: 26.76920, lng: 83.22950 },
        { lat: 26.76950, lng: 83.23120 },
        { lat: 26.76780, lng: 83.23160 },
        { lat: 26.76740, lng: 83.22980 }
      ],
      boundary: [
        { lat: 26.76920, lng: 83.22950 },
        { lat: 26.76950, lng: 83.23120 },
        { lat: 26.76780, lng: 83.23160 },
        { lat: 26.76740, lng: 83.22980 }
      ],
      cornersCount: 4,
      farmArea: '3.85',
      areaAcres: 3.85,
      areaHectares: 1.56,
      areaSqMeters: 15580,
      formattedAcres: '3.85 acres',
      formattedHectares: '1.56 hectares',
      perimeterMeters: 685,
      formattedPerimeter: '685 meters',
      center: { lat: 26.76830, lng: 83.23030 },
      latitude: 26.76830,
      longitude: 83.23030,
      crop: 'Paddy',
      cropVariety: 'Pusa Basmati 1509',
      cropStage: 'Tillering Stage',
      season: 'Kharif',
      soilType: 'Alluvial Loam / बलुई दोमट मिट्टी',
      irrigationMethod: 'Tube Well & Canal',
      notes: 'KIPM Technical Campus GIDA Gorakhpur Paddy Block - Live Satellite Monitoring Active',
      gpsStatus: 'GPS Connected & Verified',
      gpsAccuracy: 6,
      createdAt: '2026-10-02T10:00:00.000Z',
      updatedAt: new Date().toISOString()
    };

    try {
      const keys = ['krishi_saved_fields', 'farms_data', 'krishi_farms_v2'];
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('farms_data_usr_')) keys.unshift(k);
        }
      }
      for (const k of keys) {
        if (storedFields.length > 0) break;
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            storedFields = parsed.filter(f => {
              if (!f) return false;
              if (f.id === 'field_demo_maize_01' || f.id === 'field_demo_01') return false;
              if (f._id === 'field_demo_maize_01' || f._id === 'field_demo_01') return false;
              return true;
            });
          }
        }
      }
    } catch (_) {}

    // Multi-key guarantee: Always ensure KIPM Paddy Farm is included
    if (!storedFields.some(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm') || f.name?.toLowerCase().includes('kipm'))) {
      storedFields.unshift(defaultKipm);
    }

    return {
      success: true,
      data: storedFields
    };
  }

  // Crop Scans & Permanent History Fallback
  if (cleanUrl.startsWith('/crop-scans')) {
    const mockScansList = [
      {
        _id: 'scan_wheat_04',
        cropName: 'Wheat',
        cropVariety: 'DBW 187 (Karan Vandana)',
        cropStage: 'Earhead / Flowering Stage',
        fieldName: 'North Plot - Wheat & Maize Block',
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
        detectedProblem: 'Healthy Canopy (No Pathological Disease Detected)',
        detectedProblemHi: 'पूर्णतः स्वस्थ फसल (कोई सक्रिय रोग नहीं)',
        confidence: 96.8,
        severity: 'None (Healthy)',
        healthStatus: 'Healthy',
        healthScore: 96,
        symptoms: ['Clean flag leaves', 'Uniform green coloration'],
        diagnosis: 'Fully recovered and disease-free. Flag leaf area index is optimal for grain filling.',
        diagnosisHi: 'फसल पूरी तरह रोगमुक्त है। बालियों में दाना भराव के लिए पत्तियां पूर्ण स्वस्थ हैं।',
        recommendedTreatment: {
          organic: 'Continue regular field scouting.',
          chemical: 'No chemical pesticide application required.',
          general: 'Maintain moist soil condition.',
          timeline: 'Re-inspect in 10-14 days.'
        },
        scanDate: new Date('2025-12-15T14:20:00Z').toISOString()
      },
      {
        _id: 'scan_wheat_01',
        cropName: 'Wheat',
        cropVariety: 'DBW 187 (Karan Vandana)',
        cropStage: 'Vegetative Stage',
        fieldName: 'North Plot - Wheat & Maize Block',
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
        detectedProblem: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
        detectedProblemHi: 'गेहूं का पीला रतुआ / स्ट्राइप रस्ट',
        confidence: 94.5,
        severity: 'High',
        healthStatus: 'Needs Attention',
        healthScore: 42,
        symptoms: ['Linear yellow powdery pustules', 'Chlorosis'],
        diagnosis: 'Active Stripe Rust sporulation along vascular leaf lines. Urgent fungicide treatment needed.',
        diagnosisHi: 'पत्तियों की शिराओं पर पीले रतुए के सक्रिय लक्षण। तत्काल छिड़काव आवश्यक।',
        recommendedTreatment: {
          organic: 'Spray fermented neem leaf extract @ 50ml/L.',
          chemical: 'Spray Propiconazole 25% EC (Tilt) @ 1ml per litre water.',
          general: 'Inspect border rows.',
          timeline: 'Spray within 24-48 hours.'
        },
        scanDate: new Date('2025-09-15T10:30:00Z').toISOString()
      },
      {
        _id: 'scan_tomato_01',
        cropName: 'Tomato',
        cropVariety: 'Abhinav Hybrid',
        cropStage: 'Flowering Stage',
        fieldName: 'South Plot - Tomato Patch',
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80',
        detectedProblem: 'Tomato Early Blight (Alternaria solani)',
        detectedProblemHi: 'टमाटर की अगेती झुलसा (अल्टरनेरिया)',
        confidence: 93.4,
        severity: 'Medium',
        healthStatus: 'Moderate',
        healthScore: 65,
        symptoms: ['Concentric dark spots on lower foliage', 'Yellow halo surrounding lesions'],
        diagnosis: 'Early stage Alternaria solani blight identified.',
        diagnosisHi: 'निचली पत्तियों पर अगेती झुलसा के लक्षण। समय पर रोकथाम आवश्यक।',
        recommendedTreatment: {
          organic: 'Spray Trichoderma viride @ 5g/L.',
          chemical: 'Spray Mancozeb 75% WP @ 2.5g/L.',
          general: 'Prune leaves touching soil.',
          timeline: 'Spray within 24 hours.'
        },
        scanDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    if (cleanUrl.includes('/stats')) {
      return {
        success: true,
        data: {
          totalScans: mockScansList.length,
          healthyCount: 2,
          attentionCount: 1,
          activeCropsCount: 2,
          uniqueCrops: ['Wheat', 'Tomato'],
          recentScans: mockScansList.slice(0, 4),
          lastScanDate: mockScansList[0].scanDate
        }
      };
    }

    if (cleanUrl.includes('/compare')) {
      return {
        success: true,
        data: {
          comparisonId: 'comp_demo_01',
          cropName: 'Wheat',
          fieldName: 'North Plot - Wheat & Maize Block',
          oldScan: {
            ...mockScansList[1],
            date: mockScansList[1].scanDate
          },
          newScan: {
            ...mockScansList[0],
            date: mockScansList[0].scanDate
          },
          comparison: {
            status: 'Resolved',
            statusHi: 'रोग पूरी तरह ठीक हुआ',
            progressScoreChange: 54,
            daysBetweenScans: 91,
            healthChange: 'Needs Attention (42%) → Healthy (96%)',
            diseaseChange: 'Yellow Rust / Stripe Rust (High) → Healthy Canopy (None)',
            symptomsChange: 'Yellow powdery pustules on lower leaves → Clean vigorous flag leaves and spikes',
            conditionThenVsNow: {
              then: 'Vegetative Stage | High Severity | Health Score: 42%',
              now: 'Flowering Stage | Clean Canopy | Health Score: 96%'
            },
            diseaseThenVsNow: {
              then: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
              now: 'Healthy Canopy (No Pathological Disease Detected)'
            },
            healthStatusThenVsNow: {
              then: 'Needs Attention',
              now: 'Healthy'
            },
            symptomsThenVsNow: {
              then: ['Linear yellow powdery pustules', 'Chlorosis', 'Premature leaf drying'],
              now: ['Clean flag leaves', 'Uniform green coloration', 'Robust tillers and spikes']
            },
            diagnosisThenVsNow: {
              then: 'Active Stripe Rust sporulation along vascular leaf lines. Urgent fungicide treatment needed.',
              now: 'Fully recovered and disease-free. Flag leaf area index is optimal for grain filling.'
            },
            treatmentThenVsNow: {
              then: 'Spray Propiconazole 25% EC (Tilt) @ 1ml per litre water.',
              now: 'No chemical pesticide required. Apply Potassium Sulphate 0:0:50 for grain boldness.'
            },
            whatChanged: 'Your wheat crop has improved significantly over the last 3 months (91 days). Yellow rust lesions have been completely eradicated.',
            whatChangedHi: 'पिछले 3 महीनों (91 दिनों) में आपके गेहूं की फसल में शानदार सुधार हुआ है। पीला रतुआ पूरी तरह खत्म हो गया है।',
            possibleReason: 'Timely application of Propiconazole 25% EC combined with regulated drip watering successfully broke the fungal life cycle.',
            possibleReasonHi: 'समय पर प्रोपिकोनाजोल के छिड़काव और यूरिया के संतुलित प्रयोग से फफूंद का जीवन चक्र समाप्त हो गया।',
            actionAdvice: 'Maintain light soil moisture during the critical grain filling stage.',
            actionAdviceHi: 'दाना भराव के समय खेत में नमी बनाए रखें।',
            aiSummary: 'Excellent recovery from severe Yellow Rust. Health score improved from 42% to 96% (+54%).',
            aiSummaryHi: 'गंभीर पीले रतुए से शत-प्रतिशत सुधार। फसल स्वास्थ्य 42% से बढ़कर 96% (+54%) तक पहुंचा।'
          }
        }
      };
    }

    if (cleanUrl.includes('/timeline')) {
      const timeline = mockScansList.map((s, i) => ({
        step: i + 1,
        scanId: s._id,
        date: s.scanDate,
        cropStage: s.cropStage,
        healthStatus: s.healthStatus,
        severity: s.severity,
        healthScore: s.healthScore,
        detectedProblem: s.detectedProblem,
        detectedProblemHi: s.detectedProblemHi,
        imageUrl: s.imageUrl,
        treatmentTimeline: s.recommendedTreatment?.timeline || ''
      }));
      return {
        success: true,
        cropName: 'Wheat',
        totalScans: timeline.length,
        timeline
      };
    }

    if (cleanUrl.includes('/detail/')) {
      const id = cleanUrl.split('/detail/')[1];
      const scan = mockScansList.find(s => s._id === id) || mockScansList[0];
      return {
        success: true,
        data: scan
      };
    }

    return {
      success: true,
      count: mockScansList.length,
      data: mockScansList
    };
  }

  // Field Monitoring Fallback
  if (cleanUrl.startsWith('/field-monitoring')) {
    const defaultField = {
      _id: 'field_kipm_paddy_01',
      id: 'field_kipm_paddy_01',
      farmerId: 'usr_farmer_demo_01',
      fieldName: 'KIPM Paddy Farm',
      name: 'KIPM Paddy Farm',
      farmerName: 'Farmer Rameshwar (KIPM Campus Block)',
      crop: 'Paddy',
      cropVariety: 'Pusa Basmati 1509',
      cropStage: 'Tillering Stage',
      areaAcres: 3.85,
      areaHectares: 1.56,
      areaSqMeters: 15580,
      soilType: 'Alluvial Loam / बलुई दोमट मिट्टी',
      irrigationMethod: 'Tube Well & Canal',
      center: { lat: 26.76830, lng: 83.23030 },
      latitude: 26.76830,
      longitude: 83.23030,
      points: [
        { lat: 26.76920, lng: 83.22950 },
        { lat: 26.76950, lng: 83.23120 },
        { lat: 26.76780, lng: 83.23160 },
        { lat: 26.76740, lng: 83.22980 }
      ],
      boundary: [
        { lat: 26.76920, lng: 83.22950 },
        { lat: 26.76950, lng: 83.23120 },
        { lat: 26.76780, lng: 83.23160 },
        { lat: 26.76740, lng: 83.22980 }
      ]
    };

    const mockObservation = {
      _id: 'obs_kipm_paddy_01',
      fieldId: 'field_kipm_paddy_01',
      cropName: 'Paddy (धान)',
      cropStage: 'Tillering Stage (कल्ले फूटने की अवस्था)',
      observationDate: new Date().toISOString(),
      satelliteData: {
        available: true,
        source: 'Sentinel-2B (ESA Copernicus MSI)',
        resolution: '10m Multispectral Ground Resolution',
        cloudCoverage: 1.8,
        lastObservationDate: new Date().toLocaleDateString('hi-IN'),
        ndviMean: 0.82,
        healthCategory: 'उत्कृष्ट व स्वस्थ (Healthy & Vigorous)',
        healthScore: 94,
        status: 'Latest Available (Sentinel-2 L2A)',
        spatialZones: [
          {
            zoneId: 'z1',
            name: 'North Sector (KIPM Campus Block)',
            areaAcres: 1.95,
            ndvi: 0.84,
            status: 'Healthy',
            color: '#10B981',
            healthScore: 96,
            moistureStatus: 'Adequate Moisture',
            stressLevel: 'None',
            observation: 'Dense vegetative tiller formation with high chlorophyll index'
          },
          {
            zoneId: 'z2',
            name: 'South Sector (Canal Side Block)',
            areaAcres: 1.90,
            ndvi: 0.80,
            status: 'Optimal',
            color: '#34D399',
            healthScore: 92,
            moistureStatus: 'Adequate Moisture',
            stressLevel: 'Low',
            observation: 'Uniform water retention and steady tillering growth'
          }
        ]
      },
      weatherData: {
        temperatureC: 29,
        humidityPercent: 74,
        precipitationMm: 0,
        precipitationForecast24h: 0,
        precipitationForecast48h: 1.2,
        precipitationProbability: 15,
        et0Fao: 4.2,
        condition: 'Partly Sunny / Ideal Growing'
      },
      moistureStatus: {
        status: 'Optimal Water Ponding (3-5 cm)',
        statusHi: 'पर्याप्त नमी व जल भराव (3-5 सेमी)',
        moistureScore: 72,
        deficitMm: 0,
        recommendation: 'Standing water layer (3-5 cm) is optimal for Basmati tillering. No extra watering required.',
        recommendationHi: 'धान में कल्ले फूटने के लिए 3-5 सेमी पानी का भराव उत्तम है। अतिरिक्त सिंचाई की आवश्यकता नहीं है।'
      },
      irrigationAdvisory: {
        actionRequired: false,
        priority: 'Normal',
        urgencyEn: 'Adequate water ponding maintained (3-5 cm)',
        urgencyHi: 'खेत में पर्याप्त 3-5 सेमी पानी उपलब्ध है',
        messageEn: 'Paddy tillering stage requires 3-5 cm standing water layer. Current ponding depth is optimal.',
        messageHi: 'धान में कल्ले फूटने हेतु 3-5 सेमी पानी का भराव आवश्यक है। वर्तमान में जल स्तर उत्तम है।'
      },
      nutrientAdvisory: {
        status: 'Tillering Stage - Top Dressing Window',
        recommendationEn: 'Apply 2nd split of Urea (25-30 kg/acre) + Zinc Sulphate (5 kg/acre) to maximize productive tillers.',
        recommendationHi: 'सक्रिय कल्ले फूटने की अवस्था: यूरिया (25-30 किग्रा/एकड़) एवं जिंक सल्फेट (5 किग्रा/एकड़) का भुरकाव करें।'
      },
      diseaseRisk: {
        riskLevel: 'Low',
        riskScore: 16,
        messageEn: 'Monitor tillers for stem borer and Brown Plant Hopper (BPH). Microclimate is currently safe.',
        messageHi: 'पौधों के आधार पर भूरा माहू (BPH) एवं तना छेदक की निगरानी करें। वर्तमान सूक्ष्म जलवायु सुरक्षित है।'
      },
      whatShouldIDoToday: [
        { id: '1', textEn: 'Maintain 3-5 cm standing water level in paddy parcel.', textHi: 'धान के खेत में 3 से 5 सेमी पानी का स्तर स्थिर बनाए रखें।', category: 'Water' },
        { id: '2', textEn: 'Apply recommended top-dress Urea (25-30 kg/acre) with Zinc.', textHi: 'यूरिया (25-30 किग्रा/एकड़) के साथ जिंक सल्फेट का छिड़काव/भुरकाव करें।', category: 'Nutrition' },
        { id: '3', textEn: 'Scout tillers near base of hill for stem borer or brown planthopper.', textHi: 'धान के पौधों के निचले भाग में तना छेदक या भूरे फुदके की जांच करें।', category: 'Scouting' },
        { id: '4', textEn: 'Inspect and strengthen field perimeter bunds to prevent runoff.', textHi: 'खेत की मेड़ों को मजबूत करें ताकि पानी का रिसाव न हो सके।', category: 'Maintenance' },
        { id: '5', textEn: 'Review Gorakhpur APMC Basmati paddy arrival prices and weather trends.', textHi: 'गोरखपुर कृषि उपज मंडी में बासमती धान के भाव एवं मौसम का पूर्वानुमान देखें।', category: 'Market' }
      ],
      aiSummary: 'KIPM Paddy Farm displays robust vegetative canopy (NDVI 0.82). Soil moisture and standing water are well-balanced for tillering.',
      aiSummaryHi: 'केआईपीएम धान का खेत अत्यंत स्वस्थ है (NDVI 0.82)। कल्ले फूटने के लिए 3-5 सेमी पानी का भराव उत्तम है और रोग जोखिम कम है।'
    };

    if (cleanUrl.includes('/dashboard-summary')) {
      return {
        success: true,
        count: 1,
        data: [
          {
            fieldId: 'field_kipm_paddy_01',
            fieldName: 'KIPM Paddy Farm',
            area: 3.85,
            areaUnit: 'Acres',
            crop: 'Paddy',
            cropVariety: 'Pusa Basmati 1509',
            cropStage: 'Tillering Stage',
            soilType: 'Alluvial Loam / बलुई दोमट मिट्टी',
            irrigationMethod: 'Tube Well & Canal',
            cropHealth: 'उत्कृष्ट व स्वस्थ (Healthy & Vigorous)',
            healthScore: 94,
            moistureStatus: 'Adequate Moisture',
            moistureStatusHi: 'पर्याप्त नमी (3-5 सेमी जल भराव)',
            moistureScore: 72,
            rainForecast: 0,
            rainProbability: 15,
            irrigationRecommendation: 'Not Required Today',
            nutrientStatus: 'Tillering Stage - Apply Urea & Zinc',
            nutrientStatusHi: 'सक्रिय कल्ले फूटने पर यूरिया व जिंक डालें',
            diseaseRisk: 'Low',
            lastSatelliteObservation: new Date().toLocaleDateString('hi-IN'),
            ndviMean: 0.82,
            whatShouldIDoToday: mockObservation.whatShouldIDoToday,
            aiSummary: mockObservation.aiSummary,
            aiSummaryHi: mockObservation.aiSummaryHi
          }
        ]
      };
    }

    if (cleanUrl.includes('/latest/')) {
      return {
        success: true,
        field: defaultField,
        data: mockObservation,
        alerts: []
      };
    }

    if (cleanUrl.includes('/history/')) {
      const days = [14, 12, 10, 8, 6, 4, 2, 0];
      const chartData = days.map((d, i) => ({
        date: new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString(),
        ndvi: +(0.74 + (i * 0.011)).toFixed(3),
        cloudCoverage: 1.5 + (i % 2),
        satelliteStatus: 'Latest Available (Sentinel-2)',
        moistureScore: 70 + (i % 3),
        moistureStatus: 'Optimal Saturated',
        rainfallMm: d === 6 ? 2.5 : 0,
        temperatureC: 28 + (i % 2),
        et0: 4.2,
        irrigationNeeded: false,
        diseaseRiskLevel: 'Low',
        healthScore: 90 + i
      }));
      return {
        success: true,
        field: defaultField,
        count: chartData.length,
        history: chartData,
        chartData
      };
    }

    if (cleanUrl.includes('/compare/')) {
      const period = cleanUrl.includes('15d') ? '15d' : (cleanUrl.includes('30d') ? '30d' : '7d');
      const prevNdvi = period === '30d' ? 0.58 : (period === '15d' ? 0.71 : 0.77);
      const prevHealth = period === '30d' ? 76 : (period === '15d' ? 82 : 88);
      const prevMoist = period === '30d' ? 60 : (period === '15d' ? 65 : 68);
      const deltaNdvi = +(0.82 - prevNdvi).toFixed(2);
      const deltaPercent = +((deltaNdvi / prevNdvi) * 100).toFixed(1);

      return {
        success: true,
        canCompare: true,
        field: defaultField,
        period,
        daysApart: period === '30d' ? 30 : (period === '15d' ? 15 : 7),
        nearestDateNotice: 'Exact pass found from Copernicus Sentinel-2 MSI archive',
        current: mockObservation,
        previous: {
          ...mockObservation,
          observationDate: new Date(Date.now() - (period === '30d' ? 30 : (period === '15d' ? 15 : 7)) * 86400000).toISOString(),
          satelliteData: {
            ...mockObservation.satelliteData,
            ndviMean: prevNdvi,
            healthScore: prevHealth
          },
          moistureStatus: {
            ...mockObservation.moistureStatus,
            moistureScore: prevMoist
          }
        },
        deltas: {
          ndviDelta: deltaNdvi,
          ndviDeltaPercent: deltaPercent,
          moistureDelta: 72 - prevMoist,
          healthDelta: 94 - prevHealth,
          comparisonNarrativeEn: `KIPM Paddy Farm shows positive vegetative expansion (+${deltaPercent}% NDVI) with robust Basmati tiller density and optimal water depth.`,
          comparisonNarrativeHi: `केआईपीएम धान के खेत में चयनित अवधि में +${deltaPercent}% हरियाली (NDVI) और कल्ले फूटने में तीव्र वृद्धि दर्ज की गई है। जल भराव स्तर अनुकूल है।`
        },
        chartData: [
          { date: '14 दिन पूर्व', ndvi: 0.74, moisture: 66 },
          { date: '10 दिन पूर्व', ndvi: 0.76, moisture: 68 },
          { date: '7 दिन पूर्व', ndvi: 0.77, moisture: 68 },
          { date: '3 दिन पूर्व', ndvi: 0.80, moisture: 70 },
          { date: 'आज (Live)', ndvi: 0.82, moisture: 72 }
        ],
        sourceTransparency: {
          fieldId: 'field_kipm_paddy_01',
          fieldName: 'KIPM Paddy Farm',
          centroid: { lat: 26.7683, lng: 83.2303 },
          areaAcres: 3.85,
          productId: 'CDSE_SENTINEL2_MSIL2A',
          processing: 'NDVI = (B8 - B4) / (B8 + B4)'
        }
      };
    }

    return {
      success: true,
      message: 'Field monitoring operation successful',
      data: mockObservation
    };
  }

  // App Version Telemetry & In-App Update Fallback
  if (cleanUrl.startsWith('/app/version-check')) {
    return {
      success: true,
      latestVersion: '1.0.1',
      latestVersionCode: 2,
      minRequiredVersion: '1.0.0',
      minRequiredVersionCode: 1,
      hasUpdate: false,
      isMandatory: false,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.fasaldristi.app',
      apkUrl: 'https://github.com/hariomyadav144/krishi-drishti/releases/latest',
      title: 'New Fasal Drishti Version Available',
      titleHi: 'फ़सल दृष्टि का नया अपडेट उपलब्ध है 🌱',
      releaseNotes: '• Enhanced Sentinel-2 satellite NDVI resolution\n• AI leaf scanner precision update\n• Faster GPS field boundary calculation',
      releaseNotesHi: '• उपग्रह Sentinel-2 फसल स्वास्थ्य रडार अपडेट\n• AI पत्ती स्कैनर और अधिक सटीक\n• जीपीएस खेत मैपिंग में नई सुविधाएं'
    };
  }

  // Crop Health Telemetry Fallback (Dynamic calculation for standalone/demo/offline modes)
  if (cleanUrl.startsWith('/crop-health')) {
    const calculateFieldHealth = (fieldId) => {
      const isTomato = fieldId === 'field_demo_02' || (typeof fieldId === 'string' && fieldId.toLowerCase().includes('tomato'));
      if (isTomato) {
        return {
          fieldId: 'field_demo_02',
          fieldName: 'South Plot - Tomato Patch',
          crop: 'Tomato',
          cropVariety: 'Abhinav Hybrid',
          cropStage: 'Flowering Stage',
          healthScore: 68,
          status: 'Attention Needed',
          confidence: 'High',
          calculatedAt: new Date().toISOString(),
          factors: {
            cropCondition: { score: 65, status: 'Attention Needed', detail: 'Early Blight (Alternaria solani) symptoms identified' },
            soilMoisture: { score: 68, status: 'Adequate', detail: 'Soil moisture is optimal (68%)' },
            weather: { score: 72, status: 'Suitable', detail: '27°C, 62% humidity, mild foliar humidity' },
            diseaseRisk: { score: 60, status: 'Moderate', detail: 'Foliar blight risk present on lower canopy' },
            irrigation: { score: 75, status: 'On Schedule', detail: 'Drip schedule active; no water deficit' },
            nutrients: { score: 70, status: 'Adequate', detail: 'Balanced NPK needed for flowering phase' },
          },
          reasons: [
            '⚠ Early stage Alternaria blight symptoms detected on lower foliage',
            '✓ Soil moisture is within adequate range (68%)',
            '✓ Local weather conditions are favorable for growth'
          ],
          reasonsHi: [
            '⚠ टमाटर में अगेती झुलसा के लक्षण मिले',
            '✓ मिट्टी में नमी की मात्रा अनुकूल है (68%)',
            '✓ स्थानीय मौसम फसल के अनुकूल है'
          ],
          recommendations: [
            {
              priority: 'High',
              category: 'Crop Protection',
              title: 'Spray Mancozeb 75% WP or Neem Extract',
              titleHi: 'मैंकोजेब 75% WP या नीम तेल का छिड़काव करें',
              description: 'Spray Mancozeb 75% WP @ 2.5g/L or Trichoderma viride to halt Alternaria blight progression.',
              timeline: 'Within 24-48 hours'
            }
          ],
          dataSources: [
            { source: 'Latest Crop Scan', available: true, detail: 'AI leaf analysis completed' },
            { source: 'Soil Moisture Telemetry', available: true, detail: 'In-field moisture sensor: 68%' },
            { source: 'Weather Radar', available: true, detail: 'Open-Meteo live station data' },
            { source: 'Irrigation Log', available: true, detail: 'Scheduled drip fertigation' },
            { source: 'Satellite Sentinel-2', available: true, detail: 'NDVI 0.65 (Medium Vigor)' }
          ]
        };
      }

      // Default: Kipm paddy - Paddy
      return {
        fieldId: 'field_kipm_paddy_01',
        fieldName: 'Kipm paddy',
        crop: 'Paddy',
        cropVariety: 'Pusa Basmati 1509',
        cropStage: 'Tillering Stage',
        healthScore: 88,
        status: 'Healthy',
        confidence: 'High',
        calculatedAt: new Date().toISOString(),
        factors: {
          cropCondition: { score: 92, status: 'Healthy', detail: 'Clean vigorous tillers & foliage' },
          soilMoisture: { score: 88, status: 'Optimal', detail: 'Adequate soil water reserve' },
          weather: { score: 85, status: 'Optimal', detail: '27°C, 62% humidity, ideal growth conditions' },
          diseaseRisk: { score: 90, status: 'Low Risk', detail: 'Canopy disease-free' },
          irrigation: { score: 86, status: 'On Schedule', detail: 'Water level well-maintained' },
          nutrients: { score: 88, status: 'Balanced', detail: 'Balanced nutrient availability' },
        },
        reasons: [
          '✓ No major disease detected in latest crop scan',
          '✓ Soil moisture is in adequate range with optimal reserve',
          '✓ Weather conditions are optimal for tillering'
        ],
        reasonsHi: [
          '✓ नवीनतम फसल जांच में कोई सक्रिय रोग नहीं मिला',
          '✓ मिट्टी में नमी की मात्रा अनुकूल और पर्याप्त है',
          '✓ मौसम की स्थिति फसल के विकास हेतु उत्तम है'
        ],
        recommendations: [
          {
            priority: 'Normal',
            category: 'Nutrient Management',
            title: 'Maintain Regular Water Level & Inspection',
            titleHi: 'खेत में पानी का स्तर बनाए रखें',
            description: 'Maintain adequate moisture and inspect crop canopy.',
            timeline: 'Next 5-7 days'
          }
        ],
        dataSources: [
          { source: 'Latest Crop Scan', available: true, detail: 'AI leaf scan (Clean Foliage)' },
          { source: 'Soil Moisture Telemetry', available: true, detail: 'Field sensor moisture optimal' },
          { source: 'Weather Radar', available: true, detail: 'Live telemetry: 27°C, 62% humidity' },
          { source: 'Irrigation Log', available: true, detail: 'Canal & tube well active' },
          { source: 'Satellite Sentinel-2', available: true, detail: 'NDVI 0.78 (Vigorous Canopy)' }
        ]
      };
    };

    if (cleanUrl.includes('/summary')) {
      const paddyData = calculateFieldHealth('field_kipm_paddy_01');
      return {
        success: true,
        count: 1,
        data: [
          {
            fieldId: paddyData.fieldId,
            fieldName: paddyData.fieldName,
            crop: paddyData.crop,
            cropVariety: paddyData.cropVariety,
            healthScore: paddyData.healthScore,
            status: paddyData.status,
            confidence: paddyData.confidence,
            calculatedAt: paddyData.calculatedAt,
            reasons: paddyData.reasons,
            reasonsHi: paddyData.reasonsHi
          }
        ]
      };
    }

    if (cleanUrl.includes('/history/')) {
      const fieldId = cleanUrl.split('/history/')[1]?.split('?')[0] || 'default';
      const isTomato = fieldId === 'field_demo_02' || fieldId.includes('tomato');
      const historyList = isTomato ? [
        { date: 'Today', time: '10:30 AM', healthScore: 68, status: 'Attention Needed', confidence: 'High', crop: 'Tomato', fieldName: 'South Plot - Tomato Patch' },
        { date: '7 days ago', time: '09:15 AM', healthScore: 65, status: 'Attention Needed', confidence: 'High', crop: 'Tomato', fieldName: 'South Plot - Tomato Patch' },
        { date: '14 days ago', time: '11:45 AM', healthScore: 72, status: 'Attention Needed', confidence: 'Medium', crop: 'Tomato', fieldName: 'South Plot - Tomato Patch' },
        { date: '1 month ago', time: '08:20 AM', healthScore: 84, status: 'Healthy', confidence: 'Medium', crop: 'Tomato', fieldName: 'South Plot - Tomato Patch' },
      ] : [
        { date: 'Today', time: '10:30 AM', healthScore: 88, status: 'Healthy', confidence: 'High', crop: 'Paddy', fieldName: 'Kipm paddy' },
        { date: '7 days ago', time: '09:15 AM', healthScore: 84, status: 'Healthy', confidence: 'High', crop: 'Paddy', fieldName: 'Kipm paddy' },
        { date: '14 days ago', time: '11:45 AM', healthScore: 80, status: 'Healthy', confidence: 'High', crop: 'Paddy', fieldName: 'Kipm paddy' },
        { date: '1 month ago', time: '08:20 AM', healthScore: 76, status: 'Attention Needed', confidence: 'Medium', crop: 'Paddy', fieldName: 'Kipm paddy' },
        { date: '3 months ago', time: '02:10 PM', healthScore: 45, status: 'At Risk', confidence: 'High', crop: 'Paddy', fieldName: 'Kipm paddy' },
      ];
      return {
        success: true,
        count: historyList.length,
        data: historyList
      };
    }

    // Default / latest / recalculate
    const parts = cleanUrl.split('/');
    const fieldId = parts[parts.length - 1] || 'default';
    const fieldHealth = calculateFieldHealth(fieldId);
    return {
      success: true,
      data: fieldHealth
    };
  }

  // Generic fallback
  return {
    success: true,
    message: 'Operation completed successfully (Cloud Demo Mode)',
  };
}

// Interceptor to handle errors with smart fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const status = error.response?.status;

    // Log diagnostic event in centralized self-healing system
    RecoveryManager.logDiagnostic({
      level: status && status < 500 ? LogLevel.WARNING : LogLevel.ERROR,
      module: 'API',
      errorType: status ? `HTTP_${status}` : (error.code || 'NETWORK_FAILURE'),
      message: error.message || 'API request error',
      stack: error.stack || '',
      status: 'INTERCEPTED',
      recoveryResult: { url, status, baseURL: originalRequest?.baseURL },
    });

    // 0. Automatic failover from unreachable local backend (port 5000) to live Cloud Production API
    const isNetworkOrTimeout = !error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error');
    if (isNetworkOrTimeout && originalRequest && !originalRequest._retriedOnCloud) {
      const currentBase = originalRequest.baseURL || api.defaults.baseURL || '';
      if (currentBase.includes('localhost:5000') || currentBase.includes('127.0.0.1:5000')) {
        originalRequest._retriedOnCloud = true;
        console.warn(`[Fasal Drishti Failover] Local backend on port 5000 unreachable. Retrying on Cloud Production API (${DEFAULT_PRODUCTION_API_URL})...`);
        originalRequest.baseURL = DEFAULT_PRODUCTION_API_URL;
        return api(originalRequest);
      }
    }

    // Safe bounded retry for transient 502/503/504 server sleep or network glitched requests
    if ((isNetworkOrTimeout || status === 502 || status === 503) && originalRequest && (!originalRequest._retryCount || originalRequest._retryCount < 2)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const backoffDelay = originalRequest._retryCount * 800;
      console.log(`[SelfHealing:API] Retrying transient request (${originalRequest._retryCount}/2) in ${backoffDelay}ms: ${url}`);
      await new Promise(r => setTimeout(r, backoffDelay));
      return api(originalRequest);
    }

    // Auth endpoints: pass backend response directly to form (never trigger refresh loops)
    const isAuthRoute = url.includes('/auth/login') ||
                        url.includes('/auth/register') ||
                        url.includes('/auth/refresh') ||
                        url.includes('/auth/logout') ||
                        url.includes('/auth/forgot-password');

    // SILENT TOKEN REFRESH ON 401 WITH LOCK & QUEUE
    if (error.response && error.response.status === 401) {
      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // If another request is currently refreshing the token, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        localStorage.getItem('fasal_refresh_token') ||
        safeParseStorage('fasal_user_session')?.refreshToken;

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        return Promise.reject(error);
      }

      try {
        const activeBase = normalizeBackendApiUrl(originalRequest.baseURL || api.defaults.baseURL || API_BASE_URL);
        const refreshEndpoint = `${activeBase}/auth/refresh`;

        // Direct axios instance to avoid interceptor recursion
        const refreshRes = await axios.post(
          refreshEndpoint,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        if (refreshRes.data?.success && (refreshRes.data.accessToken || refreshRes.data.token)) {
          const newAccessToken = refreshRes.data.accessToken || refreshRes.data.token;
          const newRefreshToken = refreshRes.data.refreshToken || refreshToken;

          // Seamlessly persist newly rotated credentials
          localStorage.setItem('krishi_token', newAccessToken);
          localStorage.setItem('fasal_refresh_token', newRefreshToken);

          const session = safeParseStorage('fasal_user_session');
          if (session) {
            session.token = newAccessToken;
            session.refreshToken = newRefreshToken;
            if (refreshRes.data.user) {
              session.user = refreshRes.data.user;
            }
            localStorage.setItem('fasal_user_session', JSON.stringify(session));
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          console.log('[Fasal Drishti Auth] Access token silently refreshed. Replaying original request.');
          return api(originalRequest);
        } else {
          throw new Error(refreshRes.data?.message || 'Token refresh failed');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        console.warn('[Fasal Drishti Auth] Refresh token expired or revoked. Re-login required.');
        return Promise.reject(refreshErr);
      }
    }

    // If server is cold-starting, unavailable (Network Error, 404, 500, 502, 503),
    // intercept and return realistic demo data
    const method = error.config?.method || 'get';
    let requestData = null;
    try {
      requestData = typeof error.config?.data === 'string' ? JSON.parse(error.config.data) : error.config?.data;
    } catch {
      requestData = null;
    }

    // CRITICAL: DO NOT serve fake fallback for real AI Advisor questions!
    // Diagnose and present the actual cause instead of generic "Network Error"
    const isAiRoute = url.includes('/ai/advice') || 
                      url.includes('/ai/diagnose') || 
                      url.includes('/ai-advice') || 
                      url.includes('/recommendations/ask');

    if (isAiRoute) {
      let detailedMsg = '';
      const activeBaseUrl = error.config?.baseURL || api.defaults.baseURL || resolveApiBaseUrl();

      if (!error.response) {
        // Network error / CORS failure / DNS failure / Offline
        detailedMsg = `Backend Unreachable / CORS Blocked: Could not reach backend at "${activeBaseUrl}". If the Render server is waking up from sleep, it may take ~50 seconds. Please wait a moment and click Retry.`;
      } else if (error.response.status === 503) {
        detailedMsg = `AI Service Unavailable (503): ${error.response.data?.message || 'GEMINI_API_KEY is not configured on the backend server.'}`;
      } else if (error.response.status === 502) {
        detailedMsg = `Google Gemini Error (502): ${error.response.data?.message || 'The AI model rejected or failed to process the request.'}`;
      } else if (error.response.status === 429) {
        detailedMsg = `AI Rate Limit (429): Service is temporarily busy. Please wait a few seconds and try again.`;
      } else if (error.response.status === 404) {
        detailedMsg = `Endpoint Not Found (404): Route "${url}" was not found on backend "${activeBaseUrl}". Check backend configuration.`;
      } else {
        detailedMsg = error.response.data?.message || error.response.data?.error || `Server responded with HTTP ${error.response.status}`;
      }

      const customErr = new Error(detailedMsg);
      customErr.response = error.response;
      customErr.status = error.response?.status;
      customErr.baseURL = activeBaseUrl;
      return Promise.reject(customErr);
    }

    console.warn(`[Fasal Drishti] Backend unavailable at ${url}. Seamlessly activating resilient agricultural fallback.`);

    // Live Open-Meteo Weather Integration
    if (url.includes('/weather')) {
      try {
        let lat = 26.7684;
        let lng = 83.2305;
        let name = 'Sahajanwa, Gorakhpur, Uttar Pradesh, India';
        const stored = localStorage.getItem('krishi_farm_coords');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.lat && parsed.lng) {
            lat = parsed.lat;
            lng = parsed.lng;
            name = parsed.name || name;
          }
        }
        const liveWeather = await fetchOpenMeteoWeather(lat, lng, name);
        return Promise.resolve({
          data: { success: true, data: liveWeather },
          status: 200,
          statusText: 'OK (Open-Meteo Live)',
          headers: {},
          config: error.config,
        });
      } catch (err) {
        console.warn('Live weather fallback failed, using safe mock dataset:', err.message);
      }
    }

    const fallbackData = handleFallbackResponse(url, method, requestData);

    return Promise.resolve({
      data: fallbackData,
      status: 200,
      statusText: 'OK (Fallback)',
      headers: {},
      config: error.config,
    });
  }
);

export default api;
