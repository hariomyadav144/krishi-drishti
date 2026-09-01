const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const CropAnalysis = require('../models/CropAnalysis');
const Recommendation = require('../models/Recommendation');
const Alert = require('../models/Alert');
const Feedback = require('../models/Feedback');
const { seedDatabase } = require('../utils/seedData');

// @desc Get Admin Dashboard statistics and overview
// @route GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalExperts,
      totalFarms,
      totalCrops,
      totalAnalyses,
      totalRecommendations,
      activeAlerts,
      totalFeedbacks,
      recentUsers,
      recentAnalyses,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'expert' }),
      Farm.countDocuments(),
      Crop.countDocuments(),
      CropAnalysis.countDocuments(),
      Recommendation.countDocuments(),
      Alert.countDocuments({ isRead: false }),
      Feedback.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(6).select('-password'),
      CropAnalysis.find().sort({ createdAt: -1 }).limit(6).populate('farmerId', 'name phone'),
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalFarmers,
          totalExperts,
          totalFarms,
          totalCrops,
          totalAnalyses,
          totalRecommendations,
          activeAlerts,
          totalFeedbacks,
        },
        recentUsers,
        recentAnalyses,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all users with filters
// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    const users = await User.find(query).sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Trigger database seed / reset
// @route POST /api/admin/seed
const triggerSeed = async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database populated with sample agricultural records successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getUsers,
  triggerSeed,
};
