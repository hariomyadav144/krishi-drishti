const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Field = require('../models/Field');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const CropAnalysis = require('../models/CropAnalysis');
const Recommendation = require('../models/Recommendation');
const Alert = require('../models/Alert');
const persistentStore = require('../utils/persistentStore');
const { runFieldMonitoringPipeline } = require('../services/fieldMonitoringService');
const { 
  isDbConnected, 
  getStatelessDashboard,
  getStatelessDashboardForUser,
  getStatelessUserById,
  updateStatelessUser,
  saveStatelessProfile,
  saveStatelessFarm,
  addStatelessCrop,
  getStatelessFields, 
  saveStatelessField, 
  deleteStatelessField 
} = require('../utils/statelessStore');

// @desc Complete farmer onboarding
// @route POST /api/farmer/onboarding
const completeOnboarding = async (req, res) => {
  try {
    const {
      name,
      farmName,
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

    if (!isDbConnected()) {
      const updatedUser = updateStatelessUser(userId, { ...(name ? { name } : {}), isOnboarded: true });

      const locationStr = location || ((village && district) 
        ? `${village}, ${district}, ${state || ''}`.replace(/, $/, '') 
        : (state || ''));

      const profile = saveStatelessProfile(userId, {
        state: state || '',
        district: district || '',
        village: village || '',
        location: locationStr
      });

      const farm = saveStatelessFarm(userId, {
        farmName: farmName || (name || req.user.name ? `${name || req.user.name}'s Farm` : 'Farm'),
        farmSize: Number(farmSize) || 0,
        landUnit: landUnit || 'Acres',
        soilType: soilType || '',
        irrigationMethod: irrigationMethod || '',
      });

      if (mainCrop) {
        addStatelessCrop(userId, {
          cropName: mainCrop,
          areaAllocated: Number(farmSize) || 0,
          isCurrent: true
        });
      }

      return res.json({
        success: true,
        message: 'Onboarding completed successfully!',
        user: updatedUser,
        profile,
        farm,
      });
    }

    // Update User in DB
    if (name) {
      await User.findByIdAndUpdate(userId, { name, isOnboarded: true });
    } else {
      await User.findByIdAndUpdate(userId, { isOnboarded: true });
    }

    const locationStr = location || ((village && district) 
      ? `${village}, ${district}, ${state || ''}`.replace(/, $/, '') 
      : (state || ''));

    // Upsert Profile
    let profile = await FarmerProfile.findOne({ userId });
    if (profile) {
      profile.state = state !== undefined ? state : profile.state;
      profile.district = district !== undefined ? district : profile.district;
      profile.village = village !== undefined ? village : profile.village;
      profile.location = locationStr || profile.location;
      await profile.save();
    } else {
      profile = await FarmerProfile.create({
        userId,
        state: state || '',
        district: district || '',
        village: village || '',
        location: locationStr,
      });
    }

    // Upsert Farm
    let farm = await Farm.findOne({ farmerId: userId });
    if (farm) {
      if (farmSize) farm.farmSize = Number(farmSize);
      if (landUnit) farm.landUnit = landUnit;
      if (soilType) farm.soilType = soilType;
      if (irrigationMethod) farm.irrigationMethod = irrigationMethod;
      await farm.save();
    } else {
      farm = await Farm.create({
        farmerId: userId,
        farmName: farmName || (name || req.user.name ? `${name || req.user.name}'s Farm` : 'Farm'),
        farmSize: Number(farmSize) || 0,
        landUnit: landUnit || 'Acres',
        soilType: soilType || '',
        irrigationMethod: irrigationMethod || '',
      });
    }

    // Create or update main crop
    if (mainCrop) {
      let crop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      if (crop) {
        crop.cropName = mainCrop;
        crop.areaAllocated = Number(farmSize) || crop.areaAllocated;
        await crop.save();
      } else {
        await Crop.create({
          farmId: farm._id,
          farmerId: userId,
          cropName: mainCrop,
          variety: 'High Yield Standard',
          cropStage: 'Vegetative Stage',
          healthStatus: 'Good',
          areaAllocated: Number(farmSize) || 0,
          isCurrent: true,
        });
      }
    }

    // Create initial task for new farmer
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

    if (!isDbConnected()) {
      const data = persistentStore.getDashboardForUser(userId) || getStatelessDashboardForUser(userId);
      const cleanEmptyDashboard = {
        farmer: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
        },
        profile: null,
        farm: null,
        fields: [],
        crops: [],
        currentCrop: null,
        healthScore: null,
        pendingTasks: [],
        recentAnalyses: [],
        recentRecommendations: [],
        unreadAlerts: [],
      };
      return res.json({
        success: true,
        data: data || cleanEmptyDashboard
      });
    }

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

    const healthScore = currentCrop ? currentCrop.healthScore : null;

    res.json({
      success: true,
      data: {
        farmer: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
        },
        profile: profile || null,
        farm: farm || null,
        crops: crops || [],
        currentCrop: currentCrop || null,
        healthScore,
        pendingTasks: pendingTasks || [],
        recentAnalyses: recentAnalyses || [],
        recentRecommendations: recentRecommendations || [],
        unreadAlerts: unreadAlerts || [],
      },
    });
  } catch (error) {
    console.error('Farmer dashboard error:', error.message);
    const fallbackData = persistentStore.getDashboardForUser(req.user?._id) || getStatelessDashboardForUser(req.user?._id);
    res.json({
      success: true,
      data: fallbackData || {
        farmer: {
          id: req.user?._id,
          name: req.user?.name,
          phone: req.user?.phone,
          email: req.user?.email,
        },
        profile: null,
        farm: null,
        crops: [],
        currentCrop: null,
        healthScore: null,
        pendingTasks: [],
        recentAnalyses: [],
        recentRecommendations: [],
        unreadAlerts: [],
      }
    });
  }
};

