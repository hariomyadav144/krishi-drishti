const Feedback = require('../models/Feedback');
const Recommendation = require('../models/Recommendation');
const CropAnalysis = require('../models/CropAnalysis');

// @desc Submit feedback on recommendation or diagnosis
// @route POST /api/feedback
const submitFeedback = async (req, res) => {
  try {
    const { recommendationId, cropAnalysisId, rating, comments, cropName } = req.body;

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Please provide a feedback rating (helped, partially_helped, not_helped).' });
    }

    const feedback = await Feedback.create({
      farmerId: req.user._id,
      recommendationId: recommendationId || null,
      cropAnalysisId: cropAnalysisId || null,
      rating,
      comments: comments || '',
      cropName: cropName || 'General',
    });

    // Update recommendation feedback status if present
    if (recommendationId) {
      await Recommendation.findByIdAndUpdate(recommendationId, {
        feedbackStatus: rating,
        feedbackComment: comments || '',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback helps Krishi Drishti provide smarter advice for all farmers.',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get feedback statistics
// @route GET /api/feedback/stats
const getFeedbackStats = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    const total = feedbacks.length;
    const helped = feedbacks.filter(f => f.rating === 'helped').length;
    const partially = feedbacks.filter(f => f.rating === 'partially_helped').length;
    const notHelped = feedbacks.filter(f => f.rating === 'not_helped').length;

    const satisfactionRate = total > 0 ? Math.round(((helped + partially * 0.5) / total) * 100) : 92;

    res.json({
      success: true,
      data: {
        total,
        helped,
        partially,
        notHelped,
        satisfactionRate,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackStats,
};
