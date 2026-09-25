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
 * Normalizes any Indian mobile number into a clean 10-digit string
 * Handles formats like: +919876543210, +91 98765 43210, 09876543210, 98765-43210
 */
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.substring(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.substring(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
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
  state: 'Maharashtra',
  district: 'Nashik',
  village: 'Pimpalgaon Baswant',
  pincode: '422209',
  location: 'Pimpalgaon Baswant, Nashik, Maharashtra',
  experienceYears: 14
};

const DEFAULT_DEMO_FARM = {
  _id: 'farm_demo_01',
  farmerId: 'usr_farmer_demo_01',
  farmName: 'Shri Ganesha Krishi Farm',
  farmSize: 5.5,
  landUnit: 'Acres',
  soilType: 'Black Soil / Regur',
  irrigationMethod: 'Drip Irrigation',
  soilPh: 6.9,
  organicMatter: 'Medium (0.75%)'
};

const DEFAULT_DEMO_CROPS = [
  {
    _id: 'crop_demo_01',
    farmId: 'farm_demo_01',
    farmerId: 'usr_farmer_demo_01',
    cropName: 'Tomato',
    variety: 'Abhinav Hybrid (Syngenta)',
    cropStage: 'Flowering Stage',
    plantingDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    healthStatus: 'Good',
    healthScore: 91,
    areaAllocated: 3.5,
    isCurrent: true
  },
  {
    _id: 'crop_demo_02',
    farmId: 'farm_demo_01',
    farmerId: 'usr_farmer_demo_01',
    cropName: 'Onion',
    variety: 'Fursungi Red',
    cropStage: 'Vegetative Stage',
    plantingDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    healthStatus: 'Excellent',
    healthScore: 95,
    areaAllocated: 2.0,
    isCurrent: false
  }
];

let dbState = {
  users: [...DEFAULT_DEMO_USERS],
  profiles: { 'usr_farmer_demo_01': { ...DEFAULT_DEMO_PROFILE } },
  farms: { 'usr_farmer_demo_01': { ...DEFAULT_DEMO_FARM } },
  crops: { 'usr_farmer_demo_01': [...DEFAULT_DEMO_CROPS] },
  actionPlans: [],
  alerts: [],
  cropScans: [],
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
          actionPlans: parsed.actionPlans || [],
          alerts: parsed.alerts || [],
          cropScans: parsed.cropScans || [],
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
    const normalized = normalizePhone(phone);
    const user = dbState.users.find(u => normalizePhone(u.phone) === normalized);
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
    const cleanPhone = normalizePhone(userData.phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      const err = new Error('Please enter a valid 10-digit mobile number.');
      err.code = 'INVALID_PHONE';
      throw err;
    }

    const existingUser = this.getUserByPhone(cleanPhone);
    if (existingUser) {
      const err = new Error('This mobile number is already registered. Please login.');
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

    const newId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const effectiveCrop = userData.mainCrop || userData.crop || '';

    const newUser = {
      _id: newId,
      id: newId,
      name: (userData.name || '').trim(),
      phone: cleanPhone,
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
    const userCrops = this.getCrops(userId);
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
      farm,
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
  }
};

module.exports = persistentStore;
