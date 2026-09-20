const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Field = require('../models/Field');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const CropAnalysis = require('../models/CropAnalysis');
const Recommendation = require('../models/Recommendation');
const Alert = require('../models/Alert');
const { runFieldMonitoringPipeline } = require('../services/fieldMonitoringService');
const { 
  isDbConnected, 
  getStatelessDashboard, 
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
    if (!isDbConnected()) {
      return res.json({
        success: true,
        data: getStatelessDashboard()
      });
    }

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
          variety: 'Abhinav Hybrid',
          cropStage: 'Flowering Stage',
          healthStatus: 'Good',
          healthScore: 88,
          areaAllocated: 3.0,
        },
        healthScore,
        pendingTasks: pendingTasks || [],
        recentAnalyses: recentAnalyses || [],
        recentRecommendations: recentRecommendations || [],
        unreadAlerts: unreadAlerts || [],
      },
    });
  } catch (error) {
    console.warn('Farmer dashboard falling back to stateless dataset:', error.message);
    res.json({
      success: true,
      data: getStatelessDashboard()
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

    if (!isDbConnected()) {
      return res.json({
        success: true,
        data: {
          totalAnalyses: 11,
          criticalIssues: 1,
          totalTasks: 5,
          completedTasks: 4,
          taskCompletionRate: 80,
          healthTrends,
          severityDistribution,
          recentAnalyses: [
            {
              _id: 'ana_demo_01',
              detectedProblem: 'Early Blight (Alternaria solani)',
              confidenceScore: 92,
              severity: 'Medium',
              createdAt: new Date().toISOString()
            }
          ],
          recentRecommendations: [
            {
              _id: 'rec_demo_01',
              query: 'Early blight control for Tomato',
              aiResponse: 'Spray Mancozeb 75 WP or Neem Oil',
              createdAt: new Date().toISOString()
            }
          ],
        }
      });
    }

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
    console.warn('Insights falling back to simulated values:', error.message);
    res.json({
      success: true,
      data: {
        totalAnalyses: 10,
        criticalIssues: 1,
        totalTasks: 4,
        completedTasks: 3,
        taskCompletionRate: 75,
        healthTrends: [
          { month: 'Apr', score: 82, problems: 2 },
          { month: 'May', score: 85, problems: 1 },
          { month: 'Jun', score: 79, problems: 3 },
          { month: 'Jul', score: 88, problems: 1 },
          { month: 'Aug', score: 92, problems: 0 },
        ],
        severityDistribution: [
          { name: 'Healthy', value: 7, color: '#10B981' },
          { name: 'Moderate', value: 2, color: '#F59E0B' },
          { name: 'High/Critical', value: 1, color: '#EF4444' },
        ],
        recentAnalyses: [],
        recentRecommendations: [],
      }
    });
  }
};

// Field Mapping In-Memory Synchronization
const isLegacyMockField = (f) => {
  if (!f) return true;
  if (Array.isArray(f.points) && f.points.length === 7) return true;
  if (f.fieldName && (f.fieldName.includes('North Plot') || f.fieldName.includes('field_demo'))) return true;
  if (f.id === 'field_demo_01' || f._id === 'field_demo_01' || f.id === 'field_demo_maize_01') return true;
  if (Array.isArray(f.points) && f.points.some(p => Math.abs(p.lat - 20.174) < 0.05 && Math.abs(p.lng - 73.985) < 0.05)) return true;
  return false;
};

const getFields = async (req, res) => {
  try {
    const farmerId = req.user?._id;
    if (isDbConnected() && farmerId) {
      const dbFields = await Field.find({ farmerId }).sort({ createdAt: -1 });
      if (dbFields && dbFields.length > 0) {
        const cleanDbFields = dbFields.filter(f => !isLegacyMockField(f));
        return res.json({ success: true, data: cleanDbFields });
      }
    }
  } catch (err) {
    console.warn('Field lookup from DB warning:', err.message);
  }
  const fields = getStatelessFields(req.user?._id);
  const cleanFields = fields.filter(f => !isLegacyMockField(f));
  res.json({ success: true, data: cleanFields });
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

  const farmerId = req.user?._id || 'usr_farmer_demo_01';
  if (isDbConnected() && req.user?._id) {
    try {
      let savedDbField = null;
      if (fieldData._id || (fieldData.id && fieldData.id.match(/^[0-9a-fA-F]{24}$/))) {
        savedDbField = await Field.findOneAndUpdate(
          { _id: fieldData._id || fieldData.id, farmerId },
          { ...fieldData, farmerId },
          { new: true, upsert: true }
        );
      } else {
        savedDbField = await Field.create({
          ...fieldData,
          farmerId
        });
      }

      // Proactively trigger autonomous monitoring pipeline immediately upon field registration
      try {
        runFieldMonitoringPipeline(savedDbField._id, farmerId)
          .catch(e => console.warn('[FieldSave] Initial monitoring auto-run note:', e.message));
      } catch (_) {}

      // Keep stateless copy aligned
      saveStatelessField(savedDbField.toObject ? savedDbField.toObject() : savedDbField, farmerId);

      return res.json({ success: true, data: savedDbField });
    } catch (dbErr) {
      console.warn('Field save to DB warning:', dbErr.message);
    }
  }

  const saved = saveStatelessField(fieldData, farmerId);
  res.json({ success: true, data: saved });
};

const deleteField = async (req, res) => {
  const { id } = req.params;
  const farmerId = req.user?._id || 'usr_farmer_demo_01';

  if (isDbConnected() && req.user?._id) {
    try {
      await Field.findOneAndDelete({ _id: id, farmerId });
    } catch (err) {
      console.warn('Field deletion DB warning:', err.message);
    }
  }

  const remaining = deleteStatelessField(id, farmerId);
  res.json({ success: true, message: 'Field deleted', data: remaining });
};

module.exports = {
  completeOnboarding,
  getFarmerDashboard,
  getFarmInsights,
  getFields,
  saveField,
  deleteField,
};
