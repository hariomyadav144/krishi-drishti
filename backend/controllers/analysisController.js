const CropAnalysis = require('../models/CropAnalysis');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const Alert = require('../models/Alert');
const { analyzeCropImage } = require('../services/aiVisionService');

// @desc Scan and diagnose crop problem from image & symptoms
// @route POST /api/analysis/scan
const scanCrop = async (req, res) => {
  try {
    const { cropName, symptomDescription, sampleImageUrl } = req.body;
    const userId = req.user._id;

    // Handle image URL from multer upload or sample URL
    let imageUrl = '/uploads/sample-tomato-leaf.jpg';
    let originalname = '';
    let filename = '';

    if (req.file) {
      const host = req.get('host');
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      imageUrl = `${proto}://${host}/uploads/${req.file.filename}`;
      originalname = req.file.originalname;
      filename = req.file.filename;
    } else if (sampleImageUrl) {
      imageUrl = sampleImageUrl;
      filename = sampleImageUrl;
    }

    // Get active crop record if available
    const activeCrop = await Crop.findOne({ farmerId: userId, isCurrent: true });
    const selectedCropName = cropName || (activeCrop ? activeCrop.cropName : 'Tomato');

    // Run AI Vision Engine
    const aiResult = await analyzeCropImage({
      cropName: selectedCropName,
      symptomDescription: symptomDescription || '',
      originalname,
      filename,
    });

    // Save Analysis Record
    const analysis = await CropAnalysis.create({
      farmerId: userId,
      cropId: activeCrop ? activeCrop._id : null,
      cropName: selectedCropName,
      imageUrl,
      symptomDescription: symptomDescription || '',
      detectedProblem: aiResult.detectedProblem,
      detectedProblemHi: aiResult.detectedProblemHi,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      cause: aiResult.cause,
      causeHi: aiResult.causeHi,
      symptoms: aiResult.symptoms,
      recommendedAction: aiResult.recommendedAction,
      recommendedActionHi: aiResult.recommendedActionHi,
      organicTreatment: aiResult.organicTreatment,
      chemicalTreatment: aiResult.chemicalTreatment,
      preventionTips: aiResult.preventionTips,
      nextActionTimeline: aiResult.nextActionTimeline,
    });

    // Generate Automatic Action Plan Tasks
    const actionTasks = [
      {
        farmerId: userId,
        cropId: activeCrop ? activeCrop._id : null,
        cropAnalysisId: analysis._id,
        title: `Isolate and inspect affected ${selectedCropName} foliage`,
        titleHi: `प्रभावित ${selectedCropName} की पत्तियों की छंटाई व निरीक्षण करें`,
        description: aiResult.recommendedAction,
        dayLabel: 'TODAY',
        priority: aiResult.severity === 'Critical' ? 'High' : 'Medium',
        category: 'Pruning & Weeding',
      },
      {
        farmerId: userId,
        cropId: activeCrop ? activeCrop._id : null,
        cropAnalysisId: analysis._id,
        title: `Apply targeted treatment (${aiResult.detectedProblem})`,
        titleHi: `अनुशंसित उपचार का छिड़काव करें (${aiResult.detectedProblemHi || aiResult.detectedProblem})`,
        description: aiResult.organicTreatment || aiResult.chemicalTreatment,
        dayLabel: 'DAY 2',
        priority: 'High',
        category: 'Pest Management',
      },
      {
        farmerId: userId,
        cropId: activeCrop ? activeCrop._id : null,
        cropAnalysisId: analysis._id,
        title: `Evaluate recovery and monitor disease progression`,
        titleHi: `फसल सुधार की जांच करें और नए लक्षणों की निगरानी करें`,
        description: 'Re-inspect leaf undersides and verify disease arrest.',
        dayLabel: 'DAY 5',
        priority: 'Medium',
        category: 'Inspection',
      }
    ];

    await ActionPlan.insertMany(actionTasks);

    // If severe, update crop status & create urgent alert
    if (['High', 'Critical'].includes(aiResult.severity)) {
      if (activeCrop) {
        activeCrop.healthStatus = aiResult.severity === 'Critical' ? 'Diseased' : 'At Risk';
        activeCrop.healthScore = Math.max(45, activeCrop.healthScore - 20);
        await activeCrop.save();
      }

      await Alert.create({
        userId,
        title: `Critical Alert: ${aiResult.detectedProblem}`,
        titleHi: `गंभीर चेतावनी: ${aiResult.detectedProblemHi || aiResult.detectedProblem}`,
        message: `High severity detected on ${selectedCropName}. Action required within 24 hours.`,
        messageHi: `${selectedCropName} पर गंभीर लक्षण पाए गए हैं। 24 घंटे के भीतर उपचार करें।`,
        priority: 'critical',
        category: 'crop_health',
        actionUrl: `/diagnose`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Crop analysis completed successfully!',
      data: analysis,
      generatedTasks: actionTasks,
    });
  } catch (error) {
    console.error('Scan crop error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get recent crop analysis history
// @route GET /api/analysis/history
const getAnalysisHistory = async (req, res) => {
  try {
    const history = await CropAnalysis.find({ farmerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get analysis details by ID
// @route GET /api/analysis/:id
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await CropAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  scanCrop,
  getAnalysisHistory,
  getAnalysisById,
};
