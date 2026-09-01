const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const CropAnalysis = require('../models/CropAnalysis');
const Recommendation = require('../models/Recommendation');
const Alert = require('../models/Alert');

// @desc Complete farmer onboarding
// @route POST /api/farmer/onboarding
const completeOnboarding = async (req, res) => {
  try {
    const {
      name,
      location,
      state,
      district,
      village,
      farmSize,
      landUnit,
      mainCrop,
      soilType,
      irrigationMethod,
    } = req.body;

    const userId = req.user._id;

    // Update User
    if (name) {
      await User.findByIdAndUpdate(userId, { name, isOnboarded: true });
    } else {
      await User.findByIdAndUpdate(userId, { isOnboarded: true });
    }

    // Upsert Profile
    let profile = await FarmerProfile.findOne({ userId });
    if (profile) {
      profile.state = state || profile.state;
      profile.district = district || profile.district;
      profile.village = village || profile.village;
      profile.location = location || `${profile.village}, ${profile.district}, ${profile.state}`;
      await profile.save();
    } else {
      profile = await FarmerProfile.create({
        userId,
        state: state || 'Maharashtra',
        district: district || 'Nashik',
        village: village || 'Pimpalgaon',
        location: location || `${village || 'Pimpalgaon'}, ${district || 'Nashik'}, ${state || 'Maharashtra'}`,
      });
    }

    // Upsert Farm
    let farm = await Farm.findOne({ farmerId: userId });
    if (farm) {
      farm.farmSize = Number(farmSize) || farm.farmSize;
      farm.landUnit = landUnit || farm.landUnit;
      farm.soilType = soilType || farm.soilType;
      farm.irrigationMethod = irrigationMethod || farm.irrigationMethod;
      await farm.save();
    } else {
      farm = await Farm.create({
        farmerId: userId,
        farmName: `${req.user.name}'s Farm`,
        farmSize: Number(farmSize) || 4.0,
        landUnit: landUnit || 'Acres',
        soilType: soilType || 'Black Soil / Regur',
        irrigationMethod: irrigationMethod || 'Drip Irrigation',
      });
    }

    // Create or update main crop
    if (mainCrop) {
      let crop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      if (crop) {
        crop.cropName = mainCrop;
        crop.areaAllocated = Number(farmSize) || 4.0;
        await crop.save();
      } else {
        await Crop.create({
          farmId: farm._id,
          farmerId: userId,
          cropName: mainCrop,
          variety: 'High Yield Standard',
          cropStage: 'Vegetative Stage',
          healthStatus: 'Good',
          areaAllocated: Number(farmSize) || 4.0,
          isCurrent: true,
        });
      }
    }

    // Create initial tasks
    await ActionPlan.create({
      farmerId: userId,
      title: 'Complete First Crop Foliage & Root Inspection',
      titleHi: 'फसल की पत्तियों एवं जड़ क्षेत्र का पहला निरीक्षण करें',
      description: 'Check for early leaf spots, whitefly nymphs, and soil moisture level.',
      dayLabel: 'TODAY',
      priority: 'High',
      category: 'Inspection',
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully!',
      profile,
      farm,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get Farmer Dashboard data
// @route GET /api/farmer/dashboard
const getFarmerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [profile, farm, crops, currentCrop, pendingTasks, recentAnalyses, recentRecommendations, unreadAlerts] = await Promise.all([
      FarmerProfile.findOne({ userId }),
      Farm.findOne({ farmerId: userId }),
      Crop.find({ farmerId: userId }),
      Crop.findOne({ farmerId: userId, isCurrent: true }),
      ActionPlan.find({ farmerId: userId, isCompleted: false }).sort({ dueDate: 1 }).limit(5),
      CropAnalysis.find({ farmerId: userId }).sort({ createdAt: -1 }).limit(3),
      Recommendation.find({ farmerId: userId }).sort({ createdAt: -1 }).limit(3),
      Alert.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(5),
    ]);

    // Calculate farm health average
    const healthScore = currentCrop ? currentCrop.healthScore : 88;

    res.json({
      success: true,
      data: {
        farmer: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
        },
        profile: profile || {
          state: 'Maharashtra',
          district: 'Nashik',
          village: 'Pimpalgaon',
          location: 'Pimpalgaon, Nashik, Maharashtra',
        },
        farm: farm || {
          farmName: 'My Primary Farm',
          farmSize: 4.5,
          landUnit: 'Acres',
          soilType: 'Black Soil / Regur',
          irrigationMethod: 'Drip Irrigation',
        },
        crops: crops || [],
        currentCrop: currentCrop || {
          cropName: 'Tomato',
          cropStage: 'Flowering Stage',
          healthStatus: 'Good',
          healthScore: 88,
          plantingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        pendingTasks,
        recentAnalyses,
        recentRecommendations,
        unreadAlertsCount: unreadAlerts.length,
        unreadAlerts,
        summary: {
          healthScore,
          activeCropsCount: crops.length || 1,
          pendingTasksCount: pendingTasks.length,
          totalAnalysesCount: await CropAnalysis.countDocuments({ farmerId: userId }),
        }
      }
    });
  } catch (error) {
    console.error('Farmer dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get Farm Insights & Statistics
// @route GET /api/farmer/insights
const getFarmInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalAnalyses, criticalIssues, totalTasks, completedTasks, analyses, recommendations] = await Promise.all([
      CropAnalysis.countDocuments({ farmerId: userId }),
      CropAnalysis.countDocuments({ farmerId: userId, severity: { $in: ['High', 'Critical'] } }),
      ActionPlan.countDocuments({ farmerId: userId }),
      ActionPlan.countDocuments({ farmerId: userId, isCompleted: true }),
      CropAnalysis.find({ farmerId: userId }).sort({ createdAt: -1 }).limit(10),
      Recommendation.find({ farmerId: userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Monthly Health Trend Simulation
    const healthTrends = [
      { month: 'Apr', score: 82, problems: 2 },
      { month: 'May', score: 85, problems: 1 },
      { month: 'Jun', score: 79, problems: 3 },
      { month: 'Jul', score: 88, problems: 1 },
      { month: 'Aug', score: 92, problems: 0 },
    ];

    // Severity Breakdown
    const severityDistribution = [
      { name: 'Healthy', value: Math.max(1, totalAnalyses - criticalIssues - 2), color: '#10B981' },
      { name: 'Moderate', value: 2, color: '#F59E0B' },
      { name: 'High/Critical', value: criticalIssues, color: '#EF4444' },
    ];

    res.json({
      success: true,
      data: {
        totalAnalyses,
        criticalIssues,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        healthTrends,
        severityDistribution,
        recentAnalyses: analyses,
        recentRecommendations: recommendations,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  completeOnboarding,
  getFarmerDashboard,
  getFarmInsights,
};
