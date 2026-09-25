const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Alert = require('../models/Alert');
const persistentStore = require('../utils/persistentStore');
const { normalizePhone } = persistentStore;
const {
  isDbConnected,
  getStatelessUserByRole,
  getStatelessUserByPhone,
  getStatelessUserByEmail,
  getStatelessUserById,
  registerStatelessUser,
  getStatelessDashboard,
  getStatelessDashboardForUser,
  getStatelessProfile,
  getStatelessFarm,
  getStatelessCrops,
} = require('../utils/statelessStore');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'krishi_drishti_secret_key_2026_smart_farming', {
    expiresIn: '30d',
  });
};

// @desc Register a new user (Farmer by default)
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, phone, email, password, role = 'farmer', state, district, village, farmSize, mainCrop, soilType, irrigationMethod } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'Please provide name, phone number, and password.' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' });
    }

    // 1. Strict duplicate check in persistent store
    const existingInStore = persistentStore.getUserByPhone(cleanPhone);
    if (existingInStore) {
      return res.status(400).json({
        success: false,
        code: 'PHONE_EXISTS',
        message: 'This mobile number is already registered. Please login instead.',
      });
    }

    if (email && email.trim()) {
      const existingEmailInStore = persistentStore.getUserByEmail(email.trim());
      if (existingEmailInStore) {
        return res.status(400).json({
          success: false,
          code: 'EMAIL_EXISTS',
          message: 'This email is already registered.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const effectiveCrop = mainCrop || req.body.crop || '';

    let user = null;

    // 2. If MongoDB is connected, save to MongoDB
    if (isDbConnected()) {
      try {
        const userExists = await User.findOne({ phone: cleanPhone });
        if (userExists) {
          return res.status(400).json({
            success: false,
            code: 'PHONE_EXISTS',
            message: 'This mobile number is already registered. Please login instead.',
          });
        }

        if (email && email.trim()) {
          const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
          if (emailExists) {
            return res.status(400).json({ success: false, code: 'EMAIL_EXISTS', message: 'This email is already registered.' });
          }
        }

        user = await User.create({
          name: name.trim(),
          phone: cleanPhone,
          email: email ? email.trim() : '',
          password: hashedPassword,
          role: role || 'farmer',
          isOnboarded: !!(state && effectiveCrop),
        });

        if (user.role === 'farmer') {
          const locationString = (village && district) 
            ? `${village}, ${district}, ${state || ''}`.replace(/, $/, '') 
            : (state || '');

          await FarmerProfile.create({
            userId: user._id,
            state: state || '',
            district: district || '',
            village: village || '',
            location: locationString,
          });

          const farm = await Farm.create({
            farmerId: user._id,
            farmName: `${name.trim()}'s Farm`,
            farmSize: Number(farmSize) || 0,
            landUnit: 'Acres',
            soilType: soilType || '',
            irrigationMethod: irrigationMethod || '',
          });

          if (effectiveCrop) {
            await Crop.create({
              farmId: farm._id,
              farmerId: user._id,
              cropName: effectiveCrop,
              variety: 'High Yield Standard',
              cropStage: 'Vegetative Stage',
              healthStatus: 'Good',
              areaAllocated: Number(farmSize) || 0,
              isCurrent: true,
            });
          }

          await Alert.create({
            userId: user._id,
            title: 'Welcome to Fasal Drishti! 🌱',
            titleHi: 'फ़सल दृष्टि में आपका स्वागत है! 🌱',
            message: 'Your smart farming companion is active. Scan your crop or ask AI advice anytime.',
            messageHi: 'आपका स्मार्ट कृषि साथी सक्रिय है। अपनी फसल की जांच करें या AI सलाह लें।',
            priority: 'low',
            category: 'system',
          });
        }
      } catch (mongoErr) {
        console.warn('[Register] MongoDB creation error, proceeding with persistent disk store:', mongoErr.message);
      }
    }

    // 3. Always mirror to persistent disk store for guaranteed zero-loss across server restarts
    try {
      const storeUser = persistentStore.registerUser({
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : '',
        password: hashedPassword,
        role: role || 'farmer',
        state: state || '',
        district: district || '',
        village: village || '',
        farmSize: farmSize ? Number(farmSize) : 0,
        mainCrop: effectiveCrop,
        soilType: soilType || '',
        irrigationMethod: irrigationMethod || '',
      });

      if (!user) {
        user = storeUser;
      }
    } catch (storeErr) {
      if (storeErr.code === 'PHONE_EXISTS') {
        return res.status(400).json({
          success: false,
          code: 'PHONE_EXISTS',
          message: 'This mobile number is already registered. Please login instead.',
        });
      }
      if (storeErr.code === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          code: 'EMAIL_EXISTS',
          message: 'This email is already registered.',
        });
      }
      throw storeErr;
    }


    const userId = user._id || user.id;
    const token = generateToken(userId);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        _id: userId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        languagePreference: user.languagePreference || 'hi',
      },
    });
  } catch (error) {
    console.error('Register error:', error.stack || error.message);
    const clientMessage = error.message || 'Registration failed. Please try again.';

    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: clientMessage,
    });
  }
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, code: 'MISSING_CREDENTIALS', message: 'Please provide phone number and password.' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' });
    }

    let user = null;

    // 1. Try finding in MongoDB if connected
    if (isDbConnected()) {
      try {
        user = await User.findOne({ phone: cleanPhone });
      } catch (mongoErr) {
        console.warn('[Login] MongoDB query warning, continuing with persistent store:', mongoErr.message);
      }
    }

    // 2. Fall back to persistent disk store
    if (!user) {
      user = persistentStore.getUserByPhone(cleanPhone);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this mobile number. Please register.',
      });
    }

    // 3. Verify password
    let isMatch = false;
    if (user.password) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (_) {
        isMatch = user.password === password;
      }
    } else if (password === 'password123' && user.isDemo !== false) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'WRONG_PASSWORD',
        message: 'Incorrect mobile number or password.',
      });
    }

    const userId = user._id || user.id;
    const token = generateToken(userId);

    return res.json({
      success: true,
      token,
      user: {
        id: userId,
        _id: userId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        languagePreference: user.languagePreference || 'hi',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Server error during authentication.',
    });
  }
};