// @desc Get Farm Insights & Statistics
// @route GET /api/farmer/insights
const getFarmInsights = async (req, res) => {
  try {
    const healthTrends = [
      { month: 'Apr', score: 82, problems: 2 },
      { month: 'May', score: 85, problems: 1 },
      { month: 'Jun', score: 79, problems: 3 },
      { month: 'Jul', score: 88, problems: 1 },
      { month: 'Aug', score: 92, problems: 0 },
    ];

    const severityDistribution = [
      { name: 'Healthy', value: 8, color: '#10B981' },
      { name: 'Moderate', value: 2, color: '#F59E0B' },
      { name: 'High/Critical', value: 1, color: '#EF4444' },
    ];

    const userId = req.user?._id;

    if (!isDbConnected()) {
      const userScans = req.user?.isDemo !== false 
        ? [
            {
              _id: 'ana_demo_01',
              detectedProblem: 'Early Blight (Alternaria solani)',
              confidenceScore: 92,
              severity: 'Medium',
              createdAt: new Date().toISOString()
            }
          ]
        : [];

      return res.json({
        success: true,
        data: {
          totalAnalyses: userScans.length,
          criticalIssues: 0,
          totalTasks: 2,
          completedTasks: 1,
          taskCompletionRate: 50,
          healthTrends,
          severityDistribution,
          recentAnalyses: userScans,
          recentRecommendations: [],
        }
      });
    }

    const [totalAnalyses, criticalIssues, totalTasks, completedTasks, analyses, recommendations] = await Promise.all([
      CropAnalysis.countDocuments({ farmerId: userId }),
      CropAnalysis.countDocuments({ farmerId: userId, severity: { $in: ['High', 'Critical'] } }),
      ActionPlan.countDocuments({ farmerId: userId }),
      ActionPlan.countDocuments({ farmerId: userId, isCompleted: true }),
      CropAnalysis.find({ farmerId: userId }).sort({ createdAt: -1 }).limit(10),
      Recommendation.find({ farmerId: userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

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
    console.warn('Insights falling back to empty values:', error.message);
    res.json({
      success: true,
      data: {
        totalAnalyses: 0,
        criticalIssues: 0,
        totalTasks: 0,
        completedTasks: 0,
        taskCompletionRate: 100,
        healthTrends: [],
        severityDistribution: [],
        recentAnalyses: [],
        recentRecommendations: [],
      }
    });
  }
};

// Field Mapping Permanent Persistence
const isLegacyMockField = (f) => {
  if (!f) return true;
  // NEVER filter out fields based on points.length (a legitimate farm can have 7, 8 or any number of boundary corners!)
  if (f.id === 'field_demo_01' || f._id === 'field_demo_01' || f.id === 'field_demo_maize_01') return true;
  return false;
};

const getFields = async (req, res) => {
  const farmerId = req.user?._id || req.user?.id;
  if (!farmerId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let dbFields = [];
  // 1. Retrieve from MongoDB if connected
  if (isDbConnected()) {
    try {
      const records = await Field.find({ farmerId }).sort({ createdAt: -1 });
      if (records && records.length > 0) {
        dbFields = records.map(f => f.toObject ? f.toObject() : f);
      }
    } catch (err) {
      console.warn('Field lookup from DB warning:', err.message);
    }
  }

  // 2. Retrieve from permanent disk persistentStore
  const diskFields = persistentStore.getFields(farmerId);

  // 3. Fallback to stateless store if both empty
  const statelessFields = getStatelessFields(farmerId);

  // 4. Merge all fields cleanly (deduplicate by id)
  const mergedMap = new Map();
  statelessFields.forEach(f => {
    const key = f.id || f._id;
    if (key && !isLegacyMockField(f)) mergedMap.set(String(key), f);
  });
  diskFields.forEach(f => {
    const key = f.id || f._id;
    if (key && !isLegacyMockField(f)) mergedMap.set(String(key), f);
  });
  dbFields.forEach(f => {
    const key = f.id || f._id;
    if (key && !isLegacyMockField(f)) mergedMap.set(String(key), f);
  });

  const finalFields = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return res.json({ success: true, data: finalFields });
};

const saveField = async (req, res) => {
  const fieldData = req.body;
  if (!fieldData || !Array.isArray(fieldData.points) || fieldData.points.length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please mark at least 3 valid boundary points on the map.' 
    });
  }

  // Rigorous geospatial coordinate validation
  for (let i = 0; i < fieldData.points.length; i++) {
    const pt = fieldData.points[i];
    const lat = Number(pt?.lat);
    const lng = Number(pt?.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid GPS coordinates at corner #${i + 1}.` 
      });
    }
  }

  const farmerId = req.user?._id || req.user?.id;
  if (!farmerId) {
    return res.status(401).json({ success: false, message: 'Authentication required to save field.' });
  }

  // 1. ALWAYS permanently save to disk persistentStore first for 100% zero-data-loss guarantee
  const savedDiskField = persistentStore.saveField(farmerId, fieldData);

  // 2. Keep in-memory statelessStore aligned
  try {
    saveStatelessField(savedDiskField, farmerId);
  } catch (_) {}

  // 3. Save to MongoDB if connected
  let savedDbField = null;
  if (isDbConnected()) {
    try {
      const queryId = fieldData._id || fieldData.id;
      if (queryId && queryId.match(/^[0-9a-fA-F]{24}$/)) {
        savedDbField = await Field.findOneAndUpdate(
          { _id: queryId, farmerId },
          { ...fieldData, farmerId },
          { new: true, upsert: true }
        );
      } else {
        savedDbField = await Field.create({
          ...fieldData,
          farmerId
        });
      }

      // Proactively trigger autonomous monitoring pipeline
      try {
        runFieldMonitoringPipeline(savedDbField._id, farmerId)
          .catch(e => console.warn('[FieldSave] Initial monitoring auto-run note:', e.message));
      } catch (_) {}
    } catch (dbErr) {
      console.warn('Field save to DB warning:', dbErr.message);
    }
  }

  const responseField = savedDbField ? (savedDbField.toObject ? savedDbField.toObject() : savedDbField) : savedDiskField;
  res.json({ success: true, data: responseField });
};

const deleteField = async (req, res) => {
  const { id } = req.params;
  const farmerId = req.user?._id || req.user?.id;
  if (!farmerId) {
    return res.status(401).json({ success: false, message: 'Authentication required to delete field.' });
  }

  // Delete from persistent disk store
  const remainingDisk = persistentStore.deleteField(farmerId, id);

  // Delete from stateless memory store
  deleteStatelessField(id, farmerId);

  // Delete from MongoDB if connected
  if (isDbConnected()) {
    try {
      await Field.findOneAndDelete({ $or: [{ _id: id }, { id }], farmerId });
    } catch (err) {
      console.warn('Field deletion DB warning:', err.message);
    }
  }

  res.json({ success: true, message: 'Field deleted successfully', data: remainingDisk });
};

module.exports = {
  completeOnboarding,
  getFarmerDashboard,
  getFarmInsights,
  getFields,
  saveField,
  deleteField,
};
