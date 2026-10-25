const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Alert = require('../models/Alert');
const persistentStore = require('../utils/persistentStore');
const otpService = require('../services/otpService');
const { normalizePhone, normalizeToE164, to10DigitPhone } = persistentStore;
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

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'krishi_drishti_secret_key_2026_smart_farming';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'krishi_drishti_refresh_secret_key_2026_persistent';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15m access token with transparent silent rotation
const REFRESH_TOKEN_EXPIRY_LONG = '365d'; // 365 days persistent session for Remember Me
const REFRESH_TOKEN_EXPIRY_SHORT = '30d'; // 30 days standard session

const generateAccessToken = (userId) => {
  return jwt.sign(
    {
      id: String(userId),
      type: 'access',
      jti: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2))
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Maintained for backward compatibility
const generateToken = generateAccessToken;

const generateRefreshToken = (userId, rememberMe = true) => {
  const expiry = rememberMe ? REFRESH_TOKEN_EXPIRY_LONG : REFRESH_TOKEN_EXPIRY_SHORT;
  const expiryDays = rememberMe ? 365 : 30;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const tokenId = `rt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

  const tokenString = jwt.sign(
    { id: String(userId), type: 'refresh', tokenId, rememberMe: Boolean(rememberMe) },
    JWT_REFRESH_SECRET,
    { expiresIn: expiry }
  );

  return { token: tokenString, expiresAt, rememberMe };
};

// @desc Register a new user (Farmer by default)
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, phone, email, password, role = 'farmer', state, district, village, farmSize, mainCrop, soilType, irrigationMethod } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'Please provide name, phone number, and password.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const e164Phone = `+91${cleanPhone}`;
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' });
    }

    // 1. Strict duplicate check in persistent store using sanitized 10-digit phone
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
        const userExists = await User.findOne({
          $or: [{ phone: e164Phone }, { phone: cleanPhone }]
        });
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
          phone: e164Phone,
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
        _id: user?._id?.toString() || user?.id,
        id: user?._id?.toString() || user?.id,
        name: name.trim(),
        phone: e164Phone,
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
    const rememberMe = req.body?.rememberMe !== false; // Default true for seamless experience
    const accessToken = generateAccessToken(userId);
    const refreshRecord = generateRefreshToken(userId, rememberMe);

    // Save refresh session permanently
    persistentStore.saveRefreshToken(userId, refreshRecord.token, refreshRecord.expiresAt, rememberMe);
    if (isDbConnected()) {
      try {
        await User.findByIdAndUpdate(userId, {
          $push: {
            refreshTokens: {
              token: refreshRecord.token,
              expiresAt: refreshRecord.expiresAt,
              rememberMe,
              createdAt: new Date()
            }
          }
        });
      } catch (_) {}
    }

    const regProfile = persistentStore.getProfile(userId);
    const regFarm = persistentStore.getFarm(userId);
    const regCrops = persistentStore.getCrops(userId);
    const regCurrentCrop = regCrops.find(c => c.isCurrent) || regCrops[0] || null;
    const regFields = persistentStore.getFields(userId);

    return res.status(201).json({
      success: true,
      accessToken,
      token: accessToken, // backward compatibility
      refreshToken: refreshRecord.token,
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
      profile: regProfile || null,
      farm: regFarm || (regFields && regFields[0]) || null,
      currentCrop: regCurrentCrop || null,
      fields: regFields || [],
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

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const e164Phone = `+91${cleanPhone}`;
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' });
    }

    let user = null;

    // 1. Try finding in MongoDB if connected using both formats
    if (isDbConnected()) {
      try {
        user = await User.findOne({
          $or: [
            { phone: cleanPhone },
            { phone: e164Phone },
            { phone: new RegExp(`${cleanPhone}$`) }
          ]
        });
      } catch (mongoErr) {
        console.warn('[Login] MongoDB query warning, continuing with persistent store:', mongoErr.message);
      }
    }

    // 2. Fall back to persistent disk store
    if (!user) {
      user = persistentStore.getUserByPhone(cleanPhone);
    }

    // 3. If running locally and user was previously registered on cloud production backend,
    // cross-authenticate with cloud and mirror locally so user can always log in!
    if (!user) {
      try {
        const cloudUrl = 'https://krishi-drishti-pykj.onrender.com/api/auth/login';
        const axios = require('axios');
        const cloudRes = await axios.post(cloudUrl, { phone: e164Phone, password }, { timeout: 6000 });
        if (cloudRes.data?.success && cloudRes.data?.user) {
          const cloudUser = cloudRes.data.user;
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(password, salt);
          user = persistentStore.registerUser({
            _id: cloudUser.id || cloudUser._id,
            id: cloudUser.id || cloudUser._id,
            name: cloudUser.name,
            phone: e164Phone,
            email: cloudUser.email || '',
            password: hashed,
            role: cloudUser.role || 'farmer',
            isOnboarded: cloudUser.isOnboarded,
            languagePreference: cloudUser.languagePreference || 'hi',
          });
        }
      } catch (_) {}
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'यह मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले पंजीकरण करें।',
      });
    }

    // 4. Verify password
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
        message: 'गलत पासवर्ड दर्ज किया गया है।',
      });
    }

    const userId = user._id || user.id;
    persistentStore.updateUserLastLogin(userId);
    const rememberMe = req.body?.rememberMe !== false; // Default true
    const accessToken = generateAccessToken(userId);
    const refreshRecord = generateRefreshToken(userId, rememberMe);

    persistentStore.saveRefreshToken(userId, refreshRecord.token, refreshRecord.expiresAt, rememberMe);
    if (isDbConnected()) {
      try {
        await User.findByIdAndUpdate(userId, {
          lastLoginAt: new Date(),
          $push: {
            refreshTokens: {
              token: refreshRecord.token,
              expiresAt: refreshRecord.expiresAt,
              rememberMe,
              createdAt: new Date()
            }
          }
        });
      } catch (_) {}
    }

    let profile = null;
    let farm = null;
    let currentCrop = null;

    if (isDbConnected()) {
      try {
        profile = await FarmerProfile.findOne({ userId });
        farm = await Farm.findOne({ farmerId: userId });
        currentCrop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      } catch (_) {}
    }

    const storeData = persistentStore.getDashboardForUser(userId);
    if (storeData) {
      if (!profile) profile = storeData.profile;
      if (!farm) farm = storeData.farm;
      if (!currentCrop) currentCrop = storeData.currentCrop;
    }
    const fields = persistentStore.getFields(userId);

    return res.status(200).json({
      success: true,
      message: 'सफलतापूर्वक लॉगिन हो गया।',
      accessToken,
      token: accessToken, // backward compatibility
      refreshToken: refreshRecord.token,
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
      profile: profile || null,
      farm: farm || (fields && fields[0]) || null,
      currentCrop: currentCrop || null,
      fields: fields || [],
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'सर्वर त्रुटि: ' + error.message,
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
          state: 'Uttar Pradesh',
          district: 'Gorakhpur',
          village: 'Sahajanwa',
          pincode: '273209',
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

// @desc Send OTP for password recovery
// @route POST /api/auth/forgot-password/send-otp
const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, code: 'MISSING_PHONE', message: 'Please provide your registered mobile number.' });
    }

    const cleanPhone = to10DigitPhone(phone);
    const e164Phone = normalizeToE164(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Verify whether account exists in persistent store or MongoDB
    let user = persistentStore.getUserByPhone(e164Phone);
    if (!user && isDbConnected()) {
      try {
        user = await User.findOne({
          $or: [{ phone: e164Phone }, { phone: cleanPhone }]
        });
      } catch (_) {}
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this mobile number. Please check the number or register.',
      });
    }

    const otpResult = await otpService.sendOtp(cleanPhone);
    return res.json({
      success: true,
      message: 'OTP sent successfully to registered mobile number.',
      cooldownSeconds: otpResult.cooldownSeconds,
      debugOtp: otpResult.debugOtp,
    });
  } catch (err) {
    if (err.code === 'COOLDOWN_ACTIVE') {
      return res.status(429).json({
        success: false,
        code: 'COOLDOWN_ACTIVE',
        message: err.message,
        remainingSeconds: err.remainingSeconds,
      });
    }
    console.error('sendOtp error:', err.message);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: err.message || 'Failed to send OTP. Please try again.',
    });
  }
};

// @desc Verify OTP for password recovery
// @route POST /api/auth/forgot-password/verify-otp
const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'Please provide phone number and OTP.' });
    }

    const cleanPhone = to10DigitPhone(phone);
    const result = otpService.verifyOtp(cleanPhone, otp);

    if (!result.success) {
      const status = result.code === 'MAX_ATTEMPTS_EXCEEDED' ? 429 : 400;
      return res.status(status).json(result);
    }

    return res.json({
      success: true,
      code: 'OTP_VERIFIED',
      message: 'OTP verified successfully.',
      resetToken: result.resetToken,
    });
  } catch (err) {
    console.error('verifyOtp error:', err.message);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Verification error.' });
  }
};

// @desc Reset password using verified resetToken
// @route POST /api/auth/forgot-password/reset-password
const forgotPasswordReset = async (req, res) => {
  try {
    const { phone, resetToken, newPassword } = req.body;
    if (!phone || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'Please provide phone, resetToken, and new password.' });
    }

    const cleanPhone = to10DigitPhone(phone);
    const e164Phone = normalizeToE164(phone);
    const isTokenValid = otpService.verifyResetToken(cleanPhone, resetToken);
    if (!isTokenValid) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired password reset session. Please request a new OTP.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 1. Update in persistent store using both E.164 and clean formats
    const updatedStoreUser = persistentStore.updateUserPassword(e164Phone, hashedPassword) || persistentStore.updateUserPassword(cleanPhone, hashedPassword);


    // 2. Update in MongoDB if connected
    if (isDbConnected()) {
      try {
        await User.findOneAndUpdate({ phone: cleanPhone }, { password: hashedPassword, updatedAt: new Date() });
      } catch (mongoErr) {
        console.warn('MongoDB password update warning:', mongoErr.message);
      }
    }

    if (!updatedStoreUser && !isDbConnected()) {
      return res.status(404).json({ success: false, code: 'ACCOUNT_NOT_FOUND', message: 'Account not found.' });
    }

    // Clear OTP state
    otpService.clearOtp(cleanPhone);

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (err) {
    console.error('forgotPasswordReset error:', err.message);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Failed to reset password.' });
  }
};

// @desc Refresh access token using persistent refresh token
// @route POST /api/auth/refresh
const refreshSession = async (req, res) => {
  try {
    let refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
    if (!refreshToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      refreshToken = req.headers.authorization.split(' ')[1];
    }

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token is required.'
      });
    }

    // Support instant demo token refresh
    if (refreshToken.startsWith('krishi_demo_')) {
      const role = refreshToken.includes('expert') ? 'expert' : (refreshToken.includes('admin') ? 'admin' : 'farmer');
      const demoUser = persistentStore.getUserByRole(role);
      const newAccess = `krishi_demo_jwt_token_${role}_2026`;
      return res.status(200).json({
        success: true,
        accessToken: newAccess,
        token: newAccess,
        refreshToken,
        user: demoUser
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Your session has expired. Please log in again.'
      });
    }

    if (!decoded || decoded.type !== 'refresh' || !decoded.id) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid refresh token structure.'
      });
    }

    const userId = decoded.id;

    // Verify session in persistentStore
    const diskSession = persistentStore.getRefreshToken(refreshToken);
    let mongoSession = null;

    if (isDbConnected()) {
      try {
        const u = await User.findById(userId);
        if (u && Array.isArray(u.refreshTokens)) {
          mongoSession = u.refreshTokens.find(rt => rt.token === refreshToken && new Date(rt.expiresAt) > new Date());
        }
      } catch (_) {}
    }

    // If neither store recognizes the refresh token as active
    if (!diskSession && !mongoSession) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_REVOKED',
        message: 'Session has been revoked or expired.'
      });
    }

    // Retrieve permanent user
    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(userId).select('-password');
      } catch (_) {}
    }
    if (!user) {
      user = persistentStore.getUserById(userId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Account no longer exists.'
      });
    }

    const newAccessToken = generateAccessToken(userId);
    const rememberMe = Boolean(decoded.rememberMe ?? true);

    // Refresh token rotation
    const newRefresh = generateRefreshToken(userId, rememberMe);
    persistentStore.revokeRefreshToken(refreshToken);
    persistentStore.saveRefreshToken(userId, newRefresh.token, newRefresh.expiresAt, rememberMe);

    if (isDbConnected()) {
      try {
        await User.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: { token: refreshToken } }
        });
        await User.findByIdAndUpdate(userId, {
          $push: {
            refreshTokens: {
              token: newRefresh.token,
              expiresAt: newRefresh.expiresAt,
              rememberMe,
              createdAt: new Date()
            }
          }
        });
      } catch (_) {}
    }

    let profile = null;
    let farm = null;
    let currentCrop = null;

    if (isDbConnected()) {
      try {
        profile = await FarmerProfile.findOne({ userId });
        farm = await Farm.findOne({ farmerId: userId });
        currentCrop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      } catch (_) {}
    }

    const storeData = persistentStore.getDashboardForUser(userId);
    if (storeData) {
      if (!profile) profile = storeData.profile;
      if (!farm) farm = storeData.farm;
      if (!currentCrop) currentCrop = storeData.currentCrop;
    }
    const fields = persistentStore.getFields(userId);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      token: newAccessToken,
      refreshToken: newRefresh.token,
      user: {
        id: user._id || user.id,
        _id: user._id || user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        languagePreference: user.languagePreference || 'hi',
      },
      profile: profile || null,
      farm: farm || (fields && fields[0]) || null,
      currentCrop: currentCrop || null,
      fields: fields || [],
    });
  } catch (err) {
    console.error('[RefreshSession] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Failed to refresh authentication session.'
    });
  }
};

// @desc Explicit logout: revokes persistent session but keeps user account and all farm data intact
// @route POST /api/auth/logout
const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
    const userId = req.user?._id || req.user?.id;

    if (refreshToken) {
      persistentStore.revokeRefreshToken(refreshToken);
      if (isDbConnected()) {
        try {
          await User.updateMany(
            {},
            { $pull: { refreshTokens: { token: refreshToken } } }
          );
        } catch (_) {}
      }
    } else if (userId) {
      persistentStore.revokeAllUserRefreshTokens(userId);
      if (isDbConnected()) {
        try {
          await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
        } catch (_) {}
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. All user and farm data preserved.'
    });
  } catch (err) {
    console.warn('[LogoutUser] Note:', err.message);
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }
};

module.exports = {
  register,
  login,
  loginFarmer: login,
  sanitizePhone: persistentStore.to10DigitPhone,
  demoLogin,
  getMe,
  refreshSession,
  logoutUser,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  generateAccessToken,
  generateRefreshToken,
};
