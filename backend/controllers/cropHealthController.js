const CropHealthRecord = require('../models/CropHealthRecord');
const Field = require('../models/Field');
const { calculateCropHealth } = require('../services/cropHealthEngine');
const { 
  isDbConnected,
  getStatelessFields, 
  getStatelessLatestHealthRecord,
  getStatelessHealthHistory
} = require('../utils/statelessStore');

/**
 * @desc Get latest real-time calculated crop health snapshot for a field
 * @route GET /api/crop-health/latest/:fieldId?
 */
const getLatestCropHealth = async (req, res) => {
  try {
    const farmerId = req.user._id;
    let { fieldId } = req.params;

    if (fieldId === 'default' || !fieldId) {
      if (isDbConnected()) {
        const firstField = await Field.findOne({ farmerId }).sort({ updatedAt: -1 });
        fieldId = firstField?._id || 'field_demo_01';
      } else {
        const fields = getStatelessFields();
        fieldId = fields[0]?._id || 'field_demo_01';
      }
    }

    let record = null;
    if (isDbConnected()) {
      record = await CropHealthRecord.findOne({ farmerId, fieldId }).sort({ calculatedAt: -1 });
    } else {
      record = getStatelessLatestHealthRecord(fieldId, farmerId);
    }

    // If no calculation snapshot exists yet, calculate dynamically now
    if (!record) {
      record = await calculateCropHealth({ farmerId, fieldId });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching latest crop health:', error);
    // Safe graceful calculation fallback
    try {
      const fallbackRecord = await calculateCropHealth({ 
        farmerId: req.user?._id || 'usr_farmer_demo_01', 
        fieldId: req.params?.fieldId || 'field_demo_01' 
      });
      return res.status(200).json({
        success: true,
        data: fallbackRecord
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: 'Unable to calculate crop health',
        error: error.message
      });
    }
  }
};

/**
 * @desc Get multi-field crop health summary for all fields of the logged-in farmer
 * @route GET /api/crop-health/summary
 */
const getCropHealthSummary = async (req, res) => {
  try {
    const farmerId = req.user._id;
    let fields = [];

    if (isDbConnected()) {
      fields = await Field.find({ farmerId }).lean();
    } else {
      fields = getStatelessFields();
    }

    if (!fields || fields.length === 0) {
      fields = [{
        _id: 'field_demo_01',
        fieldName: 'Plot A - Main Wheat Field',
        crop: 'Wheat',
        cropStage: 'Vegetative Stage'
      }];
    }

    const summaries = await Promise.all(
      fields.map(async (f) => {
        const fieldId = f._id || f.id;
        let latestRecord = null;

        if (isDbConnected()) {
          latestRecord = await CropHealthRecord.findOne({ farmerId, fieldId }).sort({ calculatedAt: -1 }).lean();
        } else {
          latestRecord = getStatelessLatestHealthRecord(fieldId, farmerId);
        }

        if (!latestRecord) {
          latestRecord = await calculateCropHealth({ farmerId, fieldId, fieldDoc: f });
        }

        return {
          fieldId,
          fieldName: f.fieldName || latestRecord?.fieldName || 'Plot',
          crop: f.crop || latestRecord?.crop || 'Wheat',
          cropStage: f.cropStage || latestRecord?.cropStage || 'Vegetative Stage',
          healthScore: latestRecord?.healthScore || 75,
          status: latestRecord?.status || 'Healthy',
          statusHi: latestRecord?.statusHi || 'स्वस्थ',
          confidence: latestRecord?.confidence || 'Medium',
          lastUpdated: latestRecord?.calculatedAt || new Date().toISOString()
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: summaries.length,
      data: summaries
    });
  } catch (error) {
    console.error('Error in getCropHealthSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve multi-field health summary',
      error: error.message
    });
  }
};

/**
 * @desc Get historical crop health progress for time-series charting
 * @route GET /api/crop-health/history/:fieldId
 */
const getCropHealthHistory = async (req, res) => {
  try {
    const farmerId = req.user._id;
    const { fieldId } = req.params;
    const { period = '30d' } = req.query;

    if (!isDbConnected()) {
      const records = getStatelessHealthHistory(fieldId, period);
      return res.status(200).json({
        success: true,
        count: records.length,
        period,
        data: records
      });
    }

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d' || period === '3m') days = 90;
    else if (period === 'all') days = 365 * 2;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let records = await CropHealthRecord.find({
      farmerId,
      fieldId,
      calculatedAt: { $gte: cutoff }
    }).sort({ calculatedAt: 1 }).lean();

    // If very few records exist, generate initial point so farmer immediately sees a chart
    if (records.length === 0) {
      const initial = await calculateCropHealth({ farmerId, fieldId });
      records = [initial];
    }

    return res.status(200).json({
      success: true,
      count: records.length,
      period,
      data: records
    });
  } catch (error) {
    console.error('Error fetching crop health history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load crop health history',
      error: error.message
    });
  }
};

/**
 * @desc Force dynamic recalculation of crop health snapshot
 * @route POST /api/crop-health/recalculate/:fieldId?
 */
const recalculateCropHealth = async (req, res) => {
  try {
    const farmerId = req.user._id;
    let { fieldId } = req.params;

    if (fieldId === 'default' || !fieldId) {
      if (isDbConnected()) {
        const firstField = await Field.findOne({ farmerId }).sort({ updatedAt: -1 });
        fieldId = firstField?._id || 'field_demo_01';
      } else {
        const fields = getStatelessFields();
        fieldId = fields[0]?._id || 'field_demo_01';
      }
    }

    const newSnapshot = await calculateCropHealth({ farmerId, fieldId });

    return res.status(201).json({
      success: true,
      message: 'Crop health recalculated successfully from latest available data.',
      data: newSnapshot
    });
  } catch (error) {
    console.error('Error recalculating crop health:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to recalculate crop health',
      error: error.message
    });
  }
};

module.exports = {
  getLatestCropHealth,
  getCropHealthSummary,
  getCropHealthHistory,
  recalculateCropHealth
};
