const fs = require('fs');
const CropScan = require('../models/CropScan');
const CropComparison = require('../models/CropComparison');
const CropAnalysis = require('../models/CropAnalysis');
const Field = require('../models/Field');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');
const Alert = require('../models/Alert');
const { analyzeCropImage } = require('../services/aiVisionService');
const { diagnoseCropWithGemini } = require('../services/geminiService');
const { generateComparativeAnalysis, getScore } = require('../services/cropComparisonService');
const {
  isDbConnected,
  getStatelessCropScans,
  getStatelessCropScanById,
  createStatelessCropScan,
  deleteStatelessCropScan,
  getStatelessCropHistoryStats,
  getStatelessCropTimeline,
  getStatelessCropComparison,
  getStatelessPreviousScan
} = require('../utils/statelessStore');

/**
 * @desc Create and save a permanent crop scan analysis
 * @route POST /api/crop-scans
 */
const createCropScan = async (req, res) => {
  try {
    const farmerId = req.user ? req.user._id : null;
    if (!farmerId) {
      return res.status(401).json({ success: false, message: 'Authentication required to save crop scan.' });
    }

    const {
      cropName: providedCropName,
      fieldId,
      fieldName: providedFieldName,
      cropVariety,
      cropStage,
      symptomDescription,
      sampleImageUrl,
      language = 'hi'
    } = req.body;

    // Resolve Image URL and Buffer
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
        console.warn('Could not read uploaded image buffer:', readErr.message);
      }
    } else if (sampleImageUrl) {
      imageUrl = sampleImageUrl;
      filename = sampleImageUrl;
    }

    // Resolve Field if provided
    let field = null;
    let resolvedFieldName = providedFieldName || 'General Plot';
    if (fieldId) {
      try {
        field = await Field.findOne({ _id: fieldId, farmerId });
        if (field) {
          resolvedFieldName = field.fieldName;
        }
      } catch (fieldErr) {
        console.warn('Field lookup warning:', fieldErr.message);
      }
    }

    // AI Multimodal Vision Analysis (Auto-Detect Crop & Disease)
    let aiResult = null;

    if (imageBuffer && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
      try {
        const geminiVision = await diagnoseCropWithGemini({
          imageBuffer,
          mimeType,
          question: symptomDescription || '',
          crop: providedCropName || (field ? field.crop : ''),
          cropStage: cropStage || '',
          language
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

    // Agronomy pathology engine fallback with auto-detection
    if (!aiResult) {
      aiResult = await analyzeCropImage({
        cropName: providedCropName || (field ? field.crop : ''),
        symptomDescription: symptomDescription || '',
        originalname,
        filename,
        language
      });
    }

    // Final detected crop name (Auto-detected if farmer didn't specify)
    const detectedCropName = providedCropName || aiResult.cropName || (language === 'en' ? 'Identified Crop' : 'पहचानी गई फसल');

    // Check for previous scan of this crop/field to link context
    let previousScan = null;
    if (isDbConnected()) {
      try {
        previousScan = await CropScan.findOne({
          farmerId,
          cropName: detectedCropName,
          ...(fieldId ? { fieldId } : {})
        }).sort({ createdAt: -1 });
      } catch (prevErr) {
        console.warn('Previous scan lookup warning:', prevErr.message);
      }
    } else {
      previousScan = getStatelessPreviousScan(farmerId, detectedCropName);
    }

    // Determine Health Score & Status
    const confidence = aiResult.confidence || 90;
    const severity = aiResult.severity || 'Medium';
    let healthStatus = 'Moderate';
    let healthScore = 75;

    if (severity === 'None (Healthy)') {
      healthStatus = 'Healthy';
      healthScore = 95;
    } else if (severity === 'Low') {
      healthStatus = 'Good';
      healthScore = 85;
    } else if (severity === 'Medium') {
      healthStatus = 'Moderate';
      healthScore = 65;
    } else if (severity === 'High') {
      healthStatus = 'Needs Attention';
      healthScore = 45;
    } else if (severity === 'Critical') {
      healthStatus = 'Critical';
      healthScore = 25;
    }

    if (!isDbConnected()) {
      const statelessScan = createStatelessCropScan({
        farmerId,
        fieldId: fieldId || 'field_demo_01',
        fieldName: resolvedFieldName,
        cropName: detectedCropName,
        cropVariety: cropVariety || 'Standard Variety',
        cropStage: cropStage || 'Vegetative Stage',
        imageUrl,
        thumbnailUrl: imageUrl,
        symptomDescription: symptomDescription || '',
        detectedProblem: aiResult.detectedProblem || 'Foliage Inspection',
        detectedProblemHi: aiResult.detectedProblemHi || '',
        confidence,
        severity,
        healthStatus,
        healthScore,
        symptoms: aiResult.symptoms || [],
        cause: aiResult.cause || '',
        causeHi: aiResult.causeHi || '',
        diagnosis: aiResult.diagnosis || aiResult.cause || '',
        diagnosisHi: aiResult.causeHi || '',
        recommendedTreatment: {
          organic: aiResult.organicTreatment || '',
          chemical: aiResult.chemicalTreatment || '',
          general: aiResult.recommendedAction || '',
          timeline: aiResult.nextActionTimeline || 'Apply treatment within 24-48 hours and re-inspect.'
        },
        fertilizerRecommendation: aiResult.fertilizerRecommendation || 'Apply balanced NPK with organic compost',
        irrigationRecommendation: aiResult.irrigationRecommendation || 'Maintain standard drip schedule; avoid excess moisture',
        previousScanId: previousScan ? previousScan._id : null,
        scanDate: new Date(),
        rawAiReport: aiResult
      });

      return res.status(201).json({
        success: true,
        message: 'Crop scan permanently saved to farmer history.',
        data: statelessScan,
        previousScan: previousScan ? {
          _id: previousScan._id,
          scanDate: previousScan.scanDate,
          healthStatus: previousScan.healthStatus,
          detectedProblem: previousScan.detectedProblem
        } : null
      });
    }

    // Create and save permanent CropScan record in MongoDB Atlas
    const cropScanRecord = await CropScan.create({
      farmerId,
      fieldId: field ? field._id : null,
      fieldName: resolvedFieldName,
      cropName: detectedCropName,
      cropVariety: cropVariety || 'Standard Variety',
      cropStage: cropStage || 'Vegetative Stage',
      imageUrl,
      thumbnailUrl: imageUrl,
      symptomDescription: symptomDescription || '',
      detectedProblem: aiResult.detectedProblem || 'Foliage Inspection',
      detectedProblemHi: aiResult.detectedProblemHi || '',
      confidence,
      severity,
      healthStatus,
      healthScore,
      symptoms: aiResult.symptoms || [],
      cause: aiResult.cause || '',
      causeHi: aiResult.causeHi || '',
      diagnosis: aiResult.diagnosis || aiResult.cause || '',
      diagnosisHi: aiResult.causeHi || '',
      recommendedTreatment: {
        organic: aiResult.organicTreatment || '',
        chemical: aiResult.chemicalTreatment || '',
        general: aiResult.recommendedAction || '',
        timeline: aiResult.nextActionTimeline || 'Apply treatment within 24-48 hours and re-inspect.'
      },
      fertilizerRecommendation: aiResult.fertilizerRecommendation || 'Apply balanced NPK with organic compost',
      irrigationRecommendation: aiResult.irrigationRecommendation || 'Maintain standard drip schedule; avoid excess moisture',
      weatherInfo: {
        temperature: 28,
        humidity: 65,
        condition: 'Partly Cloudy',
        rainProbability: 15
      },
      soilInfo: {
        soilType: field?.soilType || 'Black Soil / Regur',
        soilPh: 6.8,
        moisture: 'Adequate'
      },
      previousScanId: previousScan ? previousScan._id : null,
      scanDate: new Date(),
      rawAiReport: aiResult
    });

    // Also mirror to CropAnalysis collection for backward compatibility with existing views
    try {
      await CropAnalysis.create({
        farmerId,
        cropName: detectedCropName,
        imageUrl,
        symptomDescription: symptomDescription || '',
        detectedProblem: aiResult.detectedProblem,
        detectedProblemHi: aiResult.detectedProblemHi,
        confidence,
        severity,
        cause: aiResult.cause || '',
        causeHi: aiResult.causeHi || '',
        symptoms: aiResult.symptoms || [],
        recommendedAction: aiResult.recommendedAction || '',
        recommendedActionHi: aiResult.recommendedActionHi || '',
        organicTreatment: aiResult.organicTreatment || '',
        chemicalTreatment: aiResult.chemicalTreatment || '',
        preventionTips: aiResult.preventionTips || [],
        nextActionTimeline: aiResult.nextActionTimeline || 'Re-inspect on Day 4.'
      });
    } catch (mirrorErr) {
      console.warn('CropAnalysis mirror skipped:', mirrorErr.message);
    }

    // Generate actionable tasks in ActionPlan
    try {
      await ActionPlan.create({
        farmerId,
        title: `Inspect ${detectedCropName} (${aiResult.detectedProblem})`,
        titleHi: `${detectedCropName} में ${aiResult.detectedProblemHi || aiResult.detectedProblem} का निरीक्षण`,
        description: aiResult.recommendedAction || 'Monitor symptoms on lower and middle leaves.',
        dayLabel: 'TODAY',
        priority: ['High', 'Critical'].includes(severity) ? 'High' : 'Medium',
        category: 'Pest Management'
      });
    } catch (planErr) {
      console.warn('Action plan creation warning:', planErr.message);
    }

    // Critical Alert if high severity
    if (['High', 'Critical'].includes(severity)) {
      try {
        await Alert.create({
          userId: farmerId,
          title: `Crop Alert: ${aiResult.detectedProblem}`,
          titleHi: `फसल चेतावनी: ${aiResult.detectedProblemHi || aiResult.detectedProblem}`,
          message: `High severity detected on ${detectedCropName}. Action required within 24 hours.`,
          messageHi: `${detectedCropName} पर गंभीर लक्षण पाए गए हैं। 24 घंटे के भीतर उपचार करें।`,
          priority: 'critical',
          category: 'crop_health',
          actionUrl: `#/history`
        });
      } catch (alertErr) {
        console.warn('Alert creation warning:', alertErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Crop scan permanently saved to MongoDB Atlas.',
      data: cropScanRecord,
      previousScan: previousScan ? {
        _id: previousScan._id,
        scanDate: previousScan.scanDate,
        healthStatus: previousScan.healthStatus,
        detectedProblem: previousScan.detectedProblem
      } : null
    });
  } catch (error) {
    console.error('Create crop scan error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing and saving crop scan.'
    });
  }
};

/**
 * @desc Get all crop scans for the authenticated farmer with filtering
 * @route GET /api/crop-scans
 * @route GET /api/crop-scans/:farmerId
 */
const getCropScans = async (req, res) => {
  try {
    const authenticatedFarmerId = req.user._id;
    const requestedFarmerId = req.params.farmerId;

    // Enforce strict multi-tenant isolation:
    // A farmer can NEVER access another farmer's records.
    if (requestedFarmerId && requestedFarmerId !== authenticatedFarmerId.toString() && req.user.role === 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access. You can only view your own crop history.'
      });
    }

    const targetFarmerId = (req.user.role === 'admin' || req.user.role === 'expert') && requestedFarmerId
      ? requestedFarmerId
      : authenticatedFarmerId;

    if (!isDbConnected()) {
      const scans = getStatelessCropScans(targetFarmerId, {
        crop: req.params.cropName || req.query.crop,
        fieldId: req.query.fieldId,
        healthStatus: req.query.healthStatus,
        severity: req.query.severity,
        search: req.query.search
      });
      return res.status(200).json({
        success: true,
        count: scans.length,
        data: scans
      });
    }

    // Build filter query
    const query = { farmerId: targetFarmerId };

    const cropName = req.params.cropName || req.query.crop;
    if (cropName && cropName !== 'All') {
      query.cropName = new RegExp(`^${cropName.trim()}`, 'i');
    }

    if (req.query.fieldId && req.query.fieldId !== 'All') {
      query.fieldId = req.query.fieldId;
    }

    if (req.query.healthStatus && req.query.healthStatus !== 'All') {
      query.healthStatus = req.query.healthStatus;
    }

    if (req.query.severity && req.query.severity !== 'All') {
      query.severity = req.query.severity;
    }

    // Date range filtering (supports 30d, 90d, 180d, 365d, or custom dates)
    if (req.query.dateRange && req.query.dateRange !== 'all') {
      const now = new Date();
      let pastDate = new Date();
      if (req.query.dateRange === '30d') {
        pastDate.setDate(now.getDate() - 30);
      } else if (req.query.dateRange === '90d') {
        pastDate.setDate(now.getDate() - 90);
      } else if (req.query.dateRange === '180d') {
        pastDate.setDate(now.getDate() - 180);
      } else if (req.query.dateRange === '365d') {
        pastDate.setDate(now.getDate() - 365);
      }
      query.scanDate = { $gte: pastDate };
    } else if (req.query.startDate || req.query.endDate) {
      query.scanDate = {};
      if (req.query.startDate) query.scanDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.scanDate.$lte = new Date(req.query.endDate);
    }

    // Search query (disease or crop)
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { cropName: regex },
        { detectedProblem: regex },
        { detectedProblemHi: regex },
        { fieldName: regex }
      ];
    }

    const scans = await CropScan.find(query)
      .populate('fieldId', 'fieldName areaAcres soilType')
      .sort({ scanDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (error) {
    console.error('Get crop scans error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single crop scan by ID with security ownership check
 * @route GET /api/crop-scans/:farmerId/:scanId
 * @route GET /api/crop-scans/detail/:scanId
 */
const getCropScanById = async (req, res) => {
  try {
    const scanId = req.params.scanId || req.params.id;

    if (!isDbConnected()) {
      const scan = getStatelessCropScanById(scanId);
      if (!scan) {
        return res.status(404).json({ success: false, message: 'Crop scan record not found.' });
      }
      return res.status(200).json({ success: true, data: scan });
    }

    const scan = await CropScan.findById(scanId).populate('fieldId');

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Crop scan record not found.' });
    }

    // Verify ownership
    if (scan.farmerId.toString() !== req.user._id.toString() && req.user.role === 'farmer') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not have access to this record.' });
    }

    return res.status(200).json({ success: true, data: scan });
  } catch (error) {
    console.error('Get crop scan by id error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Compare two crop scans (Old Scan + New Scan) with 10-point analysis
 * @route POST /api/crop-scans/compare
 */
const compareCropScans = async (req, res) => {
  try {
    const farmerId = req.user._id;
    const { oldScanId, newScanId, language = 'hi' } = req.body;

    if (!oldScanId || !newScanId) {
      return res.status(400).json({
        success: false,
        message: 'Both oldScanId and newScanId are required for comparison.'
      });
    }

    if (oldScanId === newScanId) {
      return res.status(400).json({
        success: false,
        message: 'Please select two different historical scans to compare.'
      });
    }

    if (!isDbConnected()) {
      const result = getStatelessCropComparison(oldScanId, newScanId, language);
      return res.status(200).json({
        success: true,
        data: result
      });
    }

    // Retrieve both scans from MongoDB Atlas
    const [scanA, scanB] = await Promise.all([
      CropScan.findById(oldScanId),
      CropScan.findById(newScanId),
    ]);

    if (!scanA || !scanB) {
      return res.status(404).json({
        success: false,
        message: 'One or both scan records were not found in the database.'
      });
    }

    // Strict multi-tenant check: both scans must belong to the requesting farmer (or expert/admin)
    if (req.user.role === 'farmer') {
      if (scanA.farmerId.toString() !== farmerId.toString() || scanB.farmerId.toString() !== farmerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. You can only compare scans belonging to your farm.'
        });
      }
    }

    // Order scans chronologically (older scan vs newer scan)
    const dateA = new Date(scanA.scanDate || scanA.createdAt);
    const dateB = new Date(scanB.scanDate || scanB.createdAt);
    const [oldScan, newScan] = dateA <= dateB ? [scanA, scanB] : [scanB, scanA];

    // Generate deep agronomy comparison across all 10 points
    const comparisonResult = await generateComparativeAnalysis({
      oldScan,
      newScan,
      language
    });

    // Save permanent CropComparison record in MongoDB Atlas
    let comparisonRecord = null;
    try {
      comparisonRecord = await CropComparison.create({
        farmerId,
        cropName: newScan.cropName,
        fieldId: newScan.fieldId || null,
        fieldName: newScan.fieldName || 'General Plot',
        oldScanId: oldScan._id,
        newScanId: newScan._id,
        comparisonResult,
        comparisonDate: new Date()
      });
    } catch (compErr) {
      console.warn('CropComparison save skipped:', compErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        comparisonId: comparisonRecord ? comparisonRecord._id : null,
        cropName: newScan.cropName,
        fieldName: newScan.fieldName,
        oldScan: {
          _id: oldScan._id,
          date: oldScan.scanDate,
          imageUrl: oldScan.imageUrl,
          cropName: oldScan.cropName,
          cropVariety: oldScan.cropVariety,
          cropStage: oldScan.cropStage,
          healthStatus: oldScan.healthStatus,
          severity: oldScan.severity,
          healthScore: getScore(oldScan),
          detectedProblem: oldScan.detectedProblem,
          detectedProblemHi: oldScan.detectedProblemHi,
          symptoms: oldScan.symptoms,
          diagnosis: oldScan.diagnosis,
          treatment: oldScan.recommendedTreatment
        },
        newScan: {
          _id: newScan._id,
          date: newScan.scanDate,
          imageUrl: newScan.imageUrl,
          cropName: newScan.cropName,
          cropVariety: newScan.cropVariety,
          cropStage: newScan.cropStage,
          healthStatus: newScan.healthStatus,
          severity: newScan.severity,
          healthScore: getScore(newScan),
          detectedProblem: newScan.detectedProblem,
          detectedProblemHi: newScan.detectedProblemHi,
          symptoms: newScan.symptoms,
          diagnosis: newScan.diagnosis,
          treatment: newScan.recommendedTreatment
        },
        comparison: comparisonResult
      }
    });
  } catch (error) {
    console.error('Compare crop scans error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error generating crop comparison.' });
  }
};

/**
 * @desc Get chronological health progression timeline for a crop
 * @route GET /api/crop-scans/timeline/:cropName
 */
const getCropTimeline = async (req, res) => {
  try {
    const farmerId = req.user._id;
    const cropName = req.params.cropName;

    if (!isDbConnected()) {
      const timeline = getStatelessCropTimeline(cropName);
      return res.status(200).json({
        success: true,
        cropName,
        totalScans: timeline.length,
        timeline
      });
    }

    const scans = await CropScan.find({
      farmerId,
      cropName: new RegExp(`^${cropName.trim()}`, 'i')
    }).sort({ scanDate: 1 });

    const timeline = scans.map((scan, idx) => ({
      step: idx + 1,
      scanId: scan._id,
      date: scan.scanDate,
      cropStage: scan.cropStage,
      healthStatus: scan.healthStatus,
      severity: scan.severity,
      healthScore: getScore(scan),
      detectedProblem: scan.detectedProblem,
      detectedProblemHi: scan.detectedProblemHi,
      imageUrl: scan.imageUrl,
      treatmentTimeline: scan.recommendedTreatment?.timeline || ''
    }));

    return res.status(200).json({
      success: true,
      cropName,
      totalScans: timeline.length,
      timeline
    });
  } catch (error) {
    console.error('Crop timeline error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete a crop scan with ownership verification
 * @route DELETE /api/crop-scans/:scanId
 */
const deleteCropScan = async (req, res) => {
  try {
    const scanId = req.params.scanId;

    if (!isDbConnected()) {
      deleteStatelessCropScan(scanId);
      return res.status(200).json({
        success: true,
        message: 'Crop scan record permanently removed from history.'
      });
    }

    const scan = await CropScan.findById(scanId);

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Crop scan record not found.' });
    }

    if (scan.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. You cannot delete this record.' });
    }

    await CropScan.findByIdAndDelete(scanId);

    return res.status(200).json({
      success: true,
      message: 'Crop scan record permanently removed from history.'
    });
  } catch (error) {
    console.error('Delete crop scan error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get summary stats for the Farmer Dashboard widget
 * @route GET /api/crop-scans/stats
 */
const getCropHistoryStats = async (req, res) => {
  try {
    const farmerId = req.user._id;

    if (!isDbConnected()) {
      const stats = getStatelessCropHistoryStats(farmerId);
      return res.status(200).json({
        success: true,
        data: stats
      });
    }

    const [totalScans, healthyCount, attentionCount, recentScans, uniqueCrops] = await Promise.all([
      CropScan.countDocuments({ farmerId }),
      CropScan.countDocuments({ farmerId, healthStatus: { $in: ['Healthy', 'Good'] } }),
      CropScan.countDocuments({ farmerId, healthStatus: { $in: ['Moderate', 'Needs Attention', 'Critical', 'Diseased'] } }),
      CropScan.find({ farmerId }).sort({ scanDate: -1 }).limit(4),
      CropScan.distinct('cropName', { farmerId })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalScans,
        healthyCount,
        attentionCount,
        activeCropsCount: uniqueCrops.length,
        uniqueCrops,
        recentScans,
        lastScanDate: recentScans[0]?.scanDate || null
      }
    });
  } catch (error) {
    console.error('Get history stats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCropScan,
  getCropScans,
  getCropScanById,
  compareCropScans,
  getCropTimeline,
  deleteCropScan,
  getCropHistoryStats
};
