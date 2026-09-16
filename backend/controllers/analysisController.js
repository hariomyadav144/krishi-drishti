const fs = require('fs');
const CropAnalysis = require('../models/CropAnalysis');
const CropScan = require('../models/CropScan');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const Alert = require('../models/Alert');
const { analyzeCropImage } = require('../services/aiVisionService');
const { diagnoseCropWithGemini } = require('../services/geminiService');
const { isDbConnected, getStatelessPreviousScan, createStatelessCropScan } = require('../utils/statelessStore');

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

    // Language selection from frontend (defaults to 'hi')
    const language = req.body.language || 'hi';

    // Get active crop record if available (used only for context if needed, NEVER as forced override)
    let activeCrop = null;
    if (userId) {
      try {
        activeCrop = await Crop.findOne({ farmerId: userId, isCurrent: true });
      } catch (dbErr) {
        console.warn('Crop lookup warning:', dbErr.message);
      }
    }

    let aiResult = null;

    // If image buffer and GEMINI_API_KEY exist, use real Gemini Multimodal Vision
    if (imageBuffer && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
      try {
        const geminiVision = await diagnoseCropWithGemini({
          imageBuffer,
          mimeType,
          question: question || symptomDescription || '',
          crop: '', // Auto-detect crop from image
          cropStage: activeCrop?.cropStage || '',
          language
        });

        // Handle low-confidence / unclear image flagged by AI
        if (geminiVision && geminiVision.isIdentifiable === false) {
          return res.status(200).json({
            success: true,
            isIdentifiable: false,
            message: geminiVision.unclearMessage,
            data: {
              isIdentifiable: false,
              unclearMessage: geminiVision.unclearMessage,
              cropName: null,
              detectedProblem: null,
              imageUrl,
              confidence: 0,
              severity: 'None'
            }
          });
        }

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

    // If Gemini Vision wasn't used or failed, use built-in agronomy pathology engine with auto-detection
    if (!aiResult) {
      aiResult = await analyzeCropImage({
        cropName: cropName && cropName !== 'Tomato' ? cropName : '',
        symptomDescription: symptomDescription || '',
        originalname,
        filename,
        language
      });
    }

    // Handle low-confidence / unclear image flagged by AI
    if (aiResult && aiResult.isIdentifiable === false) {
      return res.status(200).json({
        success: true,
        isIdentifiable: false,
        message: aiResult.unclearMessage,
        data: {
          isIdentifiable: false,
          unclearMessage: aiResult.unclearMessage,
          cropName: null,
          detectedProblem: null,
          imageUrl,
          confidence: 0,
          severity: 'None'
        }
      });
    }

    // Dynamic detected crop name (never hardcoded Tomato)
    const detectedCropName = aiResult.cropName || (language === 'en' ? 'Identified Crop' : 'पहचानी गई फसल');

    // Query for previous scan context
    let previousScan = null;
    let savedCropScan = null;
    if (userId) {
      const scanPayload = {
        farmerId: userId,
        cropName: detectedCropName,
        cropVariety: activeCrop?.variety || 'Standard Variety',
        cropStage: activeCrop?.cropStage || 'Vegetative Stage',
        imageUrl,
        thumbnailUrl: imageUrl,
        symptomDescription: symptomDescription || '',
        detectedProblem: aiResult.detectedProblem || 'Foliage Inspection',
        detectedProblemHi: aiResult.detectedProblemHi || '',
        confidence: aiResult.confidence || 90,
        severity: aiResult.severity || 'Medium',
        healthStatus: aiResult.severity === 'None (Healthy)' ? 'Healthy' : (aiResult.severity === 'Low' ? 'Good' : (aiResult.severity === 'Critical' ? 'Critical' : 'Moderate')),
        healthScore: aiResult.severity === 'None (Healthy)' ? 95 : (aiResult.severity === 'Low' ? 85 : (aiResult.severity === 'Critical' ? 30 : 65)),
        symptoms: aiResult.symptoms || [],
        cause: aiResult.cause || '',
        causeHi: aiResult.causeHi || '',
        diagnosis: aiResult.diagnosis || aiResult.cause || '',
        recommendedTreatment: {
          organic: aiResult.organicTreatment || '',
          chemical: aiResult.chemicalTreatment || '',
          general: aiResult.recommendedAction || '',
          timeline: aiResult.nextActionTimeline || 'Inspect within 48h'
        },
        scanDate: new Date(),
        rawAiReport: aiResult
      };

      if (isDbConnected()) {
        try {
          previousScan = await CropScan.findOne({
            farmerId: userId,
            cropName: detectedCropName
          }).sort({ scanDate: -1, createdAt: -1 });

          savedCropScan = await CropScan.create({
            ...scanPayload,
            previousScanId: previousScan ? previousScan._id : null
          });
        } catch (scanErr) {
          console.warn('CropScan save warning:', scanErr.message);
        }
      } else {
        previousScan = getStatelessPreviousScan(userId, detectedCropName);
        savedCropScan = createStatelessCropScan({
          ...scanPayload,
          previousScanId: previousScan ? previousScan._id : null
        });
      }
    }

    // Save Analysis Record if DB available and user is authenticated
    let analysis = null;
    if (userId) {
      try {
        analysis = await CropAnalysis.create({
          farmerId: userId,
          cropId: activeCrop ? activeCrop._id : null,
          cropName: detectedCropName,
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

      // Automatically recalculate real-time crop health in background
      try {
        const { calculateCropHealth } = require('../services/cropHealthEngine');
        calculateCropHealth({ farmerId: userId, fieldId: savedCropScan?.fieldId || null })
          .catch(e => console.warn('Crop health auto-update note:', e.message));
      } catch (_) {}
    }

    const responseData = analysis ? analysis.toObject() : {
      isIdentifiable: true,
      cropName: detectedCropName,
      imageUrl,
      symptomDescription: symptomDescription || '',
      detectedProblem: aiResult.detectedProblem,
      detectedProblemHi: aiResult.detectedProblemHi,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      whatAiFound: aiResult.whatAiFound || aiResult.cause,
      cause: aiResult.cause,
      causeHi: aiResult.causeHi,
      symptoms: aiResult.symptoms,
      recommendedAction: aiResult.recommendedAction,
      recommendedActionHi: aiResult.recommendedActionHi,
      organicTreatment: aiResult.organicTreatment,
      chemicalTreatment: aiResult.chemicalTreatment,
      preventionTips: aiResult.preventionTips,
      importantNote: aiResult.importantNote,
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
        title: `Isolate and inspect affected ${detectedCropName} foliage`,
        titleHi: `प्रभावित ${detectedCropName} की पत्तियों की छंटाई व निरीक्षण करें`,
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
            message: `High severity detected on ${detectedCropName}. Action required within 24 hours.`,
            messageHi: `${detectedCropName} पर गंभीर लक्षण पाए गए हैं। 24 घंटे के भीतर उपचार करें।`,
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
      message: 'Crop analysis completed and permanently saved to history!',
      data: responseData,
      savedScanId: savedCropScan ? savedCropScan._id : null,
      previousScan: previousScan ? {
        _id: previousScan._id,
        scanDate: previousScan.scanDate,
        healthStatus: previousScan.healthStatus,
        detectedProblem: previousScan.detectedProblem,
        imageUrl: previousScan.imageUrl
      } : null,
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
