const CropAnalysis = require('../models/CropAnalysis');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Crop = require('../models/Crop');
const ActionPlan = require('../models/ActionPlan');

// @desc Get all pending crop problem cases for experts
// @route GET /api/expert/cases
const getExpertCases = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let query = {};
    if (status === 'pending') {
      query.expertReviewed = false;
    } else if (status === 'reviewed') {
      query.expertReviewed = true;
    }

    const cases = await CropAnalysis.find(query)
      .populate('farmerId', 'name phone email')
      .populate('cropId', 'cropName variety cropStage healthStatus')
      .sort({ createdAt: -1 });

    const stats = {
      totalCases: await CropAnalysis.countDocuments(),
      pendingReview: await CropAnalysis.countDocuments({ expertReviewed: false }),
      criticalCases: await CropAnalysis.countDocuments({ severity: 'Critical' }),
      resolvedCases: await CropAnalysis.countDocuments({ expertReviewed: true }),
    };

    res.json({
      success: true,
      stats,
      data: cases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Submit expert prescription and advisory
// @route POST /api/expert/prescribe
const submitPrescription = async (req, res) => {
  try {
    const { analysisId, expertNotes, verifiedDiagnosis, additionalTreatment, urgency = 'high' } = req.body;

    const analysis = await CropAnalysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Crop analysis case not found' });
    }

    analysis.expertReviewed = true;
    analysis.expertNotes = expertNotes || 'Validated by Agricultural Scientist.';
    if (verifiedDiagnosis) {
      analysis.detectedProblem = verifiedDiagnosis;
    }
    if (additionalTreatment) {
      analysis.chemicalTreatment = `${analysis.chemicalTreatment}\n\n[Expert Note]: ${additionalTreatment}`;
    }
    analysis.reviewedBy = req.user._id;
    await analysis.save();

    // Send priority alert to the farmer
    await Alert.create({
      userId: analysis.farmerId,
      title: `Expert Advisory from ${req.user.name}`,
      titleHi: `कृषि विशेषज्ञ ${req.user.name} की ओर से सलाह`,
      message: `Prescription updated for your ${analysis.cropName}: ${expertNotes}`,
      messageHi: `आपकी ${analysis.cropName} फसल के लिए विशेषज्ञ की नई सलाह उपलब्ध है: ${expertNotes}`,
      priority: urgency === 'critical' ? 'critical' : 'high',
      category: 'crop_health',
      actionUrl: `/diagnose`,
    });

    // Add actionable expert task
    await ActionPlan.create({
      farmerId: analysis.farmerId,
      cropAnalysisId: analysis._id,
      title: `[Expert Advice] ${expertNotes.substring(0, 50)}...`,
      titleHi: `[विशेषज्ञ सलाह] उपचार लागू करें`,
      description: additionalTreatment || expertNotes,
      dayLabel: 'TODAY',
      priority: 'High',
      category: 'Pest Management',
    });

    res.json({
      success: true,
      message: 'Expert prescription sent to farmer successfully!',
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExpertCases,
  submitPrescription,
};
