const Recommendation = require('../models/Recommendation');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const ActionPlan = require('../models/ActionPlan');
const { generateSmartAdvice } = require('../services/aiAdvisoryService');
const { getFarmWeather } = require('../services/weatherService');

// @desc Ask AI Advisor for personalized agronomy recommendations
// @route POST /api/recommendations/ask
const askAdvisor = async (req, res) => {
  try {
    const { queryText, cropName, cropStage } = req.body;
    const userId = req.user._id;

    if (!queryText || queryText.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a farming question or topic.' });
    }

    // Fetch farmer context
    const [activeCrop, farm] = await Promise.all([
      Crop.findOne({ farmerId: userId, isCurrent: true }),
      Farm.findOne({ farmerId: userId }),
    ]);

    const targetCropName = cropName || (activeCrop ? activeCrop.cropName : 'Tomato');
    const targetCropStage = cropStage || (activeCrop ? activeCrop.cropStage : 'Flowering Stage');

    // Fetch localized weather
    const weather = await getFarmWeather();

    // Generate 5-part Structured Advisory
    const advice = await generateSmartAdvice({
      queryText,
      cropName: targetCropName,
      cropStage: targetCropStage,
      farm,
      weather,
    });

    // Save Recommendation
    const savedRec = await Recommendation.create({
      farmerId: userId,
      cropId: activeCrop ? activeCrop._id : null,
      cropName: targetCropName,
      queryText,
      category: advice.category,
      issue: advice.issue,
      issueHi: advice.issueHi,
      reason: advice.reason,
      reasonHi: advice.reasonHi,
      whatToDo: advice.whatToDo,
      whatToDoHi: advice.whatToDoHi,
      whenToDo: advice.whenToDo,
      whenToDoHi: advice.whenToDoHi,
      whatToAvoid: advice.whatToAvoid,
      whatToAvoidHi: advice.whatToAvoidHi,
      actionPlanCreated: true,
    });

    // Generate Action Plan Tasks
    if (advice.actionTasks && advice.actionTasks.length > 0) {
      const tasksToInsert = advice.actionTasks.map(t => ({
        farmerId: userId,
        cropId: activeCrop ? activeCrop._id : null,
        recommendationId: savedRec._id,
        title: t.title,
        dayLabel: t.dayLabel,
        priority: 'Medium',
        category: t.category || 'General',
      }));
      await ActionPlan.insertMany(tasksToInsert);
    }

    res.status(201).json({
      success: true,
      message: 'AI Recommendation generated successfully!',
      data: savedRec,
      generatedTasks: advice.actionTasks,
    });
  } catch (error) {
    console.error('Advisor error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get recent recommendations history
// @route GET /api/recommendations
const getRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ farmerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(15);
    res.json({ success: true, count: recommendations.length, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get predefined quick questions for farmers
// @route GET /api/recommendations/predefined-queries
const getPredefinedQueries = async (req, res) => {
  const queries = [
    {
      id: 'today_care',
      title: 'What should I do for my crop today?',
      titleHi: 'आज मेरी फसल के लिए मुझे क्या करना चाहिए?',
      category: 'Daily Care',
      icon: 'calendar-check',
    },
    {
      id: 'irrigation_timing',
      title: 'When should I irrigate my field?',
      titleHi: 'मुझे खेत में सिंचाई कब करनी चाहिए?',
      category: 'Water Management',
      icon: 'droplets',
    },
    {
      id: 'fertilizer_dosing',
      title: 'Which fertilizer and dosage should I apply?',
      titleHi: 'मुझे कौन सा उर्वरक और कितनी मात्रा में डालना चाहिए?',
      category: 'Nutrition',
      icon: 'sprout',
    },
    {
      id: 'yellow_leaves',
      title: 'My crop leaves are turning yellow, what should I do?',
      titleHi: 'मेरी फसल की पत्तियां पीली पड़ रही हैं, क्या उपाय करें?',
      category: 'Crop Health',
      icon: 'alert-triangle',
    },
    {
      id: 'yield_boost',
      title: 'How can I maximize my crop health and yield?',
      titleHi: 'मैं अपनी फसल की सेहत और पैदावार कैसे बढ़ा सकता हूँ?',
      category: 'Yield Growth',
      icon: 'trending-up',
    }
  ];

  res.json({ success: true, data: queries });
};

module.exports = {
  askAdvisor,
  getRecommendations,
  getPredefinedQueries,
};