// @desc 1-Click Demo Login for quick persona testing
// @route POST /api/auth/demo-login
const demoLogin = async (req, res) => {
  try {
    const { role = 'farmer' } = req.body || {};

    if (!isDbConnected()) {
      const user = getStatelessUserByRole(role);
      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isOnboarded: user.isOnboarded,
          languagePreference: user.languagePreference,
        },
      });
    }

    let targetPhone = '9876543210'; // Default demo farmer
    if (role === 'expert') {
      targetPhone = '9876500001';
    } else if (role === 'admin') {
      targetPhone = '9876599999';
    }

    let user = await User.findOne({ phone: targetPhone });

    // If user not yet seeded, seed user on demand
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      if (role === 'farmer') {
        user = await User.create({
          name: 'Rameshwar Patil (रामेश्वर पाटिल)',
          phone: '9876543210',
          email: 'rameshwar.farmer@krishidrishti.in',
          password: hashedPassword,
          role: 'farmer',
          isOnboarded: true,
          languagePreference: 'en',
        });

        await FarmerProfile.create({
          userId: user._id,
          state: 'Maharashtra',
          district: 'Nashik',
          village: 'Pimpalgaon Baswant',
          pincode: '422209',
        });

        const farm = await Farm.create({
          farmerId: user._id,
          farmName: 'Shri Ganesha Krishi Farm',
          farmSize: 5.0,
          landUnit: 'Acres',
          soilType: 'Black Soil / Regur',
          irrigationMethod: 'Drip Irrigation',
        });

        await Crop.create({
          farmId: farm._id,
          farmerId: user._id,
          cropName: 'Tomato',
          variety: 'Abhinav Hybrid',
          cropStage: 'Flowering Stage',
          healthStatus: 'Good',
          healthScore: 91,
          areaAllocated: 3.0,
          isCurrent: true,
        });

        await Crop.create({
          farmId: farm._id,
          farmerId: user._id,
          cropName: 'Onion',
          variety: 'Fursungi Red',
          cropStage: 'Vegetative Stage',
          healthStatus: 'Excellent',
          healthScore: 95,
          areaAllocated: 2.0,
          isCurrent: false,
        });
      } else if (role === 'expert') {
        user = await User.create({
          name: 'Dr. Ananya Sharma (KVK Scientist)',
          phone: '9876500001',
          email: 'dr.ananya@kvk-agri.gov.in',
          password: hashedPassword,
          role: 'expert',
          isOnboarded: true,
          languagePreference: 'en',
        });
      } else if (role === 'admin') {
        user = await User.create({
          name: 'Fasal Drishti Admin Officer',
          phone: '9876599999',
          email: 'admin@fasaldrishti.in',
          password: hashedPassword,
          role: 'admin',
          isOnboarded: true,
          languagePreference: 'en',
        });
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        languagePreference: user.languagePreference,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    const fallbackUser = getStatelessUserByRole(req.body?.role || 'farmer');
    const token = generateToken(fallbackUser._id);
    res.json({
      success: true,
      token,
      user: fallbackUser,
    });
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (!isDbConnected()) {
      const data = persistentStore.getDashboardForUser(userId) || getStatelessDashboardForUser(userId);
      return res.json({
        success: true,
        user: req.user,
        profile: data?.profile || null,
        farm: data?.farm || null,
        currentCrop: data?.currentCrop || null,
      });
    }

    let user = null;
    let profile = null;
    let farm = null;
    let currentCrop = null;

    try {
      user = await User.findById(userId).select('-password');
      if (user && user.role === 'farmer') {
        profile = await FarmerProfile.findOne({ userId });
        farm = await Farm.findOne({ farmerId: userId });
        currentCrop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      }
    } catch (dbErr) {
      console.warn('getMe MongoDB warning:', dbErr.message);
    }

    // Resilient fallback to persistentStore if MongoDB record not populated
    if (!profile || !farm) {
      const storeData = persistentStore.getDashboardForUser(userId);
      if (storeData) {
        if (!profile) profile = storeData.profile;
        if (!farm) farm = storeData.farm;
        if (!currentCrop) currentCrop = storeData.currentCrop;
      }
    }

    res.json({
      success: true,
      user: user || req.user,
      profile,
      farm,
      currentCrop,
    });
  } catch (error) {
    console.error('getMe error:', error);
    const storeData = persistentStore.getDashboardForUser(req.user?._id || req.user?.id);
    res.json({
      success: true,
      user: req.user,
      profile: storeData?.profile || null,
      farm: storeData?.farm || null,
      currentCrop: storeData?.currentCrop || null,
    });
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getMe,
};
