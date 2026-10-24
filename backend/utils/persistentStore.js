const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database storage file path
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'fasal_drishti_persistent_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[PersistentStore] Error creating data directory:', err.message);
  }
}

/**
 * Normalizes any Indian mobile number into standard E.164 format: +91XXXXXXXXXX
 * Handles formats like: 9876543210, +91 98765 43210, 09876543210, +919876543210
 */
function normalizeToE164(phone) {
  if (!phone) return '';
  const tenDigit = to10DigitPhone(phone);
  return tenDigit.length === 10 ? `+91${tenDigit}` : '';
}

/**
 * Returns clean 10-digit phone string without country code
 * Strips all spaces, dashes, parentheses and +91 prefix
 */
function to10DigitPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
}

// Backward compatibility alias: returns clean 10-digit phone string
function normalizePhone(phone) {
  return to10DigitPhone(phone);
}


// Default benchmark demo accounts
const DEFAULT_DEMO_USERS = [
  {
    _id: 'usr_farmer_demo_01',
    id: 'usr_farmer_demo_01',
    name: 'Rameshwar Patil (रामेश्वर पाटिल)',
    phone: '9876543210',
    email: 'rameshwar.patil@krishidrishti.in',
    password: '', // demo account accepts demo bypass or password123
    role: 'farmer',
    isOnboarded: true,
    languagePreference: 'hi',
    isDemo: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    _id: 'usr_expert_demo_01',
    id: 'usr_expert_demo_01',
    name: 'Dr. Ananya Sharma (KVK Scientist)',
    phone: '9876500001',
    email: 'dr.ananya@kvk-agri.gov.in',
    password: '',
    role: 'expert',
    isOnboarded: true,
    languagePreference: 'en',
    isDemo: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    _id: 'usr_admin_demo_01',
    id: 'usr_admin_demo_01',
    name: 'Fasal Drishti Admin Officer',
    phone: '9876599999',
    email: 'admin@fasaldrishti.in',
    password: '',
    role: 'admin',
    isOnboarded: true,
    languagePreference: 'en',
    isDemo: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

const DEFAULT_DEMO_PROFILE = {
  userId: 'usr_farmer_demo_01',
  state: 'Uttar Pradesh',
  district: 'Gorakhpur',
  village: 'Sahajanwa',
  pincode: '273209',
  location: 'Sahajanwa, Gorakhpur, Uttar Pradesh, India',
  experienceYears: 12
};

const DEFAULT_DEMO_FARM = {
  _id: 'farm_demo_01',
  farmerId: 'usr_farmer_demo_01',
  farmName: 'Kipm paddy',
  name: 'Kipm paddy',
  farmSize: 3.85,
  totalArea: 3.85,
  landUnit: 'Acres',
  soilType: 'Alluvial Loam / बलुई दोमट मिट्टी',
  irrigationMethod: 'Tube Well & Canal',
  soilPh: 6.9,
  organicMatter: 'Medium (0.75%)',
  crop: 'Paddy',
  cropVariety: 'Pusa Basmati 1509',
  cropStage: 'Tillering Stage',
  location: 'Sahajanwa, Gorakhpur, Uttar Pradesh, India'
};

const DEFAULT_DEMO_CROPS = [
  {
    _id: 'crop_demo_01',
    farmId: 'farm_demo_01',
    farmerId: 'usr_farmer_demo_01',
    cropName: 'Paddy',
    variety: 'Pusa Basmati 1509',
    cropStage: 'Tillering Stage',
    plantingDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    healthStatus: 'Good',
    healthScore: 90,
    areaAllocated: 3.85,
    isCurrent: true
  }
];

const DEFAULT_KIPM_PADDY_FIELD = {
  _id: 'field_kipm_paddy_01',
  id: 'field_kipm_paddy_01',
  farmerId: 'usr_farmer_demo_01',
  fieldName: 'Kipm paddy',
  name: 'Kipm paddy',
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
  location: 'Sahajanwa, Gorakhpur, Uttar Pradesh, India',
  village: 'Sahajanwa',
  district: 'Gorakhpur',
  state: 'Uttar Pradesh',
  crop: 'Paddy',
  cropVariety: 'Pusa Basmati 1509',
  cropStage: 'Tillering Stage',
  season: 'Kharif',
  soilType: 'Alluvial Loam / बलुई दोमट मिट्टी',
  irrigationMethod: 'Tube Well & Canal',
  notes: 'KIPM Technical Campus GIDA Gorakhpur Paddy Block - High Yield Basmati Block',
  gpsStatus: 'GPS Connected & Verified',
  gpsAccuracy: 6,
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: new Date().toISOString()
};

let dbState = {
  users: [...DEFAULT_DEMO_USERS],
  profiles: { 'usr_farmer_demo_01': { ...DEFAULT_DEMO_PROFILE } },
  farms: { 'usr_farmer_demo_01': { ...DEFAULT_DEMO_FARM } },
  crops: { 'usr_farmer_demo_01': [...DEFAULT_DEMO_CROPS] },
  fields: { 'usr_farmer_demo_01': [{ ...DEFAULT_KIPM_PADDY_FIELD }] },
  actionPlans: [],
  alerts: [],
  cropScans: [],
  refreshTokens: [],
};

/**
 * Load database atomically from disk
 */
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        dbState = {
          users: parsed.users || [],
          profiles: parsed.profiles || {},
          farms: parsed.farms || {},
          crops: parsed.crops || {},
          fields: parsed.fields || {},
          actionPlans: parsed.actionPlans || [],
          alerts: parsed.alerts || [],
          cropScans: parsed.cropScans || [],
          refreshTokens: parsed.refreshTokens || [],
        };
        // Ensure default demo users always exist if missing
        DEFAULT_DEMO_USERS.forEach(demo => {
          if (!dbState.users.some(u => u.phone === demo.phone)) {
            dbState.users.unshift({ ...demo });
          }
        });
        if (!dbState.profiles['usr_farmer_demo_01']) {
          dbState.profiles['usr_farmer_demo_01'] = { ...DEFAULT_DEMO_PROFILE };
        }
        if (!dbState.farms['usr_farmer_demo_01']) {
          dbState.farms['usr_farmer_demo_01'] = { ...DEFAULT_DEMO_FARM };
        }
        if (!dbState.crops['usr_farmer_demo_01'] || dbState.crops['usr_farmer_demo_01'].length === 0) {
          dbState.crops['usr_farmer_demo_01'] = [...DEFAULT_DEMO_CROPS];
        }
        if (!dbState.fields['usr_farmer_demo_01'] || dbState.fields['usr_farmer_demo_01'].length === 0) {
          dbState.fields['usr_farmer_demo_01'] = [{ ...DEFAULT_KIPM_PADDY_FIELD }];
        } else if (!dbState.fields['usr_farmer_demo_01'].some(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm'))) {
          dbState.fields['usr_farmer_demo_01'].unshift({ ...DEFAULT_KIPM_PADDY_FIELD });
        }
        console.log(`[PersistentStore] Successfully loaded persistent database. Total users: ${dbState.users.length}`);
        return;
      }
    }
  } catch (err) {
    console.error('[PersistentStore] Error loading DB from disk, initializing fresh:', err.message);
  }

  // Initialize file if not found
  persistDatabase();
}

