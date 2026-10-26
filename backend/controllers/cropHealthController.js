const CropHealthRecord = require('../models/CropHealthRecord');
const Field = require('../models/Field');
const { calculateCropHealth } = require('../services/cropHealthEngine');
const persistentStore = require('../utils/persistentStore');
const { 
  isDbConnected,
  getStatelessFields, 
  getStatelessLatestHealthRecord,
  getStatelessHealthHistory
} = require('../utils/statelessStore');

/**
 * Verify if a farmer owns a specific field
 */
async function verifyFieldOwnership(farmerId, fieldId) {
  if (!farmerId || !fieldId) return null;

  if (isDbConnected()) {
    try {
      const field = await Field.findOne({
        _id: fieldId,
        $or: [{ farmerId }, { user: farmerId }]
      });
      if (field) return field.toObject ? field.toObject() : field;
    } catch (_) {}
  }

  // Check persistent store
  const diskField = persistentStore.getFieldById(farmerId, fieldId);
  if (diskField) return diskField;

  // Check stateless store
  const statelessFields = getStatelessFields(farmerId);
  const matched = statelessFields.find(f => (f._id === fieldId || f.id === fieldId) && f.farmerId === farmerId);
  return matched || null;
}

/**
 * @desc Get latest real-time calculated crop health snapshot for a field
 * @route GET /api/crop-health/latest/:fieldId?
 */
const getLatestCropHealth = async (req, res) => {
  try {
    const farmerId = req.user?._id || req.user?.id;
    if (!farmerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let { fieldId } = req.params;

    // Resolve field for default or unspecified request
    let targetField = null;
    if (fieldId === 'default' || !fieldId) {
      if (isDbConnected()) {
        try {
          targetField = await Field.findOne({ farmerId }).sort({ updatedAt: -1 }).lean();
        } catch (_) {}
      }
      if (!targetField) {
        const userFields = persistentStore.getFields(farmerId);
        targetField = userFields && userFields.length > 0 ? userFields[0] : null;
      }
      if (!targetField) {
        const statelessFields = getStatelessFields(farmerId);
        targetField = statelessFields && statelessFields.length > 0 ? statelessFields[0] : null;
      }

      // If farmer has no registered fields, return clean no-field response (do NOT inject Kipm paddy)
      if (!targetField) {
        return res.status(200).json({
          success: true,
          data: {
            hasField: false,
            fieldId: null,
            fieldName: null,
            crop: null,
            healthScore: null,
            status: null,
            statusHi: 'डेटा अनुपलब्ध',
            confidence: 'Low',
            message: 'Insufficient data to calculate crop health. Add your first farm to begin.',
            reasons: [],
            reasonsHi: ['फसल स्वास्थ्य की गणना के लिए खेत जोड़ें।'],
            dataSources: []
          }
        });
      }
      fieldId = targetField._id || targetField.id;
    } else {
      // Specific fieldId requested: Strictly verify ownership
      targetField = await verifyFieldOwnership(farmerId, fieldId);
      if (!targetField) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this farm parcel.'
        });
      }
    }

    let record = null;
    if (isDbConnected()) {
      try {
        record = await CropHealthRecord.findOne({ farmerId, fieldId }).sort({ calculatedAt: -1 }).lean();
      } catch (_) {}
    } else {
      record = getStatelessLatestHealthRecord(fieldId, farmerId);
    }

    // If no calculation snapshot exists yet, calculate dynamically using the verified field
    if (!record) {
      record = await calculateCropHealth({ farmerId, fieldId, fieldDoc: targetField });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching latest crop health:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate crop health',
      error: error.message
    });
  }
};

/**
 * @desc Get multi-field crop health summary for all fields of the logged-in farmer
 * @route GET /api/crop-health/summary
 */
const getCropHealthSummary = async (req, res) => {
  try {
    const farmerId = req.user?._id || req.user?.id;
    if (!farmerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let fields = [];

    if (isDbConnected()) {
      try {
        fields = await Field.find({ farmerId }).lean();
      } catch (_) {}
    }

    if (!fields || fields.length === 0) {
      fields = persistentStore.getFields(farmerId);
      if (!fields || fields.length === 0) {
        fields = getStatelessFields(farmerId);
      }
    }

    // Filter out obsolete legacy mock Plot A / field_demo_01
    fields = (fields || []).filter(f => {
      if (!f) return false;
      if (f._id === 'field_demo_01' || f.id === 'field_demo_01') return false;
      const n = (f.fieldName || f.name || '').toLowerCase();
      if (n.includes('plot a') || n.includes('main wheat field')) return false;
      return true;
    });

    // Clean empty response if farmer has no registered fields
    if (!fields || fields.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const summaries = await Promise.all(
      fields.map(async (f) => {
        const fieldId = f._id || f.id;
        let latestRecord = null;

        if (isDbConnected()) {
          try {
            latestRecord = await CropHealthRecord.findOne({ farmerId, fieldId }).sort({ calculatedAt: -1 }).lean();
          } catch (_) {}
        } else {
          latestRecord = getStatelessLatestHealthRecord(fieldId, farmerId);
        }

        if (!latestRecord) {
          latestRecord = await calculateCropHealth({ farmerId, fieldId, fieldDoc: f });
        }

        return {
          fieldId,
          fieldName: f.fieldName || f.name || latestRecord?.fieldName || 'Farm',
          crop: f.crop || latestRecord?.crop || '',
          cropStage: f.cropStage || latestRecord?.cropStage || 'Vegetative Stage',
          healthScore: latestRecord?.healthScore !== undefined ? latestRecord.healthScore : null,
          status: latestRecord?.status || 'Healthy',
          statusHi: latestRecord?.statusHi || 'स्वस्थ',
          confidence: latestRecord?.confidence || 'High',
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
    const farmerId = req.user?._id || req.user?.id;
    if (!farmerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { fieldId } = req.params;

    // Strict ownership verification
    const field = await verifyFieldOwnership(farmerId, fieldId);
    if (!field) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this farm parcel.'
      });
    }

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
      const initial = await calculateCropHealth({ farmerId, fieldId, fieldDoc: field });
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
    const farmerId = req.user?._id || req.user?.id;
    if (!farmerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let { fieldId } = req.params;

    let targetField = null;
    if (fieldId === 'default' || !fieldId) {
      if (isDbConnected()) {
        targetField = await Field.findOne({ farmerId }).sort({ updatedAt: -1 }).lean();
      }
      if (!targetField) {
        const fields = persistentStore.getFields(farmerId);
        targetField = fields && fields.length > 0 ? fields[0] : null;
      }
      if (!targetField) {
        return res.status(400).json({
          success: false,
          message: 'No farm registered. Please add a farm before calculating crop health.'
        });
      }
      fieldId = targetField._id || targetField.id;
    } else {
      targetField = await verifyFieldOwnership(farmerId, fieldId);
      if (!targetField) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this farm parcel.'
        });
      }
    }

    const newSnapshot = await calculateCropHealth({ farmerId, fieldId, fieldDoc: targetField });

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
