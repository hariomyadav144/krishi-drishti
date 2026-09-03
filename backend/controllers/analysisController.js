const fs = require('fs');
const CropAnalysis = require('../models/CropAnalysis');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const Alert = require('../models/Alert');
const { analyzeCropImage } = require('../services/aiVisionService');
const { diagnoseCropWithGemini } = require('../services/geminiService');

// @desc Scan and diagnose crop problem from image & symptoms
// @route POST /api/analysis/scan
const scanCrop = async (req, res) => {
  try {
    const { cropName, crop, symptomDescription, question, sampleImageUrl } = req.body;
    const userId = req.user ? req.user._id : null;

    // Handle image URL from multer upload or sample URL
    let imageUrl = '/uploads/sample-tomato-leaf.jpg';
    let originalname = '';
    let filename = '';
    let imageBuffer = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      const host = req.get('host');
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      imageUrl = `${proto}://${host}/uploads/${req.file.filename}`;
      originalname = req.file.originalname;
      filename = req.file.filename;
      try {
        imageBuffer = fs.readFileSync(req.file.path);
        mimeType = req.file.mimetype || 'image/jpeg';
      } catch (readErr) {
        console.warn('Could not read uploaded file buffer:', readErr.message);
      }
    } else if (sampleImageUrl) {
      imageUrl = sampleImageUrl;
      filename = sampleImageUrl;
    }

    // Get active crop record if available
    let activeCrop = null;
    if (userId) {
      try {
        activeCrop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      } catch (dbErr) {
        console.warn('Crop lookup warning:', dbErr.message);
      }
    }

    const selectedCropName = cropName || (activeCrop ? activeCrop.cropName : 'Tomato');

    let aiResult = null;

    // If image buffer and GEMINI_API_KEY exist, use real Gemini Multimodal Vision
    if (imageBuffer && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
      try {
        const geminiVision = await diagnoseCropWithGemini({
          imageBuffer,
          mimeType,
          question: question || symptomDescription || 'Diagnose visible plant symptoms and recommended treatment.',
          crop: selectedCropName,
          cropStage: activeCrop?.cropStage || 'Flowering Stage',
          language: 'en'
        });

        if (geminiVision && geminiVision.data) {
          aiResult = {
            ...geminiVision.data,
            answer: geminiVision.answer,
            diagnosis: geminiVision.diagnosis
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini vision diagnosis fallback to database engine:', geminiErr.message);
      }
    }

    // If Gemini Vision wasn't used or failed, use built-in agronomy pathology engine
    if (!aiResult) {
      aiResult = await analyzeCropImage({
        cropName: selectedCropName,
        symptomDescription: symptomDescription || '',
        originalname,
        filename,
      });
    }

    // Save Analysis Record if DB available and user is authenticated
    let analysis = null;
    if (userId) {
      try {
        analysis = await CropAnalysis.create({
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
      } catch (saveErr) {
        console.warn('Analysis save skipped:', saveErr.message);
      }
    }

    const responseData = analysis ? analysis.toObject() : {
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
      answer: aiResult.answer,
      diagnosis: aiResult.diagnosis
    };

    // Generate Action Plan Tasks
    const actionTasks = [
      {
        farmerId: userId,
        cropId: activeCrop ? activeCrop._id : null,
        cropAnalysisId: analysis ? analysis._id : null,
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
        cropAnalysisId: analysis ? analysis._id : null,
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
        cropAnalysisId: analysis ? analysis._id : null,
        title: `Evaluate recovery and monitor disease progression`,
        titleHi: `फसल सुधार की जांच करें और नए लक्षणों की निगरानी करें`,
        description: 'Re-inspect leaf undersides and verify disease arrest.',
        dayLabel: 'DAY 5',
        priority: 'Medium',
        category: 'Inspection',
      }
    ];

    if (userId) {
      try {
        await ActionPlan.insertMany(actionTasks);
      } catch (taskErr) {
        console.warn('Action plan insert skipped:', taskErr.message);
      }

      if (['High', 'Critical'].includes(aiResult.severity)) {
        try {
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
        } catch (alertErr) {
          console.warn('Alert creation skipped:', alertErr.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Crop analysis completed successfully!',
      data: responseData,
      generatedTasks: actionTasks,
    });
  } catch (error) {
    console.error('Scan crop error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error processing crop scan.' });
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
