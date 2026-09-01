const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Alert = require('../models/Alert');

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
      return res.status(400).json({ success: false, message: 'Please provide name, phone number, and password.' });
    }

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user already exists with this phone number.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phone,
      email: email || '',
      password: hashedPassword,
      role: role || 'farmer',
      isOnboarded: !!(state && mainCrop),
    });

    // Create Farmer Profile if farmer
    if (user.role === 'farmer') {
      const profile = await FarmerProfile.create({
        userId: user._id,
        state: state || 'Maharashtra',
        district: district || 'Nashik',
        village: village || 'Pimpalgaon',
        location: `${village || 'Pimpalgaon'}, ${district || 'Nashik'}, ${state || 'Maharashtra'}`,
      });

      // Create default Farm
      const farm = await Farm.create({
        farmerId: user._id,
        farmName: `${name}'s Farm`,
        farmSize: Number(farmSize) || 4.5,
        landUnit: 'Acres',
        soilType: soilType || 'Black Soil / Regur',
        irrigationMethod: irrigationMethod || 'Drip Irrigation',
      });

      // Create default Crop
      await Crop.create({
        farmId: farm._id,
        farmerId: user._id,
        cropName: mainCrop || 'Tomato',
        variety: 'High Yield Hybrid',
        cropStage: 'Flowering Stage',
        healthStatus: 'Good',
        areaAllocated: Number(farmSize) || 4.5,
      });

      // Send Welcome Alert
      await Alert.create({
        userId: user._id,
        title: 'Welcome to Krishi Drishti! 🌱',
        titleHi: 'कृषि दृष्टि में आपका स्वागत है! 🌱',
        message: 'Your smart farming companion is active. Scan your crop or ask AI advice anytime.',
        messageHi: 'आपका स्मार्ट कृषि साथी सक्रिय है। अपनी फसल की जांच करें या AI सलाह लें।',
        priority: 'low',
        category: 'system',
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
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
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide phone number and password.' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
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
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc 1-Click Demo Login for quick persona testing
// @route POST /api/auth/demo-login
const demoLogin = async (req, res) => {
  try {
    const { role = 'farmer' } = req.body;
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

        const profile = await FarmerProfile.create({
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
          name: 'Krishi Drishti Admin Officer',
          phone: '9876599999',
          email: 'admin@krishidrishti.in',
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = null;
    let farm = null;
    let currentCrop = null;

    if (user.role === 'farmer') {
      profile = await FarmerProfile.findOne({ userId: user._id });
      farm = await Farm.findOne({ farmerId: user._id });
      currentCrop = await Crop.findOne({ farmerId: user._id, isCurrent: true });
    }

    res.json({
      success: true,
      user,
      profile,
      farm,
      currentCrop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getMe,
};