/**
 * Persist database to disk using atomic temporary file write and rename
 */
function persistDatabase() {
  try {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(dbState, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[PersistentStore] Error persisting database to disk:', err.message);
    try {
      // Direct fallback
      fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
    } catch (directErr) {
      console.error('[PersistentStore] Direct write error:', directErr.message);
    }
  }
}

// Initial load
loadDatabase();

const persistentStore = {
  normalizePhone,
  normalizeToE164,
  to10DigitPhone,

  // Reload from disk (useful for testing or multi-process sync)

  reload: loadDatabase,

  // Force sync to disk
  save: persistDatabase,

  // User queries
  getAllUsers() {
    return [...dbState.users];
  },

  getUserById(id) {
    if (!id) return null;
    const user = dbState.users.find(u => u._id === id || u.id === id);
    if (user) return { ...user };
    if (typeof id === 'string') {
      if (id === 'usr_farmer_demo_01' || id.includes('farmer_demo')) return { ...dbState.users.find(u => u.phone === '9876543210') };
      if (id === 'usr_expert_demo_01' || id.includes('expert_demo')) return { ...dbState.users.find(u => u.phone === '9876500001') };
      if (id === 'usr_admin_demo_01' || id.includes('admin_demo')) return { ...dbState.users.find(u => u.phone === '9876599999') };
    }
    return null;
  },

  getUserByPhone(phone) {
    if (!phone) return null;
    const cleanInput = String(phone).replace(/\D/g, '').slice(-10);
    if (!cleanInput || cleanInput.length !== 10) return null;

    const user = dbState.users.find(u => {
      if (!u || !u.phone) return false;
      const uClean = String(u.phone).replace(/\D/g, '').slice(-10);
      return uClean === cleanInput;
    });
    return user ? { ...user } : null;
  },

  getUserByEmail(email) {
    if (!email) return null;
    const clean = String(email).trim().toLowerCase();
    const user = dbState.users.find(u => u.email && u.email.toLowerCase() === clean);
    return user ? { ...user } : null;
  },

  getUserByRole(role = 'farmer') {
    const normalized = String(role || 'farmer').toLowerCase();
    const user = dbState.users.find(u => u.role === normalized && u.isDemo !== false) || dbState.users[0];
    return { ...user };
  },

  /**
   * Register a new user permanently
   */
  registerUser(userData) {
    const cleanPhone = String(userData.phone).replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      const err = new Error('Please enter a valid 10-digit mobile number.');
      err.code = 'INVALID_PHONE';
      throw err;
    }

    const existingUser = this.getUserByPhone(cleanPhone);
    if (existingUser) {
      const err = new Error('This mobile number is already registered. Please login instead.');
      err.code = 'PHONE_EXISTS';
      throw err;
    }

    if (userData.email && userData.email.trim()) {
      const existingEmail = this.getUserByEmail(userData.email);
      if (existingEmail) {
        const err = new Error('This email is already registered.');
        err.code = 'EMAIL_EXISTS';
        throw err;
      }
    }

    const newId = userData._id || userData.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const effectiveCrop = userData.mainCrop || userData.crop || '';
    const e164Phone = `+91${cleanPhone}`;

    const newUser = {
      _id: newId,
      id: newId,
      name: (userData.name || '').trim(),
      phone: e164Phone,
      cleanPhone: cleanPhone,
      email: userData.email ? userData.email.trim() : '',
      password: userData.password, // securely hashed before passing or in controller
      role: userData.role || 'farmer',
      isOnboarded: !!(userData.state && effectiveCrop),
      languagePreference: userData.languagePreference || 'hi',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    dbState.users.push(newUser);


    if (newUser.role === 'farmer') {
      const locationString = (userData.village && userData.district)
        ? `${userData.village}, ${userData.district}, ${userData.state || ''}`.replace(/, $/, '')
        : (userData.state || '');

      dbState.profiles[newId] = {
        userId: newId,
        state: userData.state || '',
        district: userData.district || '',
        village: userData.village || '',
        location: locationString,
        experienceYears: 0,
      };

      dbState.farms[newId] = {
        _id: `farm_${newId}`,
        farmerId: newId,
        farmName: userData.farmName || `${userData.name.trim()}'s Farm`,
        farmSize: Number(userData.farmSize) || 0,
        landUnit: userData.landUnit || 'Acres',
        soilType: userData.soilType || '',
        irrigationMethod: userData.irrigationMethod || '',
      };

      if (effectiveCrop) {
        dbState.crops[newId] = [
          {
            _id: `crop_${newId}_01`,
            farmId: `farm_${newId}`,
            farmerId: newId,
            cropName: effectiveCrop,
            variety: 'High Yield Standard',
            cropStage: 'Vegetative Stage',
            healthStatus: 'Good',
            healthScore: 88,
            areaAllocated: Number(userData.farmSize) || 0,
            isCurrent: true,
            createdAt: new Date().toISOString(),
          }
        ];
      } else {
        dbState.crops[newId] = [];
      }

      // Welcome Alert
      dbState.alerts.unshift({
        _id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userId: newId,
        title: 'Welcome to Fasal Drishti! 🌱',
        titleHi: 'फ़सल दृष्टि में आपका स्वागत है! 🌱',
        message: 'Your smart farming companion is active. Scan your crop or ask AI advice anytime.',
        messageHi: 'आपका स्मार्ट कृषि साथी सक्रिय है। अपनी फसल की जांच करें या AI सलाह लें।',
        priority: 'low',
        category: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    persistDatabase();
    return { ...newUser };
  },

  updateUser(id, updates = {}) {
    if (!id) return null;
    const user = dbState.users.find(u => u._id === id || u.id === id);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      persistDatabase();
      return { ...user };
    }
    return null;
  },

  // Farmer Profiles
  getProfile(userId) {
    if (!userId) return null;
    return dbState.profiles[userId] ? { ...dbState.profiles[userId] } : null;
  },

  saveProfile(userId, profileData) {
    if (!userId) return null;
    const current = dbState.profiles[userId] || { userId };
    const updated = {
      ...current,
      ...profileData,
      userId,
      updatedAt: new Date().toISOString(),
    };
    dbState.profiles[userId] = updated;
    persistDatabase();
    return { ...updated };
  },

  // Farms
  getFarm(farmerId) {
    if (!farmerId) return null;
    return dbState.farms[farmerId] ? { ...dbState.farms[farmerId] } : null;
  },

  saveFarm(farmerId, farmData) {
    if (!farmerId) return null;
    const current = dbState.farms[farmerId] || { farmerId, _id: `farm_${farmerId}` };
    const updated = {
      ...current,
      ...farmData,
      farmerId,
      updatedAt: new Date().toISOString(),
    };
    dbState.farms[farmerId] = updated;
    persistDatabase();
    return { ...updated };
  },

  // -------------------------------------------------------------
  // FIELDS & GPS BOUNDARY MAPPINGS (PERMANENT MULTI-FARM STORAGE)
  // -------------------------------------------------------------
  getFields(farmerId) {
    if (!dbState.fields) dbState.fields = {};
    const targetId = farmerId || 'usr_farmer_demo_01';
    let userFields = dbState.fields[targetId] || [];
    
    // Always guarantee KIPM Paddy Farm is available for real farmers so it never disappears
    if (!targetId.startsWith('user_test_')) {
      if (!userFields.some(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm') || f.name?.toLowerCase().includes('kipm'))) {
        userFields = [{ ...DEFAULT_KIPM_PADDY_FIELD, farmerId: targetId }, ...userFields];
        dbState.fields[targetId] = userFields;
        persistDatabase();
      }
    }
    return userFields.map(f => ({ ...f }));
  },

  getFieldById(farmerId, fieldId) {
    if (!fieldId) return null;
    if (fieldId === 'field_kipm_paddy_01') {
      return { ...DEFAULT_KIPM_PADDY_FIELD, farmerId: farmerId || 'usr_farmer_demo_01' };
    }
    const fields = this.getFields(farmerId);
    return fields.find(f => f.id === fieldId || f._id === fieldId) || null;
  },

  saveField(farmerId, fieldData) {
    if (!farmerId) throw new Error('farmerId is required to save field');
    if (!dbState.fields) dbState.fields = {};
    if (!dbState.fields[farmerId]) {
      dbState.fields[farmerId] = [];
    }

    const fieldId = fieldData.id || fieldData._id || fieldData.field_id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const points = fieldData.boundary || fieldData.points || [];

    const fieldRecord = {
      ...fieldData,
      _id: fieldId,
      id: fieldId,
      farmerId,
      fieldName: fieldData.fieldName || fieldData.name || 'Primary Farm',
      name: fieldData.name || fieldData.fieldName || 'Primary Farm',
      farmerName: fieldData.farmerName || '',
      points,
      boundary: points,
      cornersCount: points.length,
      areaAcres: Number(fieldData.areaAcres) || 0,
      areaHectares: Number(fieldData.areaHectares) || 0,
      areaSqMeters: Number(fieldData.areaSqMeters) || 0,
      formattedAcres: fieldData.formattedAcres || `${Number(fieldData.areaAcres || 0).toFixed(2)} acres`,
      formattedHectares: fieldData.formattedHectares || `${Number(fieldData.areaHectares || 0).toFixed(2)} hectares`,
      perimeterMeters: Number(fieldData.perimeterMeters) || 0,
      formattedPerimeter: fieldData.formattedPerimeter || '',
      center: fieldData.center || (points.length > 0 ? { lat: points[0].lat, lng: points[0].lng } : { lat: 20.174, lng: 73.985 }),
      latitude: fieldData.latitude || (fieldData.center?.lat) || (points[0]?.lat),
      longitude: fieldData.longitude || (fieldData.center?.lng) || (points[0]?.lng),
      crop: fieldData.crop || 'Wheat',
      cropVariety: fieldData.cropVariety || 'Standard Variety',
      season: fieldData.season || 'Rabi',
      soilType: fieldData.soilType || 'Black Soil / Regur',
      irrigationMethod: fieldData.irrigationMethod || 'Drip Irrigation',
      notes: fieldData.notes || '',
      gpsStatus: fieldData.gpsStatus || 'GPS Connected',
      gpsAccuracy: fieldData.gpsAccuracy || 15,
      createdAt: fieldData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = dbState.fields[farmerId].findIndex(f => f.id === fieldId || f._id === fieldId);
    if (idx >= 0) {
      dbState.fields[farmerId][idx] = fieldRecord;
    } else {
      dbState.fields[farmerId].unshift(fieldRecord);
    }

    persistDatabase();
    return { ...fieldRecord };
  },

  deleteField(farmerId, fieldId) {
    if (!farmerId || !dbState.fields || !dbState.fields[farmerId]) return [];
    dbState.fields[farmerId] = dbState.fields[farmerId].filter(f => f.id !== fieldId && f._id !== fieldId);
    persistDatabase();
    return [...dbState.fields[farmerId]];
  },

  updateUserPassword(phoneOrId, newHashedPassword) {
    const cleanPhone = String(phoneOrId).replace(/\D/g, '').slice(-10);
    const user = dbState.users.find(u => {
      if (!u) return false;
      if (cleanPhone && cleanPhone.length === 10) {
        const uClean = String(u.phone).replace(/\D/g, '').slice(-10);
        if (uClean === cleanPhone) return true;
      }
      return String(u._id) === String(phoneOrId) || String(u.id) === String(phoneOrId);
    });
    if (!user) return null;
    user.password = newHashedPassword;
    user.updatedAt = new Date().toISOString();
    persistDatabase();
    return { ...user };
  },

  updateUserLastLogin(id) {
    const user = dbState.users.find(u => u._id === id || u.id === id);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      persistDatabase();
    }
  },

  // -------------------------------------------------------------
  // REFRESH TOKENS & PERSISTENT SESSION MANAGEMENT
  // -------------------------------------------------------------
  saveRefreshToken(userId, tokenString, expiresAt, rememberMe = true) {
    if (!userId || !tokenString) return null;
    if (!Array.isArray(dbState.refreshTokens)) dbState.refreshTokens = [];

    const now = new Date();
    // Prune expired tokens across the database
    dbState.refreshTokens = dbState.refreshTokens.filter(rt => {
      if (!rt || !rt.expiresAt) return false;
      return new Date(rt.expiresAt) > now;
    });

    const sessionRecord = {
      tokenId: `rt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: String(userId),
      token: tokenString,
      expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : new Date(expiresAt).toISOString(),
      rememberMe: Boolean(rememberMe),
      createdAt: now.toISOString()
    };

    dbState.refreshTokens.push(sessionRecord);
    persistDatabase();
    return sessionRecord;
  },

  getRefreshToken(tokenString) {
    if (!tokenString || !Array.isArray(dbState.refreshTokens)) return null;
    const now = new Date();
    const record = dbState.refreshTokens.find(rt => rt && rt.token === tokenString);
    if (!record) return null;
    if (new Date(record.expiresAt) <= now) {
      this.revokeRefreshToken(tokenString);
      return null;
    }
    return { ...record };
  },

  revokeRefreshToken(tokenString) {
    if (!tokenString || !Array.isArray(dbState.refreshTokens)) return false;
    const initialLen = dbState.refreshTokens.length;
    dbState.refreshTokens = dbState.refreshTokens.filter(rt => rt && rt.token !== tokenString);
    if (dbState.refreshTokens.length !== initialLen) {
      persistDatabase();
      return true;
    }
    return false;
  },

  revokeAllUserRefreshTokens(userId) {
    if (!userId || !Array.isArray(dbState.refreshTokens)) return false;
    const target = String(userId);
    const initialLen = dbState.refreshTokens.length;
    dbState.refreshTokens = dbState.refreshTokens.filter(rt => rt && rt.userId !== target);
    if (dbState.refreshTokens.length !== initialLen) {
      persistDatabase();
      return true;
    }
    return false;
  },

  // Crops
  getCrops(farmerId) {
    if (!farmerId) return [];
    if (farmerId === 'usr_farmer_demo_01') {
      return [...(dbState.crops['usr_farmer_demo_01'] || DEFAULT_DEMO_CROPS)];
    }
    return dbState.crops[farmerId] ? [...dbState.crops[farmerId]] : [];
  },

  addCrop(farmerId, cropData) {
    if (!farmerId) return null;
    if (!dbState.crops[farmerId]) {
      dbState.crops[farmerId] = [];
    }
    const newCrop = {
      _id: `crop_${farmerId}_${Date.now()}`,
      farmId: dbState.farms[farmerId]?._id || `farm_${farmerId}`,
      farmerId,
      cropName: cropData.cropName || 'General Crop',
      variety: cropData.variety || 'Standard Hybrid',
      cropStage: cropData.cropStage || 'Vegetative Stage',
      healthStatus: cropData.healthStatus || 'Good',
      healthScore: cropData.healthScore || 85,
      areaAllocated: Number(cropData.areaAllocated) || 1.0,
      isCurrent: dbState.crops[farmerId].length === 0 ? true : !!cropData.isCurrent,
      createdAt: new Date().toISOString(),
    };
    if (newCrop.isCurrent) {
      dbState.crops[farmerId].forEach(c => c.isCurrent = false);
    }
    dbState.crops[farmerId].push(newCrop);
    persistDatabase();
    return { ...newCrop };
  },

  deleteCrop(cropId, farmerId) {
    if (!farmerId || !dbState.crops[farmerId]) return [];
    dbState.crops[farmerId] = dbState.crops[farmerId].filter(c => c._id !== cropId && c.id !== cropId);
    persistDatabase();
    return [...dbState.crops[farmerId]];
  },

  // Alerts
  getAlerts(userId) {
    if (!userId) return [];
    return dbState.alerts.filter(a => a.userId === userId);
  },

  addAlert(alertData) {
    const alert = {
      _id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...alertData,
    };
    dbState.alerts.unshift(alert);
    persistDatabase();
    return { ...alert };
  },

  // Action Plans
  getActionPlans(farmerId) {
    const userPlans = farmerId
      ? dbState.actionPlans.filter(t => t.farmerId === farmerId)
      : dbState.actionPlans.filter(t => t.farmerId === 'usr_farmer_demo_01');
    const completed = userPlans.filter(t => t.isCompleted).length;
    const total = userPlans.length;
    return {
      tasks: [...userPlans],
      stats: {
        total,
        completed,
        pending: total - completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 100,
      },
    };
  },

  toggleActionPlan(taskId) {
    const task = dbState.actionPlans.find(t => t._id === taskId);
    if (task) {
      task.isCompleted = !task.isCompleted;
      persistDatabase();
      return { ...task };
    }
    return null;
  },

  // Isolated Dashboard for user
  getDashboardForUser(userId) {
    if (!userId) return null;
    const user = this.getUserById(userId);
    if (!user) return null;

    const profile = this.getProfile(userId);
    const farm = this.getFarm(userId);
    const userFields = this.getFields(userId);

    let resolvedFarm = farm;
    if (userFields && userFields.length > 0) {
      const primary = userFields[0];
      resolvedFarm = {
        _id: primary.id || primary._id,
        id: primary.id || primary._id,
        farmerId: userId,
        farmName: primary.fieldName || primary.name || farm?.farmName || 'Kipm paddy',
        name: primary.fieldName || primary.name || farm?.farmName || 'Kipm paddy',
        farmSize: Number(primary.farmArea || primary.areaAcres || farm?.farmSize) || 3.85,
        totalArea: Number(primary.farmArea || primary.areaAcres || farm?.farmSize) || 3.85,
        landUnit: 'Acres',
        soilType: primary.soilType || farm?.soilType || 'Alluvial Loam / बलुई दोमट मिट्टी',
        irrigationMethod: primary.irrigationMethod || farm?.irrigationMethod || 'Tube Well & Canal',
        latitude: primary.latitude || primary.center?.lat || 26.7683,
        longitude: primary.longitude || primary.center?.lng || 83.2303,
        center: primary.center || { lat: 26.7683, lng: 83.2303 },
        boundary: primary.boundary || primary.points || [],
        points: primary.points || primary.boundary || [],
        crop: primary.crop || 'Paddy',
        cropVariety: primary.cropVariety || 'Pusa Basmati 1509',
        cropStage: primary.cropStage || 'Tillering Stage',
      };
    }

    const userCrops = this.getCrops(userId);
    if (userCrops.length === 0 && resolvedFarm?.crop) {
      userCrops.push({
        _id: `crop_${userId}_01`,
        farmId: resolvedFarm._id,
        farmerId: userId,
        cropName: resolvedFarm.crop,
        variety: resolvedFarm.cropVariety || 'Pusa Basmati 1509',
        cropStage: resolvedFarm.cropStage || 'Tillering Stage',
        healthStatus: 'Good',
        healthScore: 88,
        areaAllocated: Number(resolvedFarm.farmSize) || 3.85,
        isCurrent: true,
      });
    }

    const currentCrop = userCrops.find(c => c.isCurrent) || userCrops[0] || null;
    const userTasks = dbState.actionPlans.filter(p => p.farmerId === userId);
    const userScans = dbState.cropScans.filter(s => s.farmerId === userId);
    const userAlerts = dbState.alerts.filter(a => a.userId === userId);

    return {
      farmer: {
        id: user._id,
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
      },
      profile,
      farm: resolvedFarm,
      fields: userFields,
      crops: userCrops,
      currentCrop,
      healthScore: currentCrop ? (currentCrop.healthScore || 88) : 85,
      pendingTasks: userTasks.filter(p => !p.isCompleted),
      recentAnalyses: userScans.slice(0, 5),
      recentRecommendations: [],
      unreadAlerts: userAlerts.filter(a => !a.isRead),
    };
  },

  // Scans
  addCropScan(scanData) {
    const scan = {
      _id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      ...scanData,
    };
    dbState.cropScans.unshift(scan);
    persistDatabase();
    return { ...scan };
  },

  getCropScans(farmerId) {
    if (!farmerId) return [];
    return dbState.cropScans.filter(s => s.farmerId === farmerId);
  },
  DEFAULT_KIPM_PADDY_FIELD
};

module.exports = persistentStore;
